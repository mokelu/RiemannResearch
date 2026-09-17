-- schema/notebooks.surql  ← this file. Raw SurrealQL. Run once, against the database.

DEFINE FIELD id ON TABLE notebooks
  VALUE $value OR rand::ulid();

DEFINE FIELD createdAt ON TABLE notebooks TYPE datetime
  DEFAULT time::now() READONLY;

DEFINE FIELD updatedAt ON TABLE notebooks TYPE datetime
  VALUE time::now();
