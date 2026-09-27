/**
 * The JSON Schema describing valid AI output.
 *
 * This is NOT something the AI generates. It is maintained here, derived from
 * our vocabulary, and it is the small boundary the system enforces.
 *
 * One system: sentences and wires. A node is a tagged sentence; a relation is
 * a named connection between two sentences. Nothing else is legal at this
 * boundary.
 */

import { NODE_TAGS } from "./vocabulary.js";

export const reasoningSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://riemann.research/schema/reasoning.json",

  type: "object",
  additionalProperties: false,

  required: ["nodes", "relations"],

  properties: {
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
