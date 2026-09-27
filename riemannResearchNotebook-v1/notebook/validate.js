/**
 * The validator: the non-AI checkpoint between AI output and the runtime.
 *
 * Ajv handles shape: types, required fields, closed objects, registered tags.
 * What JSON Schema cannot express is cross-reference, so those rules are
 * written here by hand:
 *
 *   - node ids are unique
 *   - every relation points at two nodes that exist
 *
 * All of these are structural. Whether a relation *holds* is never asked here.
 */

import Ajv2020 from "ajv/dist/2020.js";
import { reasoningSchema } from "./schema.js";

const ajv = new Ajv2020({
  allErrors: true,
  strict: true,
});

const schemaCheck = ajv.compile(reasoningSchema);

/**
 * A stamp, not a property. Only `validateReasoning` puts it on data, so anything
 * carrying it is guaranteed by construction to have passed the boundary check.
 * In TypeScript this lived only in the types and vanished at runtime; in plain
 * JavaScript we make it real — a non-enumerable symbol the runtime can verify —
 * so the boundary still cannot be skipped by accident.
 */
export const VALIDATED = Symbol("riemann.reasoning.validated");

function duplicates(ids) {
  const seen = new Set();
  const again = new Set();
  for (const id of ids) {
    if (seen.has(id)) again.add(id);
    else seen.add(id);
  }
  return again;
}

export function validateReasoning(value) {
  if (!schemaCheck(value)) {
    return {
      valid: false,
      data: undefined,
      errors: (schemaCheck.errors ?? []).map(
        (e) => `${e.instancePath || "/"} ${e.message ?? ""}`.trim(),
      ),
    };
  }

  const data = value;
  const ids = new Set(data.nodes.map((node) => node.id));

  const errors = [
    ...[...duplicates(data.nodes.map((node) => node.id))].map(
      (id) => `node id "${id}" appears more than once`,
    ),
    ...data.relations
      .filter((relation) => !ids.has(relation.from) || !ids.has(relation.to))
      .map(
        (relation) =>
          `relation ${relation.from} -[${relation.relation}]-> ${relation.to} points at a node that does not exist`,
      ),
  ];

  if (errors.length > 0) {
    return { valid: false, data: undefined, errors };
  }

  Object.defineProperty(data, VALIDATED, {
    value: true,
    enumerable: false,
    configurable: true,
  });

  return { valid: true, data, errors: [] };
}
