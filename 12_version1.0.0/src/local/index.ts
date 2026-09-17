import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { Surreal } from "surrealdb";
import { migrate, type Migration } from "../shared/db/migrate";

let db: Surreal | null = null;

function loadLocalMigrations(): Migration[] {
  const dir = join(process.cwd(), "migrations");
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

  const surreal = new Surreal();
  await surreal.connect("ws://localhost:8000");
  await surreal.signin({ username: "root", password: "root" });
  await surreal.use({ namespace: "app", database: "main" });

  // Run migrations safely on boot
  await migrate(surreal, loadLocalMigrations());

  db = surreal;
  return db;
}
