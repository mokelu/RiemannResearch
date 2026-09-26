/**
 * The Cells projection: one editable cell per sentence.
 *
 * This is the interactive case, so it is the one that shows what the write path
 * is for. A cell never touches a node. It calls `ops`, which turns the intent
 * into a patch, which the surface validates before anything changes. If the edit
 * would make the structure illegal, the cells keep showing what they showed
 * before and the reason comes back instead.
 */

import type { Surface } from "../render/surface.js";
import type { ProposalResult } from "../render/surface.js";
import type { NodeTag, RelationLabel } from "../vocabulary.js";
import { tagLabel } from "../render/wording.js";

export type Cell = {
  id: string;
  tag: NodeTag;
  label: string;
  text: string;
  leads: readonly string[];
  follows: readonly string[];
};

export function renderCells(surface: Surface): Cell[] {
  const graph = surface.graph;

  return graph
    .nodes()
    .map((node) => ({
      id: node.id,
      tag: node.tag,
      label: tagLabel(node.tag),
      text: node.text,
      leads: graph.outgoing(node.id).map((wire) => wire.to.id),
      follows: graph.incoming(node.id).map((wire) => wire.from.id),
    }));
}

export type CellOps = {
  setText(id: string, text: string): ProposalResult;
  setTag(id: string, tag: NodeTag): ProposalResult;
  connect(from: string, relation: RelationLabel, to: string): ProposalResult;
  disconnect(
    from: string,
    relation: RelationLabel,
    to: string,
  ): ProposalResult;
  addCell(id: string, text: string, tag: NodeTag): ProposalResult;
  removeCell(id: string): ProposalResult;
};

export function cellOps(surface: Surface): CellOps {
  return {
    setText: (id, text) => surface.propose({ op: "setText", id, text }),
    setTag: (id, tag) => surface.propose({ op: "retag", id, tag }),
    connect: (from, relation, to) =>
      surface.propose({ op: "connect", from, relation, to }),
    disconnect: (from, relation, to) =>
      surface.propose({ op: "disconnect", from, relation, to }),
    addCell: (id, text, tag) =>
      surface.propose({ op: "addNode", id, text, tag }),
    removeCell: (id) => surface.propose({ op: "removeNode", id }),
  };
}
