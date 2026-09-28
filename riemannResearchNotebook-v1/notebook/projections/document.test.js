import { describe, expect, it } from "vitest";
import { Surface } from "../render/surface.js";
import { renderDocument } from "./document.js";

const structure = {
  nodes: [
    { id: "n1", text: "John is a dog.", tag: "ASSUMPTION" },
    { id: "n2", text: "John has four legs.", tag: "CONSEQUENCE" },
    { id: "n3", text: "John is an animal.", tag: "INFERENCE" },
  ],
  relations: [
    { from: "n1", relation: "implies", to: "n2" },
    { from: "n2", relation: "implies", to: "n3" },
  ],
};

describe("renderDocument", () => {
  const doc = renderDocument(Surface.open(structure));

  it("prints every sentence text in the order it is stored", () => {
    expect(doc).toContain("John is a dog.");
    expect(doc.indexOf("John is a dog.") < doc.indexOf("John has four legs.")).toBe(true);
    expect(doc.indexOf("John has four legs.") < doc.indexOf("John is an animal.")).toBe(true);
  });

  it("never prints a tag label into the document", () => {
    for (const word of ["Assumption", "Consequence", "Inference", "ASSUMPTION"]) {
      expect(doc).not.toContain(word);
    }
  });

  it("never prints a relation word into the document", () => {
    for (const word of ["therefore", "Therefore", "implies"]) {
      expect(doc).not.toContain(word);
    }
  });

  it("adds nothing between the sentences — no separator I invent", () => {
    expect(doc).toBe("John is a dog.John has four legs.John is an animal.");
  });

  it("handles an empty structure", () => {
    expect(renderDocument(Surface.empty())).toBe("Nothing has been reasoned yet.");
  });
});
