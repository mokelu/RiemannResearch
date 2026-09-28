import { describe, expect, it } from "vitest";
import { RIEMANN_SYSTEM_PROMPT } from "./prompt.js";
import { NODE_TAGS } from "../vocabulary.js";

describe("RIEMANN_SYSTEM_PROMPT", () => {
  it("names every registered tag, so the contract cannot fall behind the vocabulary", () => {
    for (const tag of NODE_TAGS) {
      expect(RIEMANN_SYSTEM_PROMPT).toContain(tag);
    }
  });

  it("requires both top-level keys the schema accepts", () => {
    expect(RIEMANN_SYSTEM_PROMPT).toContain('"nodes"');
    expect(RIEMANN_SYSTEM_PROMPT).toContain('"relations"');
  });

  it("lists the required field names for a node and a relation", () => {
    for (const field of ["id", "text", "tag", "from", "relation", "to"]) {
      expect(RIEMANN_SYSTEM_PROMPT).toContain(`"${field}"`);
    }
  });

  it("forbids anything that is not the JSON object", () => {
    expect(RIEMANN_SYSTEM_PROMPT).toMatch(/JSON only/);
    expect(RIEMANN_SYSTEM_PROMPT).toMatch(/No markdown/);
  });
});
