import { Surreal } from "surrealdb";
import { createWasmEngines } from "@surrealdb/wasm";
import { migrate } from "../shared/db/migrate";
import { browserMigrations } from "./migrations";

let db: Surreal | null = null;

export async function getDb(): Promise<Surreal> {
  if (db) return db;

  try {
    createWasmEngines();

    const surreal = new Surreal();
    await surreal.connect("indxdb://riemann");

    await migrate(surreal, browserMigrations);

    // Health check
    await surreal.query("RETURN 1");

    db = surreal;
    return db;
  } catch (err) {
    db = null;
    throw err;
  }
}
