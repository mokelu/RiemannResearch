/**
 * The Project Grammar as types.
 *
 * Prose master: IKMokelu-001_Frozen/vocari/datastore/projectgrammar.md
 * This file mirrors its vocabulary and record shapes; grammar.test.ts
 * asserts the code stays consistent with the rules.
 *
 * Only two content words exist: File and Component.
 * The word "artifact" is retired — nothing here may use it.
 */

/* -------------------------------- section A: DuckDB ------------------------------- */

/** The datalake = the duckDB wasm database, in-browser and local. */
export type DataLakeName = "duckdb-wasm";

/** A column of one of the two datalake tables. */
export interface DatalakeColumn {
  readonly name: string;
  readonly kind: "bytes" | "text" | "number" | "json";
}

/** One table of the datalake. Exactly two exist: blob and dataset. */
export interface DatalakeTable {
  readonly table: "blob" | "dataset";
  readonly columns: readonly DatalakeColumn[];
}

/** The rule that closes the door on the datalake. */
export type DatalakeAdmission =
  | "storable-as-bytes"
  | "storable-as-columns-and-rows";

/* ------------------------------ section B: SurrealDB ------------------------------ */

/** The SurrealDB wasm store holds exactly five record-types, no more. */
export type RecordTypeName =
  | "notebook"
  | "conversation"
  | "message"
  | "file_record"
  | "view_state";

/** The columns of one record-type, as declared in the grammar. */
export interface RecordTypeColumns {
  readonly type: RecordTypeName;
  readonly columns: readonly string[];
}

/** The rule that closes the door on SurrealDB. */
export type SurrealAdmission = "decomposes-into-one-of-the-five";

/* --------------------------- section C: cross-store words ------------------------- */

/** The only two content kinds. No third content kind exists. */
export type ContentKind = "file" | "component";

/** A File = file_record (SurrealDB) + the blob (DuckDB) its blob_id points to. */
export interface FileObject {
  readonly record: "file_record";
  readonly blob: "blob";
  /** How the file came to exist. Both are files. */
  readonly creation: "user-brought-in" | "made-inside-notebook";
  /** Stable identity: never changes across edits. */
  readonly id: string;
  readonly blob_id: string;
  /** The file's type is its format string. Open set: any string. */
  readonly format: string;
}

/** Edit-in-place: what a save is allowed to change, and nothing else. */
export interface InPlaceEditDelta {
  readonly changes: readonly ["blob.bytes", "blob.byte_len", "file_record.size", "blob.format?"];
  readonly neverChanges: readonly ["file_record.id", "blob.blob_id", "file_record.blob_id"];
}

/** A Component = what the person places on the canvas. Live tool, not stored content. */
export interface ComponentObject {
  readonly kind: "component";
  /** Examples named by the grammar; the set is open for future UI widgets. */
  readonly widget:
    | "calendar"
    | "kanban"
    | "alarm"
    | "chart"
    | "spreadsheet"
    | "button"
    | "slider"
    | "markdown-editor"
    | (string & {});
  /** A component displays and lets you edit; it never RUNS what it shows. */
  readonly runsWhatItShows: false;
}

/** The per-format bridge on the READ side: bytes -> usable form, and picks the component. */
export interface Adapter {
  readonly format: string;
  readonly direction: "decode";
  readonly bytesToUsableForm: true;
  readonly picksComponent: true;
}

/** The per-format counterpart on the WRITE side: component content -> bytes. */
export interface Serializer {
  readonly format: string;
  readonly direction: "encode";
  /** The Serializer produces bytes; the generic write stores them. */
  readonly isDatabaseWriter: false;
  /** The Component holds the editing state. */
  readonly isEditor: false;
}

/** The full loop across the format boundary. */
export const GRAMMAR_FLOW = [
  "file-bytes",
  "adapter",
  "component",
  "serializer",
  "file-bytes",
] as const;
export type GrammarFlow = typeof GRAMMAR_FLOW;

/** The File <-> Component pairing is view/workspace state — never on file_record. */
export interface FileComponentLink {
  readonly home: "view_state";
  readonly fileSide: "view_state.active_file_id";
  readonly componentSide: "view_state.active_component";
}

/** The closed set of modes. */
export type ModeName =
  | "focus"
  | "canvas"
  | "graph"
  | "table"
  | "list"
  | "code"
  | "timeline";
