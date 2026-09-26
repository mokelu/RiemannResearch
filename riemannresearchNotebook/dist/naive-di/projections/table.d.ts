/**
 * The Table projection: rows and columns, no thread-following.
 *
 * Rows keep the order the structure holds them in, because a table has no
 * reason to reorder what it is showing. Connectives are not read here at all.
 */
import type { Surface } from "../render/surface.js";
import type { NodeTag } from "../vocabulary.js";
export type TableRow = {
    id: string;
    tag: NodeTag;
    text: string;
    leads: readonly string[];
    follows: readonly string[];
};
export type TableProjection = {
    columns: readonly string[];
    rows: TableRow[];
};
export declare function renderTable(surface: Surface): TableProjection;
/** The same rows as plain aligned text, for anywhere there is no DOM. */
export declare function renderTableText(surface: Surface): string;
