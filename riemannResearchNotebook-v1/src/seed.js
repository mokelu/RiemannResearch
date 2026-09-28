/**
 * TEMPORARY scaffolding: an example structure to load so the views can be
 * tried without a live model call. It is NOT the source of the Space — that is
 * a validated AI reply adopted through the chat.
 *
 * Nodes are listed in reading order, so the Document view reads as a coherent
 * write-up; the tags and relations stay as metadata for the other views.
 */

export const SEEDS = {
  Reasoning: {
    nodes: [
      { id: "Q", text: "Does drinking coffee every morning improve sustained focus across a workday?", tag: "QUESTION" },
      { id: "C1", text: "Daily morning coffee improves sustained focus across a workday.", tag: "CLAIM" },
      { id: "P1", text: "Caffeine blocks adenosine receptors, which lowers the feeling of tiredness.", tag: "PREMISE" },
      { id: "P2", text: "Lower perceived tiredness is associated with better performance on attention tasks.", tag: "PREMISE" },
      { id: "E1", text: "In a controlled trial, participants who took 200mg of caffeine scored higher on a vigilance test than those given a placebo.", tag: "EVIDENCE" },
      { id: "E2", text: "Self-reported alertness among office workers rises within thirty minutes of their first cup and stays elevated for roughly four hours.", tag: "EVIDENCE" },
      { id: "I1", text: "If caffeine lowers tiredness, and lower tiredness supports attention, then coffee should help attention for a few hours after a cup.", tag: "INFERENCE" },
      { id: "C2", text: "For most people, a morning cup of coffee improves focus for a limited window after drinking it.", tag: "CONCLUSION" },
      { id: "O1", text: "Habitual drinkers build a tolerance, so the boost may shrink to merely reversing withdrawal.", tag: "OBJECTION" },
      { id: "E3", text: "Regular consumers perform no better than non-consumers on attention tests once caffeine is withheld overnight.", tag: "EVIDENCE" },
      { id: "I2", text: "If tolerance offsets the benefit, then the lift largely reflects avoiding withdrawal rather than a genuine gain.", tag: "INFERENCE" },
      { id: "K1", text: "The effect is confounded by sleep: people reach for coffee after a poor night, and poor sleep harms focus on its own.", tag: "CONSTRAINT" },
      { id: "R1", text: "Because sleep quality independently drives attention, studies that ignore it overstate coffee's effect.", tag: "CAUSE" },
      { id: "H1", text: "Any real benefit of coffee is small, and mostly limited to occasional rather than daily drinkers.", tag: "HYPOTHESIS" },
      { id: "PR1", text: "An occasional drinker should show a clearer focus gain than a heavy daily drinker under the same conditions.", tag: "PREDICTION" },
      { id: "C3", text: "Coffee is best understood as a short-term aid that returns a tired person toward normal, not as a reliable enhancer.", tag: "CONCLUSION" },
    ],
    relations: [
      { from: "Q", relation: "leads to", to: "C1" },
      { from: "P1", relation: "supports", to: "I1" },
      { from: "P2", relation: "supports", to: "I1" },
      { from: "E1", relation: "supports", to: "P2" },
      { from: "E2", relation: "supports", to: "C1" },
      { from: "I1", relation: "implies", to: "C2" },
      { from: "O1", relation: "challenges", to: "C2" },
      { from: "E3", relation: "supports", to: "O1" },
      { from: "O1", relation: "implies", to: "I2" },
      { from: "K1", relation: "supports", to: "R1" },
      { from: "R1", relation: "undermines", to: "C1" },
      { from: "I2", relation: "supports", to: "H1" },
      { from: "H1", relation: "predicts", to: "PR1" },
      { from: "I2", relation: "supports", to: "C3" },
      { from: "R1", relation: "supports", to: "C3" },
    ],
  },
};
