/**
 * A runnable demonstration. One structure, projected several ways, then edited
 * through the boundary that refuses what it should.
 *
 * Run with:  npm run demo
 */

import { Surface } from "./render/surface.js";
import { cellOps, renderCells } from "./projections/cells.js";
import { renderDocument } from "./projections/document.js";
import { renderGraphText } from "./projections/graph.js";
import { renderStructure } from "./projections/structure.js";
import { renderTableText } from "./projections/table.js";

const heading = (text) =>
  console.log(`\n${"=".repeat(62)}\n${text}\n${"=".repeat(62)}`);

/** ---------------------------------------------------------------- reasoning */

const reasoning = {
  nodes: [
    { id: "n1", text: "John is a dog.", tag: "ASSUMPTION" },
    { id: "n2", text: "John has four legs.", tag: "CONSEQUENCE" },
    { id: "n3", text: "John is an animal.", tag: "INFERENCE" },
    { id: "e1", text: "I saw John walking on four legs.", tag: "EVIDENCE" },
    { id: "l1", text: "Cats are independent.", tag: "FACT" },
  ],
  relations: [
    { from: "n1", relation: "implies", to: "n2" },
    { from: "n2", relation: "implies", to: "n3" },
    { from: "e1", relation: "leans on", to: "n2" },
  ],
};

const surface = Surface.open(reasoning);

heading("DOCUMENT");
console.log(renderDocument(surface));

heading("GRAPH");
console.log(renderGraphText(surface));

heading("TABLE");
console.log(renderTableText(surface));

heading("CELLS");
for (const cell of renderCells(surface)) {
  console.log(`${cell.label.padEnd(12)} ${cell.text}`);
}

heading("STRUCTURE — the canonical object shown as itself");
console.log(renderStructure(surface));

heading("EDITS THE STRUCTURE REFUSES");
const ops = cellOps(surface);
console.log("duplicate id  ->", ops.addCell("n1", "A second John.", "FACT"));
console.log("empty text    ->", ops.setText("n1", ""));
console.log("missing node  ->", ops.setText("n9", "nowhere to put this"));
console.log("unregistered  ->", ops.setTag("n1", "DEFINITELY_TRUE"));

heading("AN EDIT THAT PASSES, AND EVERY VIEW SEES IT");
console.log(ops.setText("n1", "John is a big dog.").applied);
console.log(renderDocument(surface));
