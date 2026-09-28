/**
 * A runnable demonstration. One structure, projected several ways, then edited
 * through the boundary that refuses what it should.
 *
 * Run with:  npm run demo
 */

import { Surface } from "./render/surface.js";
import { cellOps, renderCells } from "./projections/cells.js";
import { renderDocumentText } from "./projections/document.js";
import { renderGraphText } from "./projections/graph.js";
import { renderStructure } from "./projections/structure.js";
import { renderTableText } from "./projections/table.js";

const heading = (text) =>
  console.log(`\n${"=".repeat(62)}\n${text}\n${"=".repeat(62)}`);

/** ---------------------------------------------------------------- reasoning */

const reasoning = {
  blocks: [
    { type: "heading", level: 1, runs: [{ kind: "text", text: "John, the dog" }] },
    {
      type: "paragraph",
      runs: [
        { kind: "node", ref: "n1" },
        { kind: "node", ref: "n2" },
      ],
    },
    {
      type: "paragraph",
      runs: [
        { kind: "text", text: "It follows that " },
        { kind: "node", ref: "n3" },
      ],
    },
    { type: "quote", runs: [{ kind: "node", ref: "e1" }] },
    { type: "heading", level: 2, runs: [{ kind: "text", text: "An aside" }] },
    { type: "paragraph", runs: [{ kind: "node", ref: "l1" }] },
  ],
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
console.log(renderDocumentText(surface));

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
console.log("duplicate id  ->", ops.addCell("n1", "A second John.", "FACT", { block: 1 }));
console.log("no placement  ->", ops.addCell("n6", "A stray sentence.", "FACT"));
console.log("empty text    ->", ops.setText("n1", ""));
console.log("missing node  ->", ops.setText("n9", "nowhere to put this"));
console.log("unregistered  ->", ops.setTag("n1", "DEFINITELY_TRUE"));

heading("AN EDIT THAT PASSES, AND EVERY VIEW SEES IT");
console.log(ops.setText("n1", "John is a big dog.").applied);
console.log(renderDocumentText(surface));

heading("AN ADD THAT PLACES ITSELF IN THE DOCUMENT TOO");
console.log(ops.addCell("n7", "He barks at the postman.", "OBSERVATION", { block: 5 }).applied);
console.log(renderDocumentText(surface));

heading("REMOVING A SENTENCE CLEANS ITS POINTERS OUT OF THE BLOCKS");
console.log(ops.removeCell("n7").applied);
console.log(renderDocumentText(surface));
