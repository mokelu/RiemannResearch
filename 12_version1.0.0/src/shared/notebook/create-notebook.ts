import { Table, RecordId } from "surrealdb";
import type { Surreal } from "surrealdb";
import type { Notebook } from "./notebook";

export async function createNotebook(surreal: Surreal, name: string): Promise<Notebook> {
  const id = new RecordId("notebooks", crypto.randomUUID());
  const created = await surreal.create<Notebook>(id).content({ name });
  return created;
}
