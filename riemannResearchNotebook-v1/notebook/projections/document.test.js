import { describe, expect, it } from "vitest";
import { Surface } from "../render/surface.js";
import { renderDocumentTree, renderDocumentText } from "./document.js";

const structure = {
  blocks: [
    { type: "heading", level: 1, runs: [{ kind: "text", text: "About John" }] },
    {
      type: "paragraph",
      runs: [
        { kind: "node", ref: "n1" },
        { kind: "text", text: " " },
        { kind: "node", ref: "n2" },
      ],
    },
    {
      type: "paragraph",
      runs: [
        { kind: "text", text: "So, " },
        { kind: "node", ref: "n3" },
      ],
    },
    {
      type: "list",
      ordered: false,
      items: [{ runs: [{ kind: "node", ref: "e1" }] }],
    },
  ],
  nodes: [
    { id: "n1", text: "John is a dog.", tag: "ASSUMPTION" },
    { id: "n2", text: "John has four legs.", tag: "CONSEQUENCE" },
    { id: "n3", text: "John is an animal.", tag: "INFERENCE" },
    { id: "e1", text: "I saw him walking.", tag: "EVIDENCE" },
  ],
  relations: [
    { from: "n1", relation: "implies", to: "n2" },
    { from: "n2", relation: "implies", to: "n3" },
  ],
};

const surface = Surface.open(structure);
const text = renderDocumentText(surface);
const tree = renderDocumentTree(surface);

describe("renderDocumentTree", () => {
  it("maps blocks onto described elements in reading order", () => {
    expect(tree[0].tag).toBe("h1");
    expect(tree[1].tag).toBe("p");
    expect(tree[3].tag).toBe("ul");
  });

  it("wraps a reasoning sentence in a span that carries its tag as metadata", () => {
    const nodeRun = tree[1].children[0];
    expect(nodeRun.tag).toBe("span");
    expect(nodeRun.props["data-riemann-tag"]).toBe("ASSUMPTION");
    expect(nodeRun.props["data-node-id"]).toBe("n1");
    expect(nodeRun.children).toEqual(["John is a dog."]);
  });
});

describe("renderDocumentText", () => {
  it("prints the heading text and the paragraph text", () => {
    expect(text).toContain("# About John");
    expect(text).toContain("John is a dog. John has four legs.");
  });

  it("keeps connective text exactly where the block put it", () => {
    expect(text).toContain("So, John is an animal.");
  });

  it("never prints a tag label into the document", () => {
    for (const word of ["Assumption", "Consequence", "Inference", "ASSUMPTION"]) {
      expect(text).not.toContain(word);
    }
  });

  it("never prints a relation word into the document", () => {
    for (const word of ["therefore", "Therefore", "implies"]) {
      expect(text).not.toContain(word);
    }
  });

  it("renders a list item as a bullet", () => {
    expect(text).toContain("I saw him walking.");
  });

  it("handles an empty structure", () => {
    expect(renderDocumentText(Surface.empty())).toBe(
      "Nothing has been reasoned yet.",
    );
  });
});
