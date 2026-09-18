import type { Notebook } from "./notebook";

export interface NotebookRepository {
  create(name: string, ownerId: string): Promise<Notebook>;
  getById(id: string): Promise<Notebook | null>;
  list(ownerId: string): Promise<Notebook[]>;
  update(id: string, patch: Partial<Pick<Notebook, "name" | "workspaceId" | "deletedAt">>): Promise<Notebook>;
  delete(id: string): Promise<void>;
  restore(id: string): Promise<Notebook>;
}
