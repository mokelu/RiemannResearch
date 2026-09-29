/**
 * The machine: where it stands, what path it took, how to move it.
 *
 * Position lives on a stack because `goto <behavior>` pushes — the run walks
 * into Redraw and stays there. The stack is lineage, not a call frame: there
 * is no returning to the line you jumped from.
 */

export function startState(graph) {
  return {
    stack: [{ unit: graph.unit.name, node: graph.first }],
    path: [],
    done: false,
  };
}

export function current(state) {
  return state.stack[state.stack.length - 1];
}

/** Feed one response in. Returns the next machine state. */
export function take(state, graph, edgeId) {
  const edge = graph.edgeById.get(edgeId);
  if (!edge || state.done) return state;

  const kind = edge.data?.kind;
  const path = [...state.path, edge.id];

  if (kind === "halt" || kind === "error") {
    return { ...state, path, done: true };
  }

  if (kind === "behavior") {
    const target = graph.nodeById.get(edge.target);
    const behaviourUnit = target?.data?.behavior;
    if (!behaviourUnit) return { ...state, path, done: true };
    return {
      ...state,
      path,
      stack: [...state.stack, { unit: behaviourUnit, node: "n0" }],
    };
  }

  const stack = state.stack.slice();
  stack[stack.length - 1] = { ...stack[stack.length - 1], node: edge.target };
  return { ...state, path, stack };
}

/** Every edge leaving the node the machine currently stands on. */
export function exitsOf(graph, state) {
  const { node } = current(state);
  return graph.edges.filter((e) => e.source === node);
}
