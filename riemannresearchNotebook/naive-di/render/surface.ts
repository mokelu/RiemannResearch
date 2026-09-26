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

import { validateNaiveDI, type ValidatedNaiveDI } from "../validate.js";
import { materialize, type ReasoningGraph } from "../runtime.js";
import type { NaiveDIInput } from "../schema.js";
import {
  applyPatch,
  UnknownContractError,
  UnknownNodeError,
  type Patch,
} from "./patch.js";

export type ProposalResult =
  | { applied: true }
  | { applied: false; errors: string[] };

export type Listener = (graph: ReasoningGraph) => void;

export class Surface {
  #data: NaiveDIInput;
  #graph: ReasoningGraph;
  #listeners = new Set<Listener>();

  private constructor(valid: ValidatedNaiveDI) {
    this.#data = valid;
    this.#graph = materialize(valid);
  }

  /** Open a surface on AI output, throwing if it is not structurally valid. */
  static open(value: unknown): Surface {
    const result = validateNaiveDI(value);
    if (!result.valid) {
      throw new Error(`rejected at the boundary: ${result.errors.join("; ")}`);
    }
    return new Surface(result.data);
  }

  static empty(): Surface {
    return Surface.open({ nodes: [], relations: [] });
  }

  /** The live structure. Read-only by construction: no setters are exposed. */
  get graph(): ReasoningGraph {
    return this.#graph;
  }

  get size(): number {
    return this.#graph.size;
  }

  /** Plain data again — the canonical JSON, unchanged by any projection. */
  toJSON(): NaiveDIInput {
    return this.#graph.toJSON();
  }

  /** Be told whenever the structure changes. Returns a way to stop listening. */
  subscribe(listener: Listener): () => void {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  /** Ask for a structural change. The only write path that exists. */
  propose(patch: Patch): ProposalResult {
    let next: NaiveDIInput;

    try {
      next = applyPatch(this.#data, patch);
    } catch (error) {
      if (
        error instanceof UnknownNodeError ||
        error instanceof UnknownContractError
      ) {
        return { applied: false, errors: [error.message] };
      }
      throw error;
    }

    const result = validateNaiveDI(next);
    if (!result.valid) {
      return { applied: false, errors: result.errors };
    }

    this.#data = result.data;
    this.#graph = materialize(result.data);

    for (const listener of this.#listeners) listener(this.#graph);
    return { applied: true };
  }
}
