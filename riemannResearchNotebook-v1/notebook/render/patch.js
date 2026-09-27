/**
 * The only way an interactive view may ask for a change.
 *
 * These operations are structural, never semantic: a patch can add a sentence,
 * rename its tag or wire two sentences together, but it cannot claim anything
 * is true. A patch is applied to plain data and the result goes back through
 * the same validator the AI's output faces, so an edit made by dragging a card
 * is held to exactly the standard as one made by a model.
 *
 * Nothing here mutates its input. A patch produces a new object or fails.
 *
 * A patch is one of:
 *   { op: "addNode", id, text, tag }
 *   { op: "removeNode", id }
 *   { op: "setText", id, text }
 *   { op: "retag", id, tag }
 *   { op: "connect", from, relation, to }
 *   { op: "disconnect", from, relation, to }
 */

/** Thrown when a patch names a node that is not in the structure. */
export class UnknownNodeError extends Error {
  constructor(id) {
    super(`no node with id "${id}" to edit`);
    this.name = "UnknownNodeError";
  }
}

export function applyPatch(input, patch) {
  const has = (id) => input.nodes.some((node) => node.id === id);

  switch (patch.op) {
    case "addNode":
      return {
        ...input,
        nodes: [
          ...input.nodes,
          { id: patch.id, text: patch.text, tag: patch.tag },
        ],
      };

    case "removeNode":
      // Wires touching the removed sentence go with it.
      return {
        ...input,
        nodes: input.nodes.filter((node) => node.id !== patch.id),
        relations: input.relations.filter(
          (relation) => relation.from !== patch.id && relation.to !== patch.id,
        ),
      };

    case "setText": {
      if (!has(patch.id)) throw new UnknownNodeError(patch.id);
      return {
        ...input,
        nodes: input.nodes.map((node) =>
          node.id === patch.id ? { ...node, text: patch.text } : node,
        ),
      };
    }

    case "retag": {
      if (!has(patch.id)) throw new UnknownNodeError(patch.id);
      return {
        ...input,
        nodes: input.nodes.map((node) =>
          node.id === patch.id ? { ...node, tag: patch.tag } : node,
        ),
      };
    }

    case "connect":
      return {
        ...input,
        relations: [
          ...input.relations,
          { from: patch.from, relation: patch.relation, to: patch.to },
        ],
      };

    case "disconnect":
      return {
        ...input,
        relations: input.relations.filter(
          (relation) =>
            !(
              relation.from === patch.from &&
              relation.relation === patch.relation &&
              relation.to === patch.to
            ),
        ),
      };
  }
}
