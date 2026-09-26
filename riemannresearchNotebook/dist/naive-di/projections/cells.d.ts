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
export type Cell = {
    id: string;
    tag: NodeTag;
    label: string;
    text: string;
    leads: readonly string[];
    follows: readonly string[];
};
export declare function renderCells(surface: Surface): Cell[];
export type CellOps = {
    setText(id: string, text: string): ProposalResult;
    setTag(id: string, tag: NodeTag): ProposalResult;
    connect(from: string, relation: RelationLabel, to: string): ProposalResult;
    disconnect(from: string, relation: RelationLabel, to: string): ProposalResult;
    addCell(id: string, text: string, tag: NodeTag): ProposalResult;
    removeCell(id: string): ProposalResult;
};
export declare function cellOps(surface: Surface): CellOps;
