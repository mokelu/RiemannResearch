import { RecordId } from "surrealdb";

export interface Notebook {
  id: RecordId;
  name: string;
  createdAt: string;
  updatedAt: string;
}
