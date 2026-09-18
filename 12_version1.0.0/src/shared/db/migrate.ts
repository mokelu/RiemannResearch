import type { Surreal } from "surrealdb";

export interface Migration {
  name: string;
  sql: string;
}

interface MigrationRecord {
  name: string;
}

interface QueryResult {
  result: MigrationRecord[];
}

export async function migrate(surreal: Surreal, migrations: Migration[]): Promise<void> {
  await surreal.query(`
    DEFINE TABLE IF NOT EXISTS _migration SCHEMAFULL;
    DEFINE FIELD IF NOT EXISTS name ON _migration TYPE string;
    DEFINE FIELD IF NOT EXISTS appliedAt ON _migration TYPE datetime DEFAULT time::now();
    DEFINE INDEX IF NOT EXISTS migration_name ON _migration FIELDS name UNIQUE;
  `);

  const rowsResult = await surreal.query<QueryResult[]>(
    "SELECT name FROM _migration"
  );
  const applied = new Set(
    (rowsResult[0]?.result || []).map((r) => r.name)
  );

  for (const m of migrations) {
    if (applied.has(m.name)) continue;

    try {
      await surreal.query(m.sql);
      await surreal.query("CREATE _migration SET name = $name", { name: m.name });
      console.log(`[Database] Applied migration: ${m.name}`);
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes("already applied")) {
        continue;
      }
      throw err;
    }
  }
}
