/**
 * The Graph projection: nodes and wires as data, ready for any drawing library.
 *
 * Positions are deliberately absent. Where a card sits is a canvas concern, and
 * putting layout here would mean this projection knew things the structure does
 * not say.
 */

import { relationPhrase, tagLabel } from "../render/wording.js";

export function renderGraph(surface) {
  const graph = surface.graph;

  return {
    nodes: graph
      .nodes()
      .map((node) => ({
        id: node.id,
        tag: node.tag,
        label: tagLabel(node.tag),
        text: node.text,
      })),
    edges: graph
      .relations()
      .map((wire) => ({
        id: `${wire.from.id}->${wire.to.id}:${wire.relation}`,
        from: wire.from.id,
        to: wire.to.id,
        relation: wire.relation,
        phrase: relationPhrase(wire.relation),
      })),
  };
}

/** The same graph drawn in text, so the projection is usable without a UI. */
export function renderGraphText(surface) {
  const graph = surface.graph;
  if (graph.size === 0) return "(empty)";

  const lines = [];

  for (const node of graph.nodes()) {
    lines.push(`[${tagLabel(node.tag)}] ${node.id}: ${node.text}`);
    for (const wire of graph.outgoing(node.id)) {
      lines.push(`    ${relationPhrase(wire.relation)} -> ${wire.to.id}`);
    }
  }

  return lines.join("\n");
}
