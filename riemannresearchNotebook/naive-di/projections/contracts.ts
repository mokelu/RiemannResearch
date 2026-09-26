/**
 * The Contracts projection: which sentences have something standing under them,
 * and whether what is standing there still satisfies them.
 *
 * This is where the two authorities are kept visibly apart. A lock earned by an
 * executor and a lock earned by JEV are both shown, labelled, and never allowed
 * to resemble each other. A sentence that has been measured but not decided is
 * displayed as exactly that, rather than rounded up into a pass.
 */

import type { Surface } from "../render/surface.js";
import type { LockState } from "../contract/lock.js";
import { lockState } from "../contract/lock.js";
import { sentenceVersion } from "../contract/version.js";
import { tagLabel } from "../render/wording.js";

export type ContractView = {
  id: string;
  domain: string;
  sentenceId: string;
  sentenceTag: string;
  text: string;
  version: string;
  makes: string;
  provedBy: string;
  verdict: string;
  lock: LockState;
};

export function contractViews(
  surface: Surface,
  options: { judgeVersion?: string } = {},
): ContractView[] {
  const graph = surface.graph;

  return graph.contracts().map((contract) => {
    const makes =
      contract.output.kind === "file"
        ? `${contract.output.path} (${contract.output.language})`
        : `sentence ${contract.output.target} in this structure`;

    const provedBy =
      contract.proof.kind === "executor"
        ? `executor: ${contract.proof.expects}`
        : contract.proof.accepts
          ? `JEV ${contract.proof.decision} >= ${contract.proof.accepts.min}: ${contract.proof.question}`
          : `JEV ${contract.proof.decision}, undecided: ${contract.proof.question}`;

    const verdict = contract.verdict
      ? contract.verdict.decision === null || contract.verdict.decision === undefined
        ? contract.verdict.outcome
        : `${contract.verdict.outcome} (${contract.verdict.decision})`
      : "not yet run";

    return {
      id: contract.id,
      domain: contract.domain,
      sentenceId: contract.sentence.id,
      sentenceTag: tagLabel(contract.sentence.tag),
      text: contract.sentence.text,
      version: sentenceVersion(contract.sentence.text),
      makes,
      provedBy,
      verdict,
      lock: lockState(contract, contract.sentence.text, options),
    };
  });
}

export function renderContracts(
  surface: Surface,
  options: { judgeVersion?: string } = {},
): string {
  const views = contractViews(surface, options);
  if (views.length === 0) return "No sentence is under contract.";

  return views
    .map((view) =>
      [
        `${view.id}  [${view.domain}]  ${view.sentenceTag} ${view.sentenceId}: ${view.text}`,
        `    wording v${view.version}`,
        `    makes    ${view.makes}`,
        `    proved by ${view.provedBy}`,
        `    verdict  ${view.verdict}`,
        `    ${describeLock(view.lock)}`,
      ].join("\n"),
    )
    .join("\n\n");
}

function describeLock(lock: LockState): string {
  switch (lock.state) {
    case "LOCKED":
      return `LOCKED by ${lock.authority === "mechanical" ? "mechanical execution" : "intelligent judgement"}`;
    default:
      return `${lock.state} — ${lock.reason}`;
  }
}
