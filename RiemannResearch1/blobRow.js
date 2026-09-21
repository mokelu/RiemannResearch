/**
 * Grammar L9 — "blob has columns: blob_id, bytes, format, byte_len."
 *
 * Single home for the blob row. A blob row with any missing column, any extra
 * column, or an inconsistent byte_len cannot exist: createBlobRow is the only
 * door, and it is not optional for callers.
 */

const BLOB_COLUMNS = Object.freeze(["blob_id", "bytes", "format", "byte_len"]);

/** The column list itself — read-only, the one place blob columns are named. */
export function blobColumnNames() {
  return BLOB_COLUMNS;
}

/**
 * Build a blob row, or refuse.
 * Rules enforced here, each one a direct sentence of the grammar:
 * 1. exactly the four named columns, no missing, no extra;
 * 2. bytes is a Uint8Array (the literal content of one file);
 * 3. byte_len equals bytes.length (the name means that, so the code checks it);
 * 4. blob_id is a non-empty string; format is any string (L12: an OPEN set).
 */
export function createBlobRow(fields) {
  const keys = Object.keys(fields);
  const missing = BLOB_COLUMNS.filter((c) => !keys.includes(c));
  const extra = keys.filter((k) => !BLOB_COLUMNS.includes(k));
  if (missing.length > 0) {
    throw new Error(`blob row is missing columns: ${missing.join(", ")}`);
  }
  if (extra.length > 0) {
    throw new Error(`blob row has unknown columns: ${extra.join(", ")}`);
  }
  const { blob_id, bytes, format, byte_len } = fields;
  if (typeof blob_id !== "string" || blob_id.length === 0) {
    throw new Error("blob.blob_id must be a non-empty string");
  }
  if (!(bytes instanceof Uint8Array)) {
    throw new Error("blob.bytes must be a Uint8Array");
  }
  if (byte_len !== bytes.length) {
    throw new Error(
      `blob.byte_len (${byte_len}) must equal bytes.length (${bytes.length})`,
    );
  }
  if (typeof format !== "string") {
    throw new Error("blob.format must be a string (any string — the set is open)");
  }
  return Object.freeze({ blob_id, bytes, format, byte_len });
}
