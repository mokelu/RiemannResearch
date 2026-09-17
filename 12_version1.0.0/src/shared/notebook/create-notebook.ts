import type { Notebook } from "./notebook";
import { getDb } from "../../local";

export async function createNotebook(name: string): Promise<Notebook> {
  const surreal = await getDb();
  const [created] = await surreal.create<Notebook>("notebooks", { name });
  return created;
}
