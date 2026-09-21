/**
 * Grammar L8 — "The datalake has exactly two tables: blob and dataset."
 *
 * Single home for the fact WHICH tables exist.
 * What columns each table has is owned by that table's own file (L9, L10).
 * A third table cannot be named by anything in this project, because the only
 * authority on table names is this file.
 */

const TABLE_NAMES = Object.freeze(["blob", "dataset"]);

/** The only valid table names. Frozen — nothing may push into this list at runtime. */
export function dataTableNames() {
  return TABLE_NAMES;
}

/** True only for exactly "blob" and "dataset". Everything else, including "", is false. */
export function isDataTable(name) {
  return TABLE_NAMES.includes(name);
}

/** Refuses any name that is not one of the two tables. */
export function assertDataTable(name) {
  if (!isDataTable(name)) {
    throw new Error(
      `"${name}" is not a datalake table. The datalake has exactly two tables: ${TABLE_NAMES.join(", ")}.`,
    );
  }
  return name;
}
