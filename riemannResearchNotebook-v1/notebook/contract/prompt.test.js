import { describe, expect, it } from "vitest";
import { RIEMANN_SYSTEM_PROMPT } from "./prompt.js";
import { NODE_TAGS, BLOCK_TYPES, RUN_KINDS, MARK_TYPES } from "../vocabulary.js";

describe("RIEMANN_SYSTEM_PROMPT", () => {
  it("names every registered tag, so the contract cannot fall behind the vocabulary", () => {
    for (const tag of NODE_TAGS) {
      expect(RIEMANN_SYSTEM_PROMPT).toContain(tag);
    }
  });

  it("names every block type, run kind, and mark the schema accepts", () => {
    for (const type of BLOCK_TYPES) expect(RIEMANN_SYSTEM_PROMPT).toContain(type);
    for (const kind of RUN_KINDS) expect(RIEMANN_SYSTEM_PROMPT).toContain(kind);
    for (const mark of MARK_TYPES) expect(RIEMANN_SYSTEM_PROMPT).toContain(mark);
  });

  it("requires all three top-level keys the schema accepts", () => {
    for (const key of ["blocks", "nodes", "relations"]) {
      expect(RIEMANN_SYSTEM_PROMPT).toContain(`"${key}"`);
    }
  });

  it("lists the required field names for a node and a relation", () => {
    for (const field of ["id", "text", "tag", "from", "relation", "to", "ref"]) {
      expect(RIEMANN_SYSTEM_PROMPT).toContain(`"${field}"`);
    }
  });

  it("forbids anything that is not the JSON object", () => {
    expect(RIEMANN_SYSTEM_PROMPT).toMatch(/JSON only/);
    expect(RIEMANN_SYSTEM_PROMPT).toMatch(/No markdown/);
  });

  it("forbids copying a node's sentence into a block instead of pointing", () => {
    expect(RIEMANN_SYSTEM_PROMPT).toMatch(/point at it with "ref"/);
  });
});
