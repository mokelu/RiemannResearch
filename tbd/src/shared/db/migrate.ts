import { readFileSync } from "node:fs";
import { basename } from "node:path";
import type { Surreal } from "surrealdb";

export interface Migration {
  name: string;
  sql: string;
}

type MigrationStatus = "applied" | "failed";

interface Logger {
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

const defaultLogger: Logger = {
  info: (...args) => console.log("[migration]", ...args),
  warn: (...args) => console.warn("[migration]", ...args),
  error: (...args) => console.error("[migration]", ...args),
};

function toMigrations(files: string[]): Migration[] {
  return files.map((f) => ({
    name: basename(f),
    sql: readFileSync(f, "utf-8"),
  }));
}

export async function migrate(
  surreal: Surreal,
  files: string[] | Migration[],
  logger: Logger = defaultLogger
): Promise<void> {
  const migrations = Array.isArray(files) && typeof files[0] === "string"
    ? toMigrations(files as string[])
    : (files as Migration[]);

  for (const m of migrations) {
    const [rows] = await surreal.query<[{ name: string }[]]>(
      "SELECT name FROM _migration"
    );
    const applied = new Set((rows || []).map((r) => r.name));

    if (applied.has(m.name)) {
      logger.info(`already applied: ${m.name}`);
      continue;
    }

    try {
      await surreal.query(m.sql);
      await surreal.query(
        "CREATE _migration SET name = $name, appliedAt = time::now(), status = $status",
        { name: m.name, status: "applied" as MigrationStatus }
      );
      logger.info(`applied: ${m.name}`);
    } catch (err) {
      await surreal.query(
        "CREATE _migration SET name = $name, appliedAt = time::now(), status = $status, error = $error",
        { name: m.name, status: "failed" as MigrationStatus, error: String(err) }
      );
      logger.error(`failed: ${m.name}`, err);
      throw err;
    }
  }
}
