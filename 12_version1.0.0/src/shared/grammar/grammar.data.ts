/**
 * The Project Grammar as data — the one source of truth mirrored from
 * IKMokelu-001_Frozen/vocari/datastore/projectgrammar.md.
 *
 * If the prose master changes, change it HERE first, then let
 * grammar.test.ts prove the rest of the codebase follows.
 */

import type {
  Adapter,
  DatalakeTable,
  FileComponentLink,
  InPlaceEditDelta,
  ModeName,
  RecordTypeColumns,
  Serializer,
} from "./grammar.types";

/* ---------------------------- A. DuckDB (the datalake) ---------------------------- */

/** A.2 — the datalake has exactly two tables. */
export const DATALAKE_TABLES = ["blob", "dataset"] as const;

/** A.3/A.4 — the tables and their columns, exactly as the grammar declares them. */
export const DATALAKE: readonly DatalakeTable[] = [
  {
    table: "blob",
    columns: [
      { name: "blob_id", kind: "text" },
      { name: "bytes", kind: "bytes" },
      { name: "format", kind: "text" },
      { name: "byte_len", kind: "number" },
    ],
  },
  {
    table: "dataset",
    columns: [
      { name: "dataset_id", kind: "text" },
      { name: "columns", kind: "json" },
      { name: "rows", kind: "json" },
    ],
  },
];

/** A.5 — the door rule of the datalake. */
export const DATALAKE_DOOR =
  "Can it be stored as bytes or (columns+rows of a table)?" as const;

/* ------------------------------ B. SurrealDB -------------------------------------- */

/** B.1/B.2 — exactly five record-types, no more, no fewer. */
export const RECORD_TYPES: readonly RecordTypeColumns[] = [
  {
    type: "notebook",
    columns: ["id", "owner", "title", "created", "last_changed"],
  },
  {
    type: "conversation",
    columns: ["id", "notebook_id", "title", "created", "message_ids"],
  },
  {
    type: "message",
    columns: [
      "id",
      "conversation_id",
      "role",
      "content",
      "timestamp",
      "produced_file_ids",
    ],
  },
  {
    type: "file_record",
    columns: [
      "id",
      "notebook_id",
      "name",
      "format",
      "size",
      "created_time",
      "blob_id",
      "origin_conversation_id",
    ],
  },
  {
    type: "view_state",
    columns: [
      "notebook_id",
      "active_file_id",
      "active_component",
      "active_conversation_id",
      "layout",
      "theme",
      "panel_widths",
    ],
  },
];

/** B.3 — the door rule of SurrealDB. */
export const SURREAL_DOOR =
  "Does it belong to one of the five defined record types?" as const;

/* --------------------------- C. the cross-store words ----------------------------- */

/** C.3 — a File is file_record + blob. It may be edited in place. */
export const FILE_EDIT_RULE: InPlaceEditDelta = {
  changes: ["blob.bytes", "blob.byte_len", "file_record.size", "blob.format?"],
  neverChanges: ["file_record.id", "blob.blob_id", "file_record.blob_id"],
};

/**
 * C.3 — S18 ("the notebook never edits a file in place") is DELETED.
 * Kept here as a tombstone so no module reintroduces the old rule.
 */
export const S18_DELETED = true;

/** C.4 — the rule a component must never break. */
export const COMPONENT_RULE = {
  displays: true,
  letsYouEdit: true,
  runsWhatItShows: false,
} as const;

/** C.7 — the full loop across the format boundary. */
export const FLOW = [
  "file-bytes",
  "adapter",
  "component",
  "serializer",
  "file-bytes",
] as const;

/** C.7/C.7a — the two named per-format operations. There are no others. */
export const FORMAT_SIDES = {
  read: "Adapter",
  write: "Serializer",
} as const;

/** C.7b — where the File <-> Component pairing lives, and where it must not. */
export const FILE_COMPONENT_LINK: FileComponentLink = {
  home: "view_state",
  fileSide: "view_state.active_file_id",
  componentSide: "view_state.active_component",
};

/** C.7 — an Adapter is decode-side only; it also picks the component. */
export function makeAdapter(format: string): Adapter {
  return { format, direction: "decode", bytesToUsableForm: true, picksComponent: true };
}

/** C.7a — a Serializer is encode-side only; not the writer, not the editor. */
export function makeSerializer(format: string): Serializer {
  return { format, direction: "encode", isDatabaseWriter: false, isEditor: false };
}

/** C.6 — the closed set of modes. The only one built now is focus. */
export const MODES: readonly ModeName[] = [
  "focus",
  "canvas",
  "graph",
  "table",
  "list",
  "code",
  "timeline",
];
export const MODE: ModeName = "focus";

/** C.8 — formats are an OPEN set. These are the only adapters built now. */
export const ADAPTERS: readonly { format: string; component: string }[] = [
  { format: "md", component: "markdown" },
  { format: "txt", component: "text" },
];

/** C.8 — with no adapter, a file renders as plain text. */
export const FALLBACK_RENDER_COMPONENT = "text";
