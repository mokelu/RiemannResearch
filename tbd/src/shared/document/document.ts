import type { Notebook } from "../notebook/notebook";

export interface Document {
  id: string;
  notebookId: Notebook["id"];
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  revision: number;
  origin: "browser" | "local" | "cloud";
}
