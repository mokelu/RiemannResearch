/**
 * Grammar L10 — "dataset has columns: dataset_id, columns, rows."
 *
 * Single home for the dataset row. One row here is exactly a row of the
 * dataset (the grammar's comment on L4), so the code enforces what "row"
 * means: every row has a value for exactly every column, in order.
 */

const DATASET_COLUMNS = Object.freeze(["dataset_id", "columns", "rows"]);

/** The column list itself — read-only, the one place dataset columns are named. */
export function datasetColumnNames() {
  return DATASET_COLUMNS;
}

/**
 * Build a dataset row, or refuse.
 * Rules enforced here, each one a direct sentence of the grammar:
 * 1. exactly the three named fields, no missing, no extra;
 * 2. columns is an array of column-name strings, at least one;
 * 3. rows is an array of arrays, and every inner row has exactly
 *    columns.length values — a ragged row is not tabular data;
 * 4. dataset_id is a non-empty string.
 */
export function createDatasetRow(fields) {
  const keys = Object.keys(fields);
  const missing = DATASET_COLUMNS.filter((c) => !keys.includes(c));
  const extra = keys.filter((k) => !DATASET_COLUMNS.includes(k));
  if (missing.length > 0) {
    throw new Error(`dataset row is missing fields: ${missing.join(", ")}`);
  }
  if (extra.length > 0) {
    throw new Error(`dataset row has unknown fields: ${extra.join(", ")}`);
  }
  const { dataset_id, columns, rows } = fields;
  if (typeof dataset_id !== "string" || dataset_id.length === 0) {
    throw new Error("dataset.dataset_id must be a non-empty string");
  }
  if (
    !Array.isArray(columns) ||
    columns.length === 0 ||
    columns.some((c) => typeof c !== "string")
  ) {
    throw new Error("dataset.columns must be a non-empty array of strings");
  }
  if (!Array.isArray(rows)) {
    throw new Error("dataset.rows must be an array of rows");
  }
  for (let i = 0; i < rows.length; i += 1) {
    if (!Array.isArray(rows[i]) || rows[i].length !== columns.length) {
      throw new Error(
        `dataset.rows[${i}] is not a row of this dataset: expected ${columns.length} values, got ${Array.isArray(rows[i]) ? rows[i].length : "not-an-array"}`,
      );
    }
  }
  return Object.freeze({
    dataset_id,
    columns: Object.freeze([...columns]),
    rows: Object.freeze(rows.map((r) => Object.freeze([...r]))),
  });
}
