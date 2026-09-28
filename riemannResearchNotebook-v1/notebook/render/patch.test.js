import { describe, expect, it } from "vitest";
import { Surface } from "./surface.js";

const base = () =>
  Surface.open({
    blocks: [
      { type: "heading", level: 1, runs: [{ kind: "text", text: "Title" }] },
      { type: "paragraph", runs: [{ kind: "node", ref: "n1" }] },
    ],
    nodes: [{ id: "n1", text: "John is a dog.", tag: "ASSUMPTION" }],
    relations: [],
  });

describe("the block-aware edit path", () => {
  it("refuses to add a sentence with no placement — it would be invisible", () => {
    const surface = base();
    const result = surface.propose({ op: "addNode", id: "n2", text: "New.", tag: "CLAIM" });

    expect(result.applied).toBe(false);
    expect(result.errors.join(" ")).toMatch(/placement/);
    expect(surface.graph.size).toBe(1);
  });

  it("adds a sentence AND shows it, by placing a run in the named block", () => {
    const surface = base();
    const result = surface.propose({
      op: "addNode",
      id: "n2",
      text: "John barks.",
      tag: "CLAIM",
      placement: { block: 1 },
    });

    expect(result.applied).toBe(true);
    const runs = surface.graph.blocks()[1].runs;
    expect(runs.some((run) => run.kind === "node" && run.ref === "n2")).toBe(true);
  });

  it("removes the pointers to a sentence out of the blocks in the same edit", () => {
    const surface = base();
    const result = surface.propose({ op: "removeNode", id: "n1" });

    expect(result.applied).toBe(true);
    expect(surface.graph.size).toBe(0);
    // no block still points at the gone node, or revalidation would have failed
    const refs = surface
      .graph.blocks()
      .flatMap((block) => block.runs ?? [])
      .filter((run) => run.kind === "node")
      .map((run) => run.ref);
    expect(refs).not.toContain("n1");
  });

  it("re-tags a sentence and every view still sees the same content", () => {
    const surface = base();
    expect(surface.propose({ op: "retag", id: "n1", tag: "PREMISE" }).applied).toBe(true);
    expect(surface.graph.node("n1").tag).toBe("PREMISE");
  });
});
