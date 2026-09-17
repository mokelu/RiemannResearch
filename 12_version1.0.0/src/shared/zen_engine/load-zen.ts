import jdm from "./jdm/permissions.json";

interface DecisionGraph {
  nodes: Array<{
    id: string;
    type: string;
    label: string;
    conditions?: Array<{
      field: string;
      operator: string;
      value: unknown;
    }>;
    value?: string;
  }>;
  edges: Array<{
    from: string;
    to: string;
    condition?: string;
  }>;
}

interface EvaluationInput {
  subject: { type: string; id: string };
  action: string;
  resource: { type: string; id?: string };
}

interface EvaluationResult {
  decision: "ALLOW" | "DENY";
  reason?: string;
  evaluatedAt: string;
}

export class ZenEngine {
  private graph: DecisionGraph;

  constructor() {
    this.graph = jdm as DecisionGraph;
  }

  evaluate(input: EvaluationInput): EvaluationResult {
    const startNode = this.graph.nodes.find((n) => n.id === "start");
    if (!startNode) {
      return {
        decision: "DENY",
        reason: "No start node in graph",
        evaluatedAt: new Date().toISOString(),
      };
    }

    let currentNodeId = startNode.id;

    while (true) {
      const edgesFromCurrent = this.graph.edges.filter(
        (e) => e.from === currentNodeId
      );
      const defaultEdge = edgesFromCurrent.find(
        (e) => e.condition === "default"
      );
      const nextEdge = edgesFromCurrent.find((e) => {
        if (!e.condition || e.condition === "default") return false;
        return this.evaluateCondition(e.condition, input);
      });

      const nextId = nextEdge?.to ?? defaultEdge?.to;
      if (!nextId) {
        return {
          decision: "DENY",
          reason: "No path found in decision graph",
          evaluatedAt: new Date().toISOString(),
        };
      }

      const nextNode = this.graph.nodes.find((n) => n.id === nextId);
      if (!nextNode) {
        return {
          decision: "DENY",
          reason: `Node ${nextId} not found`,
          evaluatedAt: new Date().toISOString(),
        };
      }

      if (nextNode.type === "output") {
        return {
          decision: (nextNode.value as "ALLOW" | "DENY") ?? "DENY",
          evaluatedAt: new Date().toISOString(),
        };
      }

      currentNodeId = nextId;
    }
  }

  private evaluateCondition(
    condition: string,
    input: EvaluationInput
  ): boolean {
    const match = condition.match(
      /(\w+)\.(\w+)\s*==\s*(\w+)/
    );
    if (!match) return false;

    const [, obj, field, value] = match;
    const actual =
      obj === "subject"
        ? (input.subject as Record<string, unknown>)[field]
        : obj === "action"
          ? input.action
          : obj === "resource"
            ? (input.resource as Record<string, unknown>)[field]
            : undefined;

    return actual === value;
  }
}
