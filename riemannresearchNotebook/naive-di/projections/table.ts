/**
 * The Table projection: rows and columns, no thread-following.
 *
 * Rows keep the order the structure holds them in, because a table has no
 * reason to reorder what it is showing. Connectives are not read here at all.
 */

import type { Surface } from "../render/surface.js";
import type { NodeTag, RelationLabel } from "../vocabulary.js";

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

export function renderTable(surface: Surface): TableProjection {
  const graph = surface.graph;

  const describe = (
    relations: { relation: RelationLabel; other: string }[],
    arrow: string,
  ) => relations.map((r) => `${r.relation} ${arrow} ${r.other}`);

  return {
    columns: ["id", "tag", "sentence", "leads to", "follows"],
    rows: graph
      .nodes()
      .map((node) => ({
        id: node.id,
        tag: node.tag,
        text: node.text,
        leads: describe(
          graph.outgoing(node.id).map((wire) => ({
            relation: wire.relation,
            other: wire.to.id,
          })),
          "->",
        ),
        follows: describe(
          graph.incoming(node.id).map((wire) => ({
            relation: wire.relation,
            other: wire.from.id,
          })),
          "<-",
        ),
      })),
  };
}

/** The same rows as plain aligned text, for anywhere there is no DOM. */
export function renderTableText(surface: Surface): string {
  const { rows } = renderTable(surface);
  if (rows.length === 0) return "(empty)";

  const lines = rows.map(
    (row) =>
      `${row.id}\t${row.tag}\t${row.text}\t${row.leads.join("; ")}\t${row.follows.join("; ")}`,
  );

  return ["id\ttag\tsentence\tleads to\tfollows", ...lines].join("\n");
}
