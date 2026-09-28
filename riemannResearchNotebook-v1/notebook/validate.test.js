import { describe, expect, it } from "vitest";
import { validateReasoning } from "./validate.js";

/** The exact example the AI is allowed to produce: blocks show every node. */
const validOutput = {
  blocks: [
    {
      type: "paragraph",
      runs: [
        { kind: "node", ref: "n1" },
        { kind: "node", ref: "n2" },
      ],
    },
  ],
  nodes: [
    { id: "n1", text: "John is a dog.", tag: "ASSUMPTION" },
    { id: "n2", text: "John has four legs.", tag: "CONSEQUENCE" },
  ],
  relations: [{ from: "n1", relation: "IMPLIES", to: "n2" }],
};

const copy = (value) => structuredClone(value);

describe("validateReasoning", () => {
  it("accepts the example structure and hands back the data", () => {
    const result = validateReasoning(validOutput);

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.data).toBe(validOutput);
  });

  it("accepts an empty graph", () => {
    expect(validateReasoning({ blocks: [], nodes: [], relations: [] }).valid)
      .toBe(true);
  });

  it("rejects a tag that is not registered", () => {
    const result = validateReasoning({
      ...validOutput,
      nodes: [{ id: "n1", text: "John is a dog.", tag: "VIBE" }],
      blocks: [{ type: "paragraph", runs: [{ kind: "node", ref: "n1" }] }],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.join(" ")).toMatch(/tag/);
  });

  it("accepts any relation name the AI invents", () => {
    for (const relation of ["CAUSES", "is", "depends on", "supports"]) {
      const result = validateReasoning({
        ...validOutput,
        relations: [{ from: "n1", relation, to: "n2" }],
      });
      expect(result.valid).toBe(true);
    }
  });

  it("rejects a relation with no name at all", () => {
    const result = validateReasoning({
      ...validOutput,
      relations: [{ from: "n1", relation: "", to: "n2" }],
    });
    expect(result.valid).toBe(false);
  });

  it("rejects a missing required field", () => {
    const result = validateReasoning({
      ...validOutput,
      nodes: [{ id: "n1", text: "John is a dog." }],
    });
    expect(result.valid).toBe(false);
  });

  it("rejects unknown extra properties", () => {
    const result = validateReasoning({ ...copy(validOutput), extra: "anything" });
    expect(result.valid).toBe(false);
  });

  it("rejects a relation pointing at a node that does not exist", () => {
    const result = validateReasoning({
      ...validOutput,
      nodes: [validOutput.nodes[0], { id: "n2", text: "…", tag: "CLAIM" }],
      relations: [{ from: "n1", relation: "implies", to: "n9" }],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.join(" ")).toMatch(/does not exist/);
  });

  it("rejects something that is not JSON at all", () => {
    expect(validateReasoning("John is a dog.").valid).toBe(false);
  });
});

describe("the document dimension", () => {
  it("rejects a block that points at a node that does not exist", () => {
    const result = validateReasoning({
      blocks: [{ type: "paragraph", runs: [{ kind: "node", ref: "ghost" }] }],
      nodes: [{ id: "n1", text: "John is a dog.", tag: "CLAIM" }],
      relations: [],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.join(" ")).toMatch(/points at node "ghost"/);
  });

  it("rejects a node that no block ever shows", () => {
    const result = validateReasoning({
      blocks: [{ type: "paragraph", runs: [{ kind: "node", ref: "n1" }] }],
      nodes: [
        { id: "n1", text: "Shown.", tag: "CLAIM" },
        { id: "n2", text: "Hidden.", tag: "CLAIM" },
      ],
      relations: [],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.join(" ")).toMatch(/n2" is not referenced/);
  });

  it("rejects a block type that is not registered", () => {
    const result = validateReasoning({
      blocks: [{ type: "sidebar", runs: [{ kind: "node", ref: "n1" }] }],
      nodes: [{ id: "n1", text: "John.", tag: "CLAIM" }],
      relations: [],
    });
    expect(result.valid).toBe(false);
  });

  it("rejects a heading level outside 1 to 6", () => {
    const result = validateReasoning({
      blocks: [{ type: "heading", level: 9, runs: [{ kind: "node", ref: "n1" }] }],
      nodes: [{ id: "n1", text: "John.", tag: "CLAIM" }],
      relations: [],
    });
    expect(result.valid).toBe(false);
  });

  it("accepts a list whose items reference nodes", () => {
    const result = validateReasoning({
      blocks: [
        {
          type: "list",
          ordered: true,
          items: [
            { runs: [{ kind: "node", ref: "n1" }] },
            { runs: [{ kind: "node", ref: "n2" }] },
          ],
        },
      ],
      nodes: [
        { id: "n1", text: "First.", tag: "CLAIM" },
        { id: "n2", text: "Second.", tag: "CLAIM" },
      ],
      relations: [],
    });
    expect(result.valid).toBe(true);
  });

  it("rejects a non-code block that carries raw text instead of runs", () => {
    const result = validateReasoning({
      blocks: [{ type: "paragraph", text: "loose prose" }],
      nodes: [],
      relations: [],
    });
    expect(result.valid).toBe(false);
  });
});
