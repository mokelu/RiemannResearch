import type { Surreal } from "surrealdb";

export interface Migration {
  name: string;
  sql: string;
}

export async function migrate(surreal: Surreal, migrations: Migration[]): Promise<void> {
  // 1. Create a tracking table if it doesn't exist
  await surreal.query(`
    DEFINE TABLE IF NOT EXISTS _migration SCHEMAFULL;
    DEFINE FIELD IF NOT EXISTS name ON _migration TYPE string;
    DEFINE FIELD IF NOT EXISTS appliedAt ON _migration TYPE datetime DEFAULT time::now();
    DEFINE INDEX IF NOT EXISTS migration_name ON _migration FIELDS name UNIQUE;
  `);

  // 2. Fetch already applied migrations
  const [rows] = await surreal.query<[Array<{ name: string }>]>(
    "SELECT name FROM _migration"
  );
  const applied = new Set((rows || []).map((r) => r.name));

  // 3. Run only unapplied migrations
  for (const m of migrations) {
    if (applied.has(m.name)) continue;

    await surreal.query(m.sql);
    await surreal.query("CREATE _migration SET name = $name", { name: m.name });
    console.log(`[Database] Applied migration: ${m.name}`);
  }
}
