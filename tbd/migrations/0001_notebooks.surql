-- migrations/0001_notebooks.surql
DEFINE TABLE IF NOT EXISTS notebooks SCHEMAFULL;

DEFINE FIELD IF NOT EXISTS name ON notebooks TYPE string;

DEFINE FIELD IF NOT EXISTS createdAt ON notebooks TYPE datetime
  DEFAULT time::now() READONLY;

DEFINE FIELD IF NOT EXISTS updatedAt ON notebooks TYPE datetime;
