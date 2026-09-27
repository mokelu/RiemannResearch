/**
 * The example dataset to load into the viewer, straight from the demo.
 * Every view reads this one structure.
 */

export const SEEDS = {
  Reasoning: {
    nodes: [
      { id: "n1", text: "John is a dog.", tag: "ASSUMPTION" },
      { id: "n2", text: "John has four legs.", tag: "CONSEQUENCE" },
      { id: "n3", text: "John is an animal.", tag: "INFERENCE" },
      { id: "e1", text: "I saw John walking on four legs.", tag: "EVIDENCE" },
      { id: "l1", text: "Cats are independent.", tag: "FACT" },
    ],
    relations: [
      { from: "n1", relation: "implies", to: "n2" },
      { from: "n2", relation: "implies", to: "n3" },
      { from: "e1", relation: "leans on", to: "n2" },
    ],
  },
};
