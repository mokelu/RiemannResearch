import { describe, expect, it } from "vitest";
import {
  countWorkspace,
  createNode,
  duplicateFile,
  emptyStructure,
  findNode,
  findParent,
  firstFileId,
  isDescendant,
  moveNode,
  nextId,
  pathOf,
  removeNode,
  renameNode,
  seedWorkspace,
  setFileStructure,
} from "./workspace.js";

/** A small tree: root > folder a > file 1, plus file 2 at the root. */
function tree() {
  return {
    id: "root",
    type: "folder",
    name: "Workspace",
    children: [
      {
        id: "a",
        type: "folder",
        name: "a",
        children: [{ id: "f1", type: "file", name: "f1.md" }],
      },
      { id: "f2", type: "file", name: "f2.md" },
    ],
  };
}

describe("reading the tree", () => {
  it("finds nodes, parents, and the path to either", () => {
    const root = tree();
    expect(findNode(root, "f1").name).toBe("f1.md");
    expect(findParent(root, "f1").id).toBe("a");
    expect(pathOf(root, "f1").map((n) => n.id)).toEqual(["root", "a", "f1"]);
  });

  it("knows what sits inside what", () => {
    const root = tree();
    expect(isDescendant(root, "f1", "a")).toBe(true);
    expect(isDescendant(root, "f1", "f2")).toBe(false);
    expect(isDescendant(root, "a", "f1")).toBe(false);
  });

  it("opens the first file in reading order", () => {
    expect(firstFileId(tree())).toBe("f1");
  });

  it("counts files and folders without counting the root", () => {
    expect(countWorkspace(tree())).toEqual({ files: 2, folders: 1 });
  });
});

describe("creating", () => {
  it("adds a file inside the named folder", () => {
    const root = createNode(tree(), "a", "file", nextId(), "notes.md");
    expect(findNode(root, "a").children[0].name).toBe("notes.md");
    expect(findNode(tree(), "a").children).toHaveLength(1);
  });

  it("falls back to the root when the parent is a file", () => {
    const root = createNode(tree(), "f1", "file", "new", "x.md");
    expect(findParent(root, "new").id).toBe("root");
  });

  it("gives a folder somewhere to put children", () => {
    const root = createNode(tree(), "root", "folder", "b", "b");
    expect(findNode(root, "b").children).toEqual([]);
  });
});

describe("renaming", () => {
  it("takes a real name", () => {
    expect(findNode(renameNode(tree(), "f1", "better.md"), "f1").name).toBe(
      "better.md",
    );
  });

  it("refuses an empty name instead of erasing the file", () => {
    const root = renameNode(tree(), "f1", "   ");
    expect(findNode(root, "f1").name).toBe("f1.md");
  });

  it("cannot rename the root away", () => {
    const root = renameNode(tree(), "root", "Elsewhere");
    expect(root.name).toBe("Workspace");
  });
});

describe("removing", () => {
  it("takes the whole folder with it", () => {
    const root = removeNode(tree(), "a");
    expect(findNode(root, "a")).toBeNull();
    expect(findNode(root, "f1")).toBeNull();
    expect(findNode(root, "f2")).not.toBeNull();
  });

  it("leaves the original tree untouched", () => {
    const root = tree();
    removeNode(root, "a");
    expect(findNode(root, "f1")).not.toBeNull();
  });

  it("will not remove the root", () => {
    expect(removeNode(tree(), "root")).toEqual(tree());
  });
});

describe("duplicating", () => {
  it("places the copy after the original, marked as a copy", () => {
    const root = duplicateFile(tree(), "f2", "copy1");
    const names = root.children.map((child) => child.name);
    expect(names).toEqual(["a", "f2.md", "f2 copy.md"]);
    expect(findNode(root, "copy1").type).toBe("file");
  });

  it("leaves folders alone", () => {
    expect(duplicateFile(tree(), "a", "copy1")).toEqual(tree());
  });
});

describe("moving", () => {
  it("moves a file into a folder", () => {
    const root = moveNode(tree(), "f2", "a");
    expect(findParent(root, "f2").id).toBe("a");
  });

  it("refuses to move a folder inside itself", () => {
    const withSub = createNode(tree(), "a", "folder", "sub", "sub");
    const moved = moveNode(withSub, "a", "sub");
    expect(findParent(moved, "a").id).toBe("root");
  });

  it("refuses a file as the target", () => {
    expect(moveNode(tree(), "a", "f2")).toEqual(tree());
  });

  it("treats a drop onto one's own parent as a no-op", () => {
    expect(moveNode(tree(), "a", "root")).toEqual(tree());
  });
});

describe("file contents", () => {
  it("stores a structure on the file", () => {
    const structure = {
      blocks: [{ type: "paragraph", runs: [{ kind: "node", ref: "s1" }] }],
      nodes: [{ id: "s1", text: "Saved.", tag: "FACT" }],
      relations: [],
    };
    const root = setFileStructure(tree(), "f1", structure);
    expect(findNode(root, "f1").structure).toEqual(structure);
    expect(findNode(tree(), "f1").structure).toBeUndefined();
  });

  it("ignores anything that is not a file", () => {
    expect(setFileStructure(tree(), "a", emptyStructure())).toEqual(tree());
  });
});

describe("the seed", () => {
  it("opens on an example with a real result in it", () => {
    const root = seedWorkspace();
    const first = findNode(root, firstFileId(root));
    expect(first.name).toBe("Example — morning coffee");
    expect(first.structure.nodes.length).toBeGreaterThan(0);
  });

  it("brings restored work back as the first file", () => {
    const saved = emptyStructure();
    const root = seedWorkspace(saved);
    const first = findNode(root, firstFileId(root));
    expect(first.name).toBe("Untitled research");
    expect(first.structure).toEqual(saved);
  });
});
