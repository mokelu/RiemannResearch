import { Surreal } from "surrealdb";
import { migrate, type Migration } from "../shared/db/migrate";

let db: Surreal | null = null;

function loadBrowserMigrations(): Migration[] {
  // In browser, migrations are bundled or fetched
  // For now, return empty — will be populated when bundler is configured
  return [];
}

export async function getDb(): Promise<Surreal> {
  if (db) return db;

  const surreal = new Surreal();
  await surreal.connect("ws://localhost:8000");
  await surreal.signin({ username: "root", password: "root" });
  await surreal.use({ namespace: "app", database: "main" });

  await migrate(surreal, loadBrowserMigrations());

  db = surreal;
  return db;
}
