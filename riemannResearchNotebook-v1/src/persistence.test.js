import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadWorkspace, saveWorkspace } from "./persistence.js";
import { findNode, firstFileId, setFileStructure, seedWorkspace } from "./workspace.js";

const structure = {
  blocks: [{ type: "paragraph", runs: [{ kind: "node", ref: "n1" }] }],
  nodes: [{ id: "n1", text: "Saved work.", tag: "CLAIM" }],
  relations: [],
};

/** A stand-in for the browser's localStorage, with its store exposed. */
function fakeStorage() {
  const store = new Map();
  return {
    store,
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => store.set(key, value),
  };
}

describe("workspace storage", () => {
  let original;

  beforeEach(() => {
    original = globalThis.localStorage;
  });

  afterEach(() => {
    globalThis.localStorage = original;
    vi.restoreAllMocks();
  });

  it("returns null when nothing has been stored", () => {
    globalThis.localStorage = fakeStorage();
    expect(loadWorkspace()).toBeNull();
  });

  it("round-trips the workspace it was given", () => {
    globalThis.localStorage = fakeStorage();
    const root = setFileStructure(seedWorkspace(), "file-untitled", structure);
    saveWorkspace(root);
    expect(loadWorkspace()).toEqual(root);
  });

  it("returns null when the stored value is not JSON", () => {
    const storage = fakeStorage();
    globalThis.localStorage = storage;
    saveWorkspace(seedWorkspace());
    const [key] = [...storage.store.keys()];
    storage.store.set(key, "{definitely not json");
    expect(loadWorkspace()).toBeNull();
  });

  it("returns null when the stored JSON is not a workspace", () => {
    const storage = fakeStorage();
    globalThis.localStorage = storage;
    storage.store.set("riemann-notebook.workspace", JSON.stringify({ hi: 1 }));
    expect(loadWorkspace()).toBeNull();
  });

  it("returns null when storage refuses to be read", () => {
    globalThis.localStorage = {
      getItem: () => {
        throw new Error("blocked");
      },
    };
    expect(loadWorkspace()).toBeNull();
  });

  it("does not throw when storage refuses to be written", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    globalThis.localStorage = {
      setItem: () => {
        throw new Error("quota exceeded");
      },
    };
    expect(() => saveWorkspace(seedWorkspace())).not.toThrow();
  });

  describe("a structure saved before workspaces existed", () => {
    it("comes back as the first file of a seeded workspace", () => {
      const storage = fakeStorage();
      globalThis.localStorage = storage;
      storage.store.set("riemann-notebook.structure", JSON.stringify(structure));

      const root = loadWorkspace();
      expect(root).not.toBeNull();
      const first = findNode(root, firstFileId(root));
      expect(first.name).toBe("Untitled research");
      expect(first.structure).toEqual(structure);
    });

    it("is not restored when it no longer passes the boundary", () => {
      const storage = fakeStorage();
      globalThis.localStorage = storage;
      storage.store.set(
        "riemann-notebook.structure",
        JSON.stringify({ blocks: [], nodes: [{ id: "x" }] }),
      );
      expect(loadWorkspace()).toBeNull();
    });

    it("is ignored when the stored value is corrupt", () => {
      const storage = fakeStorage();
      globalThis.localStorage = storage;
      storage.store.set("riemann-notebook.structure", "not json at all");
      expect(loadWorkspace()).toBeNull();
    });
  });
});
