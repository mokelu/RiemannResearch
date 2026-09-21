/**
 * Project Grammar — DataLake
 *
 * L8:
 * The DataLake has exactly two tables:
 * blob and dataset.
 *
 * This file is the executable definition of that rule.
 * It does not create the DuckDB tables.
 * It defines which tables are permitted to exist in the DataLake.
 */

const DATALAKE_TABLES = Object.freeze([
  "blob",
  "dataset",
]);

export function datalakeTables() {
  return DATALAKE_TABLES;
}

export function isDatalakeTable(name) {
  return DATALAKE_TABLES.includes(name);
}

export function assertDatalakeTable(name) {
  if (!isDatalakeTable(name)) {
    throw new Error(
      `"${name}" is not a valid DataLake table. ` +
      `The DataLake contains only: ${DATALAKE_TABLES.join(", ")}.`,
    );
  }

  return name;
}