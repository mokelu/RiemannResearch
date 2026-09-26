/**
 * The Graph projection: nodes and wires as data, ready for any drawing library.
 *
 * Positions are deliberately absent. Where a card sits is a canvas concern, and
 * putting layout here would mean this projection knew things the structure does
 * not say.
 */

import type { Surface } from "../render/surface.js";
import type { NodeTag, RelationLabel } from "../vocabulary.js";
import { relationPhrase, tagLabel } from "../render/wording.js";

export type GraphNode = {
  id: string;
  tag: NodeTag;
  label: string;
  text: string;
};

export type GraphEdge = {
  id: string;
  from: string;
  to: string;
  /** The AI's own word for the connection. */
  relation: RelationLabel;
  /** How that word reads, from the wording table, or the same word again. */
  phrase: string;
};

export type GraphProjection = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

export function renderGraph(surface: Surface): GraphProjection {
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
export function renderGraphText(surface: Surface): string {
  const graph = surface.graph;
  if (graph.size === 0) return "(empty)";

  const lines: string[] = [];

  for (const node of graph.nodes()) {
    lines.push(`[${tagLabel(node.tag)}] ${node.id}: ${node.text}`);
    for (const wire of graph.outgoing(node.id)) {
      lines.push(`    ${relationPhrase(wire.relation)} -> ${wire.to.id}`);
    }
  }

  return lines.join("\n");
}
