export interface Notebook {
  id: string;
  name: string;
  ownerId: string;
  workspaceId?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  revision: number;
  origin: "browser" | "local" | "cloud";
}
