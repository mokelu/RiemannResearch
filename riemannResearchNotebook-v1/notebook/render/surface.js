/**
 * The surface: the only handle a projection is given.
 *
 * It owns the canonical live structure. A projection may read it and may
 * subscribe to change, and an interactive projection may propose an edit — but
 * nothing may reach in and alter a node. That is what keeps the structure, and
 * not the UI, the source of truth.
 *
 * A proposal is applied to plain data and re-validated. If validation fails,
 * the structure is left exactly as it was and the errors come back to the
 * view. There is no way to put the surface into an invalid state.
 */

import { validateReasoning } from "../validate.js";
import { materialize } from "../runtime.js";
import { applyPatch, UnknownNodeError } from "./patch.js";

export class Surface {
  #data;
  #graph;
  #listeners = new Set();

  /** Prefer `Surface.open`; this expects data that already passed the validator. */
  constructor(valid) {
    this.#data = valid;
    this.#graph = materialize(valid);
  }

  /** Open a surface on AI output, throwing if it is not structurally valid. */
  static open(value) {
    const result = validateReasoning(value);
    if (!result.valid) {
      throw new Error(`rejected at the boundary: ${result.errors.join("; ")}`);
    }
    return new Surface(result.data);
  }

  static empty() {
    return Surface.open({ nodes: [], relations: [] });
  }

  /** The live structure. Read-only by construction: no setters are exposed. */
  get graph() {
    return this.#graph;
  }

  get size() {
    return this.#graph.size;
  }

  /** Plain data again — the canonical JSON, unchanged by any projection. */
  toJSON() {
    return this.#graph.toJSON();
  }

  /** Be told whenever the structure changes. Returns a way to stop listening. */
  subscribe(listener) {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  /** Ask for a structural change. The only write path that exists. */
  propose(patch) {
    let next;

    try {
      next = applyPatch(this.#data, patch);
    } catch (error) {
      if (error instanceof UnknownNodeError) {
        return { applied: false, errors: [error.message] };
      }
      throw error;
    }

    const result = validateReasoning(next);
    if (!result.valid) {
      return { applied: false, errors: result.errors };
    }

    this.#data = result.data;
    this.#graph = materialize(result.data);

    for (const listener of this.#listeners) listener(this.#graph);
    return { applied: true };
  }
}
