import type {
  EvaluationInput,
  EvaluationResult,
  CompatibilityRule,
} from "./permissions.types";

const compatibilityRules: CompatibilityRule[] = [
  {
    subjectType: "user",
    actions: ["CREATE", "READ", "UPDATE", "DELETE"],
    resources: ["notebook", "document", "dataset", "file"],
  },
  {
    subjectType: "agent",
    actions: ["READ", "EXECUTE"],
    resources: ["notebook", "document", "dataset"],
  },
  {
    subjectType: "worker",
    actions: ["EXECUTE"],
    resources: ["workflow", "function"],
  },
  {
    subjectType: "app",
    actions: ["READ", "CREATE", "UPDATE"],
    resources: ["notebook", "document"],
  },
];

function isCompatible(
  input: EvaluationInput,
  rule: CompatibilityRule
): boolean {
  if (input.subject.type !== rule.subjectType) return false;
  if (!rule.actions.includes(input.action)) return false;
  if (rule.resources && !rule.resources.includes(input.resource.type))
    return false;
  return true;
}

export function decide(input: EvaluationInput): EvaluationResult {
  const compatible = compatibilityRules.some((rule) =>
    isCompatible(input, rule)
  );

  return {
    decision: compatible ? "ALLOW" : "DENY",
    reason: compatible
      ? undefined
      : `No compatibility rule matches ${input.subject.type}:${input.action}:${input.resource.type}`,
    evaluatedAt: new Date().toISOString(),
  };
}

export async function can(
  input: EvaluationInput
): Promise<EvaluationResult> {
  return decide(input);
}
