/**
 * Unit -> the node and edge index the runner walks.
 *
 *   entry   one per program: the sentence
 *   step    one per `step`
 *   halt    one per unit, shared sink for every `catch ... halt`
 *   portal  one per behavior referenced by `goto <Name>`
 *
 * Edge ids are prefixed with the unit name so a path can be carried across
 * unit boundaries when the run walks into a behavior.
 *
 * There is no geometry in here on purpose. The unit is presented as an ordered
 * list of steps in source order — position is the row's place in that list.
 */

export function buildGraph(unit, knownNames) {
  const nodes = [];
  const edges = [];
  const has = new Set();
  const addNode = (n) => {
    if (has.has(n.id)) return;
    has.add(n.id);
    nodes.push(n);
  };

  const stepId = new Map();
  unit.steps.forEach((s, i) => {
    const id = `n${i}`;
    stepId.set(s.term, id);
    addNode({ id, type: "step", data: { label: s.term } });
  });

  if (unit.kind === "program") {
    addNode({
      id: "entry",
      type: "entry",
      data: { label: unit.sentence ?? unit.name },
    });
    if (unit.steps.length) {
      edges.push({
        id: `${unit.name}::enter`,
        source: "entry",
        target: "n0",
        label: unit.enter ?? "",
        data: { kind: "step" },
      });
    }
  }

  unit.steps.forEach((s, i) => {
    s.catches.forEach((c, j) => {
      const id = `${unit.name}::${i}:${j}`;

      if (c.isHalt) {
        addNode({ id: "halt", type: "halt", data: { label: "halt" } });
        edges.push({ id, source: `n${i}`, target: "halt", label: c.response, data: { kind: "halt" } });
        return;
      }

      if (stepId.has(c.target)) {
        edges.push({
          id,
          source: `n${i}`,
          target: stepId.get(c.target),
          label: c.response,
          data: { kind: "step" },
        });
        return;
      }

      if (knownNames.has(c.target)) {
        addNode({
          id: `portal:${c.target}`,
          type: "portal",
          data: { label: c.target, behavior: c.target },
        });
        edges.push({
          id,
          source: `n${i}`,
          target: `portal:${c.target}`,
          label: c.response,
          data: { kind: "behavior", behavior: c.target },
        });
        return;
      }

      addNode({ id: "halt", type: "halt", data: { label: "halt" } });
      edges.push({
        id,
        source: `n${i}`,
        target: "halt",
        label: `?? ${c.target}`,
        data: { kind: "error" },
      });
    });
  });

  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const edgeById = new Map(edges.map((e) => [e.id, e]));
  const first = unit.kind === "program" ? "entry" : "n0";

  return { unit, nodes, edges, nodeById, edgeById, first };
}
