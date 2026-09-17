# Problems

## 1. Schema is never loaded

`schemas/notebooks.db.schema.surql` defines the notebook table, but nothing in the codebase loads or runs it. SurrealDB never receives these definitions.

## Solution 1A:
Yes. The solution is to create a small database bootstrap step that explicitly loads and executes this schema when the local SurrealDB database is initialized.

Conceptually:

```text
App starts
   ↓
Connect to SurrealDB
   ↓
Load notebooks.db.schema.surql
   ↓
db.query(schema)
   ↓
Schema now exists in SurrealDB
   ↓
Application can use notebooks
```

In your repo, `src/local/index.ts` is the obvious place to start that initialization because it is explicitly intended as the local-first entry point and mentions SurrealDB.

And the project already has the `surrealdb` dependency, so the missing piece is really just the initialization code.

I would not move or duplicate the schema. I would keep:

```text
schemas/
  notebooks.db.schema.surql
```

and have a database initialization module load that file and execute it.


## My Remarks to 1A.
But is it everytime it starts? Like what if this is the second time. Then is it reinitializing all over again? Reinitializing is the right thought right?

-----------------------------

## Solution 1B:

## The solution: a migrations runner, called once at bootstrap

The schema file exists. Nothing calls it. The fix is a function that reads it, runs it, and remembers that it ran. That's it.

## The shape

```
migrations/
├── 0001_notebooks.surql
├── 0002_conversations.surql     ← when you add conversations
└── ...

src/shared/db/
├── migrate.ts                   ← the runner
└── migrations.ts                ← the manifest (list of files + their SQL)
```

## The runner

```ts
// src/shared/db/migrate.ts
import type { Surreal } from "surrealdb";

export interface Migration {
  name: string;
  sql: string;
}

export async function migrate(surreal: Surreal, migrations: Migration[]): Promise<void> {
  // 1. Tracking table — one row per applied migration
  await surreal.query(`
    DEFINE TABLE IF NOT EXISTS _migration SCHEMAFULL;
    DEFINE FIELD IF NOT EXISTS name ON _migration TYPE string;
    DEFINE FIELD IF NOT EXISTS appliedAt ON _migration TYPE datetime DEFAULT time::now();
    DEFINE INDEX IF NOT EXISTS migration_name ON _migration FIELDS name UNIQUE;
  `);

  // 2. What's already applied?
  const [rows] = await surreal.query<[Array<{ name: string }>]>(
    "SELECT name FROM _migration"
  );
  const applied = new Set(rows.map((r) => r.name));

  // 3. Run the ones that aren't applied, in order
  for (const m of migrations) {
    if (applied.has(m.name)) continue;
    await surreal.query(m.sql);
    await surreal.query("CREATE _migration SET name = $name", { name: m.name });
    console.log(`Applied ${m.name}`);
  }
}
```

## The manifest — this is the key decision

`migrate()` takes an array of `{ name, sql }`. It does **not** read from disk. Why? Because `migrate()` runs in two places: the local app (Node, has `fs`) and the Cloudflare Worker (no `fs`, only bundled strings). If `migrate()` reads from disk, it can't run in the Worker.

So the *loading* is separate from the *running*.

**For the local app** (Node / Tauri / Deno):

```ts
// src/local/migrations.ts
import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import type { Migration } from "../shared/db/migrate";

export function loadMigrations(): Migration[] {
  const dir = "./migrations";
  return readdirSync(dir)
    .filter((f) => f.endsWith(".surql"))
    .sort()
    .map((name) => ({
      name,
      sql: readFileSync(join(dir, name), "utf8"),
    }));
}
```

**For the Worker** (no filesystem):

```ts
// src/worker/migrations.ts
import type { Migration } from "../shared/db/migrate";
import notebooks from "../../migrations/0001_notebooks.surql";

export function loadMigrations(): Migration[] {
  return [
    { name: "0001_notebooks.surql", sql: notebooks },
  ];
}
```

Same `migrate()` runs both. The only difference is how the SQL strings get there.

## The call site — the missing line

Wherever you connect to SurrealDB, call `migrate()` immediately after `use()`:

```ts
// src/local/index.ts
const surreal = new Surreal();
await surreal.connect("ws://localhost:8000");
await surreal.signin({ username: "root", password: "root" });
await surreal.use({ namespace: "app", database: "main" });

await migrate(surreal, loadMigrations());   // ← the missing line
```

That's the whole fix. Every time the app boots, `migrate()` checks `_migration`, sees what's been applied, and applies anything new. On the first boot it applies everything. On every boot after, it's a no-op.

## Why this and not something simpler

**Why not just paste the SQL into `create-notebook.ts`?**
Because then the schema is scattered across the codebase. When you add `conversations`, you'd have to add another inline `DEFINE TABLE` somewhere else. Migrations centralize all schema changes in one ordered folder.

**Why not run it manually via CLI?**
Because you'll forget. Because it doesn't run in CI. Because it doesn't run on a fresh machine. Because the Worker can't invoke the CLI. The whole point is that it's automatic and idempotent.

**Why not `IF NOT EXISTS` on every field instead of a tracking table?**
Because `IF NOT EXISTS` prevents errors, but it doesn't tell you what's applied. When you have ten migrations, you want `SELECT * FROM _migration ORDER BY appliedAt` to tell you exactly what state any database is in. The tracking table is the audit log. `IF NOT EXISTS` is just a safety net — use both.

## The migration file

Rename `schemas/notebooks.db.schema.surql` → `migrations/0001_notebooks.surql`. While you're there, fix the two bugs we identified:

```sql
-- migrations/0001_notebooks.surql
DEFINE TABLE IF NOT EXISTS notebooks SCHEMAFULL;

DEFINE FIELD IF NOT EXISTS name ON notebooks TYPE string;

DEFINE FIELD IF NOT EXISTS createdAt ON notebooks TYPE datetime
  DEFAULT time::now() READONLY;

DEFINE FIELD IF NOT EXISTS updatedAt ON notebooks TYPE datetime
  VALUE time::now();

-- id: omit. SurrealDB generates a ULID on CREATE by default.
```

Two changes from what you have now: `VALUE` → `DEFAULT` on `createdAt` (so it stops being overwritten on every write), and drop the `id` field definition entirely.

## The one sentence

**The schema is never loaded because nothing calls it — the fix is a `migrate(surreal, migrations)` function that reads a manifest, tracks what's applied in `_migration`, and gets called once right after `use()` in your bootstrap.** That's the missing line.

-----------------------------

## Solution 1C:
To solve this problem cleanly across local execution (`src/local`), cloud workers (`src/worker`), and client interfaces (`src/app`), you need a **dedicated database initialization service** that executes raw `.surql` schema queries when SurrealDB establishes a connection.

---

### Solution Overview

SurrealDB does not automatically auto-discover or parse `.surql` files on startup. To fix this, create a schema loader module that reads `schemas/notebooks.db.schema.surql` and runs it against the connected SurrealDB client before any operations (like creating notebooks) execute.

---

### Step 1: Create the Schema Migration Loader (`src/shared/database/schema-loader.ts`)

Create a new helper to execute your raw SurrealQL definitions:

```typescript
import { Surreal } from "surrealdb";

/**
 * Executes raw SurrealQL schema definitions against the active database client.
 */
export async function initializeSchema(db: Surreal, schemaContent: string): Promise<void> {
  try {
    await db.query(schemaContent);
    console.log("[SurrealDB] Schema initialized successfully.");
  } catch (error) {
    console.error("[SurrealDB] Failed to apply schema:", error);
    throw error;
  }
}

```

---

### Step 2: Update Database Setup in Entry Points (`src/local/index.ts` & `src/shared/notebook/db.ts`)

Instead of making top-level database connections in feature files, create a centralized DB instance manager that runs `initializeSchema` on startup:

```typescript
import { Surreal } from "surrealdb";
import { initializeSchema } from "../database/schema-loader";

// Import raw SURQL text (supported via bundler / build step) or read file
import notebookSchema from "../../../schemas/notebooks.db.schema.surql?raw";

let dbInstance: Surreal | null = null;

export async function getDatabase(): Promise<Surreal> {
  if (dbInstance) return dbInstance;

  const db = new Surreal();
  await db.connect("ws://localhost:8000");
  await db.signin({ username: "root", password: "root" });
  await db.use({ namespace: "app", database: "main" });

  // Load and execute schema definitions automatically on boot
  await initializeSchema(db, notebookSchema);

  dbInstance = db;
  return dbInstance;
}

```

---

### Step 3: Refactor Feature Functions (`src/shared/notebook/create-notebook.ts`)

Pass the initialized DB client into feature functions rather than re-connecting at the top level of the file:

```typescript
import type { Surreal } from "surrealdb";
import type { Notebook } from "./notebook";

export async function createNotebook(
  db: Surreal,
  name: string
): Promise<Notebook> {
  const [created] = await db.create<Notebook>("notebooks", { name });
  return created;
}

```

---

### Alternative: Seed via Surreal CLI (Local Dev & CI)

If you run SurrealDB in Docker or CI during local development, you can also import the schema via the Surreal CLI directly:

```bash
surreal import \
  --conn http://localhost:8000 \
  --user root --pass root \
  --ns app --db main \
  schemas/notebooks.db.schema.surql

```

## My Humble Remarks to 1C:
I "feel" though I cannot prove it that this works but it does not solve the what if my db already ran.

-----------------------------

Good — the repo's changed shape actually points straight at the fix. Here's what I found and what to do about it.

## What's there now

- **`src/local/index.ts`** — the file that's supposed to own the embedded SurrealDB setup — is still just two comment lines. Empty.
- **`src/shared/notebook/create-notebook.ts`** instead opens its *own* ad-hoc connection at module load time (`new Surreal()`, `connect`, `signin`, `use`) and immediately calls `surreal.create<Notebook>("notebooks", …)`. It never touches `notebooks.db.schema.surql`.
- **`schemas/notebooks.db.schema.surql`** just sits in the directory. Nothing in `package.json` scripts, nothing in any `.ts` file, references that path.
- Interestingly, `src/shared/zen_engine/load-zen.ts` already has the pattern you want, just for a different file type: `readFileSync(join(__dirname, "jdm", "permissions.json"))`, parsed at construction time.

So the repo already shows the idiom for "load a static file relative to the module and apply it" — it just hasn't been applied to the SurrealQL schema.

## The fix

**1. Make `src/local/index.ts` the actual DB bootstrap** (it's the natural home per its own header comment), mirroring `load-zen.ts`'s `readFileSync`/`join(__dirname, …)` pattern:

```ts
// src/local/index.ts
import { readFileSync } from "fs";
import { join } from "path";
import { Surreal } from "surrealdb";

let db: Surreal | null = null;

export async function getDb(): Promise<Surreal> {
  if (db) return db;

  const surreal = new Surreal();
  await surreal.connect("ws://localhost:8000");
  await surreal.signin({ username: "root", password: "root" });
  await surreal.use({ namespace: "app", database: "main" });

  const schemaPath = join(__dirname, "..", "..", "schemas", "notebooks.db.schema.surql");
  const schema = readFileSync(schemaPath, "utf-8");
  await surreal.query(schema);

  db = surreal;
  return db;
}
```

**2. Delete the ad-hoc connection in `create-notebook.ts`, and pull the shared one instead:**

```ts
import type { Notebook } from "./notebook";
import { getDb } from "../../local";

export async function createNotebook(name: string): Promise<Notebook> {
  const surreal = await getDb();
  const created = await surreal.create<Notebook>("notebooks", { name });
  return created as unknown as Notebook;
}
```

Two things this fixes beyond just "the schema gets loaded":

- Right now `create-notebook.ts` runs its connection logic as a **top-level await at import time** — every time that module is imported (tests, other callers), it opens a new socket and signs in again. Centralizing into `getDb()` with a memoized singleton fixes that too.
- If you ever add more tables, you'll want a loop over `schemas/*.surql` rather than hardcoding one filename — worth doing now if more schema files are coming, since the current single-file approach won't scale past `notebooks`.

Want me to pull down the actual file and make these edits directly, or is this a step in a course/exercise where you're writing it yourself?

## My Humble remark to 1D:
I do not see this one address the problem at all. And it may not even be related.