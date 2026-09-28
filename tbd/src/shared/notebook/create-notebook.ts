import { RecordId } from "surrealdb";
import type { Surreal } from "surrealdb";
import type { Notebook } from "./notebook";

export async function createNotebook(
  surreal: Surreal,
  name: string,
  ownerId: string
): Promise<Notebook> {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error("Notebook name cannot be empty");
  }
  if (trimmed.length > 255) {
    throw new Error("Notebook name must be 255 characters or less");
  }

  const id = new RecordId("notebooks", crypto.randomUUID());
  const now = new Date();
  const created = await surreal.create<Record<string, unknown>>(id).content({
    name: trimmed,
    ownerId,
    createdAt: now,
    updatedAt: now,
    revision: 1,
    origin: "local",
  });
  return {
    id: id.toString(),
    name: created.name as string,
    ownerId: created.ownerId as string,
    createdAt: created.createdAt as Date,
    updatedAt: created.updatedAt as Date,
    revision: created.revision as number,
    origin: created.origin as Notebook["origin"],
  };
}
