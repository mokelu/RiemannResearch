/**
 * The Structure projection: the canonical object shown as itself.
 *
 * This is the view formerly mistaken for a "code view". It shows the structure,
 * not any implementation, so the word *code* is now free to mean the thing an
 * AI writes underneath a sentence.
 *
 * Zero interpretation: it prints the JSON exactly as the runtime holds it, then
 * the same thing as the objects it was instantiated into.
 */

import { tagLabel } from "../render/wording.js";

export function renderStructure(surface) {
  const graph = surface.graph;
  const json = JSON.stringify(surface.toJSON(), null, 2);

  const instances = [
    ...graph
      .nodes()
      .map(
        (node) =>
          `const ${node.id} = new RuntimeNode(${JSON.stringify(node.id)}, ${JSON.stringify(node.text)}, ${JSON.stringify(node.tag)});`,
      ),
    "",
    ...graph
      .relations()
      .map(
        (relation) =>
          `new RuntimeRelation(${relation.from.id}, ${JSON.stringify(relation.relation)}, ${relation.to.id});`,
      ),
    "",
    ...graph
      .contracts()
      .map(
        (contract) =>
          `new RuntimeContract(${JSON.stringify(contract.id)}, ${contract.sentence.id}, ${JSON.stringify(contract.domain)}); // ${tagLabel(contract.sentence.tag)}`,
      ),
  ]
    .join("\n")
    .trim();

  return [
    "// the canonical structure, as data",
    json,
    "",
    "// the same structure, as live objects",
    instances || "// nothing instantiated yet",
  ].join("\n");
}
