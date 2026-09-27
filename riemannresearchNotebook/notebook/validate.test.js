import { describe, expect, it } from "vitest";
import { validateNaiveDI } from "./validate.js";

/** The exact example the AI is allowed to produce. */
const validOutput = {
  nodes: [
    { id: "n1", text: "John is a dog.", tag: "ASSUMPTION" },
    { id: "n2", text: "John has four legs.", tag: "CONSEQUENCE" },
  ],
  relations: [
    { from: "n1", relation: "IMPLIES", to: "n2" },
  ],
};

describe("validateNaiveDI", () => {
  it("accepts the example structure and hands back the data", () => {
    const result = validateNaiveDI(validOutput);

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.data).toBe(validOutput);
  });

  it("accepts an empty graph", () => {
    expect(validateNaiveDI({ nodes: [], relations: [] }).valid).toBe(true);
  });

  it("rejects a tag that is not registered", () => {
    const result = validateNaiveDI({
      ...validOutput,
      nodes: [{ id: "n1", text: "John is a dog.", tag: "VIBE" }],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.join(" ")).toMatch(/tag/);
  });

  it("accepts any relation name the AI invents", () => {
    for (const relation of ["CAUSES", "is", "depends on", "supports"]) {
      const result = validateNaiveDI({
        nodes: validOutput.nodes,
        relations: [{ from: "n1", relation, to: "n2" }],
      });
      expect(result.valid).toBe(true);
    }
  });

  it("rejects a relation with no name at all", () => {
    const result = validateNaiveDI({
      nodes: validOutput.nodes,
      relations: [{ from: "n1", relation: "", to: "n2" }],
    });
    expect(result.valid).toBe(false);
  });

  it("rejects a missing required field", () => {
    const result = validateNaiveDI({
      ...validOutput,
      nodes: [{ id: "n1", text: "John is a dog." }],
    });
    expect(result.valid).toBe(false);
  });

  it("rejects unknown extra properties", () => {
    const result = validateNaiveDI({
      ...validOutput,
      extra: "anything",
    });
    expect(result.valid).toBe(false);
  });

  it("rejects a relation pointing at a node that does not exist", () => {
    const result = validateNaiveDI({
      nodes: [validOutput.nodes[0]],
      relations: validOutput.relations,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.join(" ")).toMatch(/does not exist/);
  });

  it("rejects something that is not JSON at all", () => {
    expect(validateNaiveDI("John is a dog.").valid).toBe(false);
  });
});
