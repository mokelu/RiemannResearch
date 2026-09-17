import type { Migration } from "../shared/db/migrate";

import _0001 from "../../migrations/0001_notebooks.surql?raw";

export const browserMigrations: Migration[] = [
  { name: "0001_notebooks.surql", sql: _0001 },
];
