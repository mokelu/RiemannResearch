import { parseAb } from "./parse.js";
import { buildGraph } from "./graph.js";

/**
 * Pull every runnable .ab unit out of rewriteJS/leftpanel at build time.
 * Only programs and behaviors execute — alphabet.ab and grammar.ab are
 * definition files and are deliberately not parsed as units.
 */
const RAW = import.meta.glob("../../rewriteJS/leftpanel/{programs,behaviors}/**/*.ab", {
  query: "?raw",
  import: "default",
  eager: true,
});

export const loadErrors = [];
const units = {};

/** Not machines — they define the vocabulary the machines are written in. */
const META = new Set(["alphabet.ab", "grammar.ab"]);

for (const [path, text] of Object.entries(RAW)) {
  const base = path.split("/").pop();
  if (META.has(base)) continue;

  const unit = parseAb(text, path.replace(/^.*rewriteJS\//, "rewriteJS/"));
  loadErrors.push(...unit.errors);
  if (!unit.kind) {
    loadErrors.push(`${path}: no "program" or "behavior" declaration`);
    continue;
  }
  if (units[unit.name]) {
    loadErrors.push(`${path}: duplicate name "${unit.name}"`);
    continue;
  }
  units[unit.name] = unit;
}

const known = new Set(Object.keys(units));

export const graphs = {};
export const programs = [];
export const behaviors = [];

for (const [name, unit] of Object.entries(units)) {
  graphs[name] = buildGraph(unit, known);
  (unit.kind === "program" ? programs : behaviors).push(name);
}

programs.sort();
behaviors.sort();

export const loadedCount = programs.length + behaviors.length;
