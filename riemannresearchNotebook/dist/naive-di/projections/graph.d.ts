/**
 * The Graph projection: nodes and wires as data, ready for any drawing library.
 *
 * Positions are deliberately absent. Where a card sits is a canvas concern, and
 * putting layout here would mean this projection knew things the structure does
 * not say.
 */
import type { Surface } from "../render/surface.js";
import type { NodeTag, RelationLabel } from "../vocabulary.js";
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
export declare function renderGraph(surface: Surface): GraphProjection;
/** The same graph drawn in text, so the projection is usable without a UI. */
export declare function renderGraphText(surface: Surface): string;
