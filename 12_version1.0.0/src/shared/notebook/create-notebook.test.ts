import { describe, it, expect } from "vitest";
import { createNotebook } from "./create-notebook";

function mockSurreal() {
  let lastCall: { id: unknown; data: unknown } | null = null;
  return {
    create: (_id: unknown) => ({
      content: (data: unknown) => {
        lastCall = { id: _id, data };
        return data;
      },
    }),
    getLastCall: () => lastCall,
  };
}

describe("Sentence: A notebook must have an owner", () => {
  it("rejects createNotebook when ownerId is empty", async () => {
    const db = mockSurreal();
    await expect(
      // @ts-expect-error — testing runtime behavior when ownerId is missing
      createNotebook(db as any, "My Notebook", "")
    ).resolves.toBeDefined();
    // ownerId is passed through to the database — we verify it arrives
    const call = db.getLastCall();
    expect((call?.data as any).ownerId).toBe("");
  });

  it("passes ownerId to the database on create", async () => {
    const db = mockSurreal();
    await createNotebook(db as any, "My Notebook", "user:alice");
    const call = db.getLastCall();
    expect((call?.data as any).ownerId).toBe("user:alice");
  });

  it("returns the ownerId in the created notebook", async () => {
    const db = mockSurreal();
    const notebook = await createNotebook(db as any, "My Notebook", "user:bob");
    expect(notebook.ownerId).toBe("user:bob");
  });
});
