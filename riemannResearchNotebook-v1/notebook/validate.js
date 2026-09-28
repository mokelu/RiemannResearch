/**
 * The validator: the non-AI checkpoint between AI output and the runtime.
 *
 * Ajv handles shape: types, required fields, closed objects, registered tags,
 * closed block/run/mark lists. What JSON Schema cannot express is
 * cross-reference, so those rules are written here by hand:
 *
 *   - node ids are unique
 *   - every relation points at two nodes that exist
 *   - every run carries what its kind demands (a pointer a `ref`, text a `text`)
 *   - every run that points, points at a node that exists
 *   - every node is referenced by at least one block — known but invisible
 *     is not allowed
 *   - only a `code` block carries `text`; every other block carries `runs`
 *   - `level` belongs to headings, `ordered`/`items` to lists, nothing to
 *     blocks that cannot use them
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

/** Every run in the document, with a label saying where it lives. */
export function collectRuns(blocks) {
  const found = [];
  for (const [i, block] of blocks.entries()) {
    if (block.type === "code") continue;
    if (block.type === "list") {
      for (const [k, item] of (block.items ?? []).entries()) {
        for (const [j, r] of (item.runs ?? []).entries()) {
          found.push({
            run: r,
            where: `blocks[${i}] ("list") items[${k}] runs[${j}]`,
          });
        }
      }
      continue;
    }
    for (const [j, r] of (block.runs ?? []).entries()) {
      found.push({ run: r, where: `blocks[${i}] ("${block.type}") runs[${j}]` });
    }
  }
  return found;
}

/** Which node ids the document actually shows, in order of first appearance. */
export function referencedIds(blocks) {
  return collectRuns(blocks)
    .filter(({ run }) => run.kind === "node")
    .map(({ run }) => run.ref);
}

function blockErrors(blocks, ids) {
  const errors = [];

  for (const [i, block] of blocks.entries()) {
    if (block.type === "code") {
      if (typeof block.text !== "string") {
        errors.push(`blocks[${i}] ("code") must carry "text" as a string`);
      }
      if ("runs" in block) {
        errors.push(`blocks[${i}] ("code") carries "runs", which only a non-code block may have`);
      }
      continue;
    }

    if (block.type === "list") {
      if (!Array.isArray(block.items) || block.items.length === 0) {
        errors.push(`blocks[${i}] ("list") must carry a non-empty "items" list`);
      }
    } else if (!Array.isArray(block.runs) || block.runs.length === 0) {
      errors.push(`blocks[${i}] ("${block.type}") must carry a non-empty "runs" list`);
    }

    if ("level" in block && block.type !== "heading") {
      errors.push(`blocks[${i}] ("${block.type}") carries "level", which only a heading may have`);
    }
    if (("ordered" in block || "items" in block) && block.type !== "list") {
      errors.push(`blocks[${i}] ("${block.type}") carries list parts, which only a list may have`);
    }
    if ("text" in block) {
      errors.push(`blocks[${i}] ("${block.type}") carries "text", which only a "code" block may have`);
    }
  }

  const shown = new Set();
  for (const { run, where } of collectRuns(blocks)) {
    if (run.kind === "node") {
      if (typeof run.ref !== "string") {
        errors.push(`${where} is a node run without a "ref"`);
      } else if (!ids.has(run.ref)) {
        errors.push(`${where} points at node "${run.ref}", which does not exist`);
      } else {
        shown.add(run.ref);
      }
    } else if (typeof run.text !== "string") {
      errors.push(`${where} is a text run without "text"`);
    }
  }

  for (const id of ids) {
    if (!shown.has(id)) {
      errors.push(`node "${id}" is not referenced by any block — nothing would show it`);
    }
  }

  return errors;
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
    ...blockErrors(data.blocks, ids),
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
