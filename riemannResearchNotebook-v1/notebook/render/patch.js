/**
 * The only way an interactive view may ask for a change.
 *
 * These operations are structural, never semantic: a patch can add a sentence,
 * rename its tag or wire two sentences together, but it cannot claim anything
 * is true. A patch is applied to plain data and the result goes back through
 * the same validator the AI's output faces, so an edit made by dragging a card
 * is held to exactly the standard as one made by a model.
 *
 * Because the structure has two dimensions, an edit that touches one must keep
 * the other honest: a new sentence names where it appears in the document (or
 * the boundary would reject it as invisible), and a removed sentence is
 * un-referenced from every block in the same patch (or the boundary would
 * reject the dangling pointer). One patch, one validation — never two
 * half-editable lists.
 *
 * Nothing here mutates its input. A patch produces a new object or fails.
 *
 * A patch is one of:
 *   { op: "addNode", id, text, tag, placement: { block, position? } }
 *       — placement may be omitted only when the document has no blocks at
 *         all: the first sentence then opens the first paragraph to hold it
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

/** Thrown when a patch cannot be applied as asked, before any validation. */
export class PatchError extends Error {
  constructor(message) {
    super(message);
    this.name = "PatchError";
  }
}

/** Drop every pointer to one node, and any block left with nothing to show. */
function unreferenced(blocks, id) {
  const clean = (runs) =>
    runs.filter((run) => !(run.kind === "node" && run.ref === id));

  const kept = [];
  for (const block of blocks) {
    if (block.type === "code") {
      kept.push(block);
      continue;
    }
    if (block.type === "list") {
      const items = block.items
        .map((item) => ({ ...item, runs: clean(item.runs) }))
        .filter((item) => item.runs.length > 0);
      if (items.length > 0) kept.push({ ...block, items });
      continue;
    }
    const runs = clean(block.runs);
    if (runs.length > 0) kept.push({ ...block, runs });
  }
  return kept;
}

export function applyPatch(input, patch) {
  const has = (id) => input.nodes.some((node) => node.id === id);

  switch (patch.op) {
    case "addNode": {
      const placement = patch.placement ?? {};

      // A document with no blocks yet has nothing to name, so the first
      // sentence also opens the first paragraph to hold it. Once any block
      // exists, placement is mandatory again — a sentence never appears
      // without a place the document shows it.
      if (placement.block === undefined && input.blocks.length === 0) {
        return {
          ...input,
          blocks: [
            { type: "paragraph", runs: [{ kind: "node", ref: patch.id }] },
          ],
          nodes: [
            { id: patch.id, text: patch.text, tag: patch.tag },
          ],
        };
      }

      const index = placement.block;
      const target = input.blocks[index];
      // v1 places into the blocks that are a plain run list. A sentence for a
      // list is a fresh item — a later pass, said no to honestly here.
      if (!target || target.type === "code" || target.type === "list") {
        throw new PatchError(
          `a new sentence must name a heading, paragraph, or quote block: "placement.block" must pick one of the ${input.blocks.length} existing blocks`,
        );
      }
      const position = Math.max(
        0,
        Math.min(placement.position ?? target.runs.length, target.runs.length),
      );
      const withRun = (runs) => [
        ...runs.slice(0, position),
        { kind: "node", ref: patch.id },
        ...runs.slice(position),
      ];
      return {
        ...input,
        blocks: input.blocks.map((block, i) =>
          i === index ? { ...block, runs: withRun(block.runs) } : block,
        ),
        nodes: [
          ...input.nodes,
          { id: patch.id, text: patch.text, tag: patch.tag },
        ],
      };
    }

    case "removeNode":
      // Wires touching the removed sentence go with it, and so do the places
      // in the document that showed it.
      return {
        ...input,
        blocks: unreferenced(input.blocks, patch.id),
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
