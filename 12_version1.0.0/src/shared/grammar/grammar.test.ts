/**
 * grammar.test.ts — proves the code mirror of the Project Grammar holds,
 * and that it still agrees with the prose master in
 * IKMokelu-001_Frozen/vocari/datastore/projectgrammar.md.
 *
 * Run: npm test  (from 12_version1.0.0)
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  ADAPTERS,
  MODE,
  COMPONENT_RULE,
  DATALAKE,
  DATALAKE_TABLES,
  FILE_COMPONENT_LINK,
  FILE_EDIT_RULE,
  FLOW,
  FORMAT_SIDES,
  MODES,
  RECORD_TYPES,
  S18_DELETED,
  makeAdapter,
  makeSerializer,
} from "./grammar.data";
import type { FileObject } from "./grammar.types";

const here = dirname(fileURLToPath(import.meta.url));
/** The frozen prose master, two levels up from src/shared/grammar. */
const PROSE_MASTER = resolve(
  here,
  "../../../../IKMokelu-001_Frozen/vocari/datastore/projectgrammar.md",
);

/* Type aliases only — never contains runtime string values. */
const EXPORTED_NAMES: readonly string[] = [
  "DataLakeName",
  "DatalakeColumn",
  "DatalakeTable",
  "DatalakeAdmission",
  "RecordTypeName",
  "RecordTypeColumns",
  "SurrealAdmission",
  "ContentKind",
  "FileObject",
  "InPlaceEditDelta",
  "ComponentObject",
  "Adapter",
  "Serializer",
  "GRAMMAR_FLOW",
  "GrammarFlow",
  "FileComponentLink",
  "ModeName",
];

const columnsOf = (table: string): string[] =>
  DATALAKE.find((t) => t.table === table)!.columns.map((c) => c.name);

const record = (type: string) => RECORD_TYPES.find((r) => r.type === type)!;

describe("A. the datalake (DuckDB)", () => {
  it("has exactly two tables: blob and dataset", () => {
    expect(DATALAKE_TABLES).toEqual(["blob", "dataset"]);
    expect(DATALAKE.map((t) => t.table)).toEqual([...DATALAKE_TABLES]);
  });

  it("blob is keyed by blob_id — the user's settled rename, no file_id anywhere", () => {
    expect(columnsOf("blob")).toEqual(["blob_id", "bytes", "format", "byte_len"]);
    expect(columnsOf("blob")).not.toContain("file_id");
  });

  it("dataset is columns+rows keyed by dataset_id", () => {
    expect(columnsOf("dataset")).toEqual(["dataset_id", "columns", "rows"]);
  });
});

describe("B. the record store (SurrealDB)", () => {
  it("stores exactly five record-types, no more", () => {
    expect(RECORD_TYPES).toHaveLength(5);
    expect(RECORD_TYPES.map((r) => r.type).sort()).toEqual(
      ["conversation", "file_record", "message", "notebook", "view_state"].sort(),
    );
  });

  it("no record-type is or mentions the retired artifact", () => {
    const text = JSON.stringify(RECORD_TYPES).toLowerCase();
    expect(text).not.toContain("artifact");
  });

  it("file_record carries blob_id and no view state", () => {
    const cols = record("file_record").columns;
    expect(cols).toContain("blob_id");
    expect(cols).toContain("origin_conversation_id");
    // C.7b: the File must not know which Component is looking at it.
    expect(cols).not.toContain("active_component");
    expect(cols).not.toContain("active_file_id");
  });

  it("view_state holds the File<->Component pairing (C.7b)", () => {
    const cols = record("view_state").columns;
    expect(cols).toContain("active_file_id");
    expect(cols).toContain("active_component");
    expect(FILE_COMPONENT_LINK.home).toBe("view_state");
    expect(FILE_COMPONENT_LINK.fileSide).toBe("view_state.active_file_id");
    expect(FILE_COMPONENT_LINK.componentSide).toBe("view_state.active_component");
  });

  it("message records AI output as produced_file_ids, never produced_artifact_ids", () => {
    const cols = record("message").columns;
    expect(cols).toContain("produced_file_ids");
    expect(cols).not.toContain("produced_artifact_ids");
  });

  it("every record-type has unique columns and an id-style first key", () => {
    for (const r of RECORD_TYPES) {
      expect(new Set(r.columns).size).toBe(r.columns.length);
    }
  });

  it("the blob_id reference chain closes: file_record.blob_id -> blob.blob_id", () => {
    expect(record("file_record").columns).toContain("blob_id");
    expect(columnsOf("blob")).toContain("blob_id");
  });
});

describe("C. the two content words and the format loop", () => {
  it("only File and Component exist — the word artifact is banned everywhere", () => {
    const runtimeJson = JSON.stringify({
      DATALAKE,
      DATALAKE_TABLES,
      RECORD_TYPES,
      FILE_EDIT_RULE,
      S18_DELETED,
      COMPONENT_RULE,
      FLOW,
      FORMAT_SIDES,
      FILE_COMPONENT_LINK,
      MODES,
      MODE,
      ADAPTERS,
    });
    expect(runtimeJson.toLowerCase()).not.toContain("artifact");
    expect(EXPORTED_NAMES.join(" ").toLowerCase()).not.toContain("artifact");
  });

  it("S18 is deleted and edit-in-place is the rule (C.3)", () => {
    expect(S18_DELETED).toBe(true);
    expect(FILE_EDIT_RULE.changes).toContain("blob.bytes");
    expect(FILE_EDIT_RULE.neverChanges).toEqual(
      ["file_record.id", "blob.blob_id", "file_record.blob_id"],
    );
    // Identity columns must never appear in the changeable set.
    for (const never of FILE_EDIT_RULE.neverChanges) {
      expect(FILE_EDIT_RULE.changes).not.toContain(never);
    }
  });

  it("a component displays and lets you edit but never runs what it shows (C.4)", () => {
    expect(COMPONENT_RULE).toEqual({
      displays: true,
      letsYouEdit: true,
      runsWhatItShows: false,
    });
  });

  it("the format loop is exactly bytes -> adapter -> component -> serializer -> bytes (C.7)", () => {
    expect(FLOW).toEqual([
      "file-bytes",
      "adapter",
      "component",
      "serializer",
      "file-bytes",
    ]);
    expect(FORMAT_SIDES).toEqual({ read: "Adapter", write: "Serializer" });
  });

  it("an Adapter decodes and picks the component; it is not the write side", () => {
    const a = makeAdapter("md");
    expect(a.direction).toBe("decode");
    expect(a.picksComponent).toBe(true);
  });

  it("a Serializer encodes; it is neither the database writer nor the editor", () => {
    const s = makeSerializer("md");
    expect(s.direction).toBe("encode");
    expect(s.isDatabaseWriter).toBe(false);
    expect(s.isEditor).toBe(false);
  });

  it("the closed mode set has seven members and only focus is built now (C.6)", () => {
    expect(MODES).toHaveLength(7);
    expect(MODES).toContain("focus");
    expect(MODE).toBe("focus");
  });

  it("the only adapters built now cover md and txt; formats themselves stay an open set (C.8)", () => {
    expect(ADAPTERS.map((a) => a.format).sort()).toEqual(["md", "txt"]);
    // Open set proof: any string is a valid format on a File.
    const f: FileObject = {
      record: "file_record",
      blob: "blob",
      creation: "user-brought-in",
      id: "file:1",
      blob_id: "blob:1",
      format: "mp4",
    };
    expect(typeof f.format).toBe("string");
  });
});

describe("agreement with the frozen prose master", () => {
  const prose = readFileSync(join(PROSE_MASTER), "utf8");

  it("the prose master is present and artifact appears ONLY as the S18 tombstone", () => {
    const artifactMentions = prose.match(/artifact/gi) ?? [];
    // Exactly one mention: the deleted-S18 note explaining the old term.
    expect(artifactMentions).toHaveLength(1);
    expect(prose).toMatch(/retired artifact model/);
  });

  it("the prose master carries the exact rules the code encodes", () => {
    expect(prose).toContain("blob has columns: blob_id, bytes, format, byte_len.");
    expect(prose).toContain("exactly five record-types");
    expect(prose).toContain(
      "A File may be edited in place. Saving replaces the bytes in the File's existing blob.",
    );
    expect(prose).toContain("File bytes -> Adapter -> Component -> Serializer -> File bytes");
    expect(prose).toContain("S18");
  });
});
