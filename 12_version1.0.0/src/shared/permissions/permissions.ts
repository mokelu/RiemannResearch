import type {
  EvaluationInput,
  EvaluationResult,
  CompatibilityRule,
} from "./permissions.types";

const compatibilityRules: CompatibilityRule[] = [
  {
    subjectType: "user",
    actions: ["CREATE", "READ", "UPDATE", "DELETE"],
    resources: ["notebook", "document", "artifact"],
  },
  {
    subjectType: "agent",
    actions: ["READ"],
    resources: ["notebook", "document"],
  },
  {
    subjectType: "worker",
    actions: ["EXECUTE"],
    resources: ["artifact"],
  },
  {
    subjectType: "plugin",
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
  if (!rule.resources.includes(input.resource.type)) return false;

  if (
    input.context?.ownerId &&
    input.context?.requesterId &&
    input.context.ownerId !== input.context.requesterId
  ) {
    if (input.action === "DELETE" || input.action === "UPDATE") {
      return false;
    }
  }

  return true;
}

export function decide(input: EvaluationInput): EvaluationResult {
  const matchedRules: string[] = [];
  const failedRules: string[] = [];

  for (const rule of compatibilityRules) {
    if (isCompatible(input, rule)) {
      matchedRules.push(`${rule.subjectType}:${rule.actions.join(",")}:${rule.resources.join(",")}`);
    } else {
      failedRules.push(`${rule.subjectType}:${rule.actions.join(",")}:${rule.resources.join(",")}`);
    }
  }

  const compatible = matchedRules.length > 0;

  return {
    decision: compatible ? "ALLOW" : "DENY",
    reason: compatible
      ? undefined
      : `No compatibility rule matches ${input.subject.type}:${input.action}:${input.resource.type}`,
    failedRules,
    evaluatedAt: new Date().toISOString(),
  };
}

export async function can(
  input: EvaluationInput
): Promise<EvaluationResult> {
  return decide(input);
}
