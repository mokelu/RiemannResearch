import { readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Surreal } from "surrealdb";
import { migrate, type Migration } from "../shared/db/migrate";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SURREAL_URL = process.env.SURREAL_URL || "ws://localhost:8000";
const SURREAL_USER = process.env.SURREAL_USER || "root";
const SURREAL_PASS = process.env.SURREAL_PASS || "root";
const SURREAL_NS = process.env.SURREAL_NS || "app";
const SURREAL_DB = process.env.SURREAL_DB || "main";

let db: Surreal | null = null;
let initPromise: Promise<Surreal> | null = null;

function loadLocalMigrations(): Migration[] {
  const dir = join(__dirname, "../../migrations");
  return readdirSync(dir)
    .filter((f) => f.endsWith(".surql"))
    .sort()
    .map((name) => ({
      name,
      sql: readFileSync(join(dir, name), "utf-8"),
    }));
}

export async function getDb(): Promise<Surreal> {
  if (db) return db;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const surreal = new Surreal();
      await surreal.connect(SURREAL_URL);
      await surreal.signin({ username: SURREAL_USER, password: SURREAL_PASS });
      await surreal.use({ namespace: SURREAL_NS, database: SURREAL_DB });

      await migrate(surreal, loadLocalMigrations());

      await surreal.query("RETURN 1");

      db = surreal;
      return db;
    } catch (err) {
      db = null;
      initPromise = null;
      throw err;
    }
  })();

  return initPromise;
}

export async function closeDb(): Promise<void> {
  if (db) {
    try {
      db = null;
      initPromise = null;
    } catch {
      // best effort
    }
  }
}
