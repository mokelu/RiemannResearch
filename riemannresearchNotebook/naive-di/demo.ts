/**
 * A runnable demonstration. One structure, projected several ways, then placed
 * under contract and proved two different ways: by execution and by judgement.
 *
 * Run with:  npm run demo
 */

import { Surface } from "./render/surface.js";
import type { NodeTag } from "./vocabulary.js";
import type { Contract } from "./schema.js";
import { NoExecutorError, runProof, type ProofEnvironment } from "./contract/adapter.js";
import { cellOps, renderCells } from "./projections/cells.js";
import { renderContracts } from "./projections/contracts.js";
import { renderDocument } from "./projections/document.js";
import { renderGraphText } from "./projections/graph.js";
import { renderStructure } from "./projections/structure.js";
import { renderTableText } from "./projections/table.js";

const heading = (text: string) =>
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
console.log("unregistered  ->", ops.setTag("n1", "DEFINITELY_TRUE" as NodeTag));

/** ------------------------------------------------------------------ contracts */

const contracts = {
  nodes: [
    { id: "s1", text: "This email must be unique.", tag: "REQUIREMENT" },
    { id: "s2", text: "The opening is compelling.", tag: "REQUIREMENT" },
    { id: "s3", text: "The video runs under eight minutes.", tag: "CONSTRAINT" },
    { id: "s4", text: "A player starts with one hundred health.", tag: "REQUIREMENT" },
    { id: "v1", text: "The edit places the evidence before the finding.", tag: "FACT" },
  ],
  relations: [],
  contracts: [
    {
      id: "c-email",
      sentence: "s1",
      domain: "code",
      output: { kind: "file", path: "user_email.surql", language: "surrealdb" },
      proof: {
        kind: "executor",
        setup: "temporary SurrealDB",
        action: "create two users with the same email",
        expects: "the second create is rejected",
      },
    },
    {
      id: "c-opening",
      sentence: "s2",
      domain: "video",
      output: { kind: "node", target: "v1" },
      proof: {
        kind: "jev",
        question: "Is the opening compelling?",
        decision: "Score",
        accepts: { min: 0.8 },
      },
    },
    {
      id: "c-length",
      sentence: "s3",
      domain: "video",
      output: { kind: "file", path: "cut.mp4", language: "ffmpeg" },
      proof: {
        kind: "executor",
        setup: "the rendered cut",
        action: "measure duration",
        expects: "480 seconds or less",
      },
    },
    {
      id: "c-health",
      sentence: "s4",
      domain: "game",
      output: { kind: "file", path: "player.ts", language: "typescript" },
      proof: {
        kind: "executor",
        setup: "the test runner",
        action: "spawn a player",
        expects: "health equals 100",
      },
    },
  ] satisfies Contract[],
};

const made = Surface.open(contracts);

/**
 * Stub executors. The real ones talk to a temporary database, a compiler or a
 * renderer; these exist so the lifecycle can be seen without any of them.
 */
const environment: ProofEnvironment = {
  executors: {
    surrealdb: async () => ({ outcome: "PASS", detail: "duplicate rejected" }),
    typescript: async () => ({ outcome: "FAIL", detail: "health was 90" }),
  },
  judge: async ({ proof }) => ({
    decision: proof.decision === "Score" ? 0.82 : "unanswered",
  }),
  judgeVersion: "jev-1",
};

async function prove(made: Surface, id: string): Promise<void> {
  const contract = made.graph.contract(id);
  if (!contract) return;

  try {
    const verdict = await runProof(contract, contract.text, environment);
    const recorded = made.propose({ op: "recordVerdict", id, verdict });
    console.log(`${id.padEnd(11)} -> ${verdict.outcome.padEnd(13)} recorded: ${recorded.applied}`);
  } catch (error) {
    if (error instanceof NoExecutorError) {
      console.log(`${id.padEnd(11)} -> cannot prove: ${error.message}`);
      return;
    }
    throw error;
  }
}

heading("FOUR SENTENCES UNDER CONTRACT, NOTHING PROVED YET");
console.log(renderContracts(made));

heading("RUN THE PROOFS");
for (const id of ["c-email", "c-opening", "c-length", "c-health"]) {
  await prove(made, id);
}
console.log();
console.log(renderContracts(made));

heading("THE HUMAN EDITS A SENTENCE, AND A GREEN VERDICT GOES STALE");
const cellEdits = cellOps(made);
cellEdits.setText("s1", "This email must be unique within an organisation.");
console.log(renderContracts(made, { judgeVersion: "jev-1" }));

heading("A NEW JUDGE VERSION BREAKS A JUDGED LOCK, NOT A MECHANICAL ONE");
console.log(renderContracts(made, { judgeVersion: "jev-2" }));

heading("THE CANONICAL OBJECT, NOW WITH CONTRACTS ATTACHED");
console.log(renderStructure(made));
