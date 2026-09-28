/**
 * The JSON Schema describing valid AI output.
 *
 * This is NOT something the AI generates. It is maintained here, derived from
 * our vocabulary, and it is the small boundary the system enforces.
 *
 * One object, two dimensions. `blocks` say how the answer reads (heading,
 * paragraph, list, quote, code — each filled with runs); `nodes` and
 * `relations` say what the reasoning system knows and how it connects. A run
 * never copies a sentence: it points at one by id. Nothing else is legal at
 * this boundary.
 */

import {
  NODE_TAGS,
  BLOCK_TYPES,
  RUN_KINDS,
  MARK_TYPES,
} from "./vocabulary.js";

const run = {
  type: "object",
  additionalProperties: false,

  required: ["kind"],

  properties: {
    kind: { type: "string", enum: [...RUN_KINDS] },
    /** a kind "node" must carry `ref`; a kind "text" must carry `text` —
     *  JSON Schema cannot say that, so validate.js does. */
    ref: { type: "string", minLength: 1 },
    text: { type: "string" },
    marks: { type: "array", items: { type: "string", enum: [...MARK_TYPES] } },
    href: { type: "string", minLength: 1 },
  },
};

const runs = { type: "array", minItems: 1, items: run };

const block = {
  type: "object",
  additionalProperties: false,

  required: ["type"],

  properties: {
    type: { type: "string", enum: [...BLOCK_TYPES] },
    level: { type: "integer", minimum: 1, maximum: 6 },
    ordered: { type: "boolean" },
    language: { type: "string" },
    /** a "code" block holds plain text, not runs — validate.js enforces. */
    text: { type: "string" },
    runs,
    items: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["runs"],
        properties: { runs },
      },
    },
  },
};

export const reasoningSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://riemann.research/schema/reasoning.json",

  type: "object",
  additionalProperties: false,

  required: ["blocks", "nodes", "relations"],

  properties: {
    blocks: { type: "array", items: block },

    nodes: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,

        required: ["id", "text", "tag"],

        properties: {
          id: { type: "string", minLength: 1 },
          text: { type: "string", minLength: 1 },
          tag: { type: "string", enum: [...NODE_TAGS] },
        },
      },
    },

    relations: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,

        required: ["from", "relation", "to"],

        properties: {
          from: { type: "string", minLength: 1 },
          /**
           * Free text on purpose: the AI introduces the relation. The runtime
           * asks only that it is there and that both ends exist.
           */
          relation: { type: "string", minLength: 1 },
          to: { type: "string", minLength: 1 },
        },
      },
    },
  },
};
