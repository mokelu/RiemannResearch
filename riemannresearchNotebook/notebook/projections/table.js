/**
 * The Table projection: rows and columns, no thread-following.
 *
 * Rows keep the order the structure holds them in, because a table has no
 * reason to reorder what it is showing. Connectives are not read here at all.
 */

export function renderTable(surface) {
  const graph = surface.graph;

  const describe = (relations, arrow) =>
    relations.map((r) => `${r.relation} ${arrow} ${r.other}`);

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
export function renderTableText(surface) {
  const { rows } = renderTable(surface);
  if (rows.length === 0) return "(empty)";

  const lines = rows.map(
    (row) =>
      `${row.id}\t${row.tag}\t${row.text}\t${row.leads.join("; ")}\t${row.follows.join("; ")}`,
  );

  return ["id\ttag\tsentence\tleads to\tfollows", ...lines].join("\n");
}
