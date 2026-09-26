/**
 * The state a contract is in, computed rather than stored.
 *
 * A lock is not a flag on a file. It is the statement that this sentence, this
 * thing, and this proof currently agree. Because agreement can be lost in more
 * than one way, the state is derived every time from what the structure says
 * now — so nothing can claim a lock that the facts no longer support.
 *
 * The two authorities are kept visibly apart:
 *
 *   mechanical — an executor ran something with no imagination in it
 *   judged    — JEV answered a question that needed taste or understanding
 *
 * A judged lock is still a lock. It is simply never allowed to look like the
 * mechanical kind, because a score of 0.82 is a measurement and not a proof.
 */

import type { Verdict } from "../schema.js";
import { sentenceVersion } from "./version.js";

/**
 * Whatever a contract is — plain data or a live runtime object — the state only
 * depends on the verdict standing on it, so both satisfy this shape.
 */
export type ContractFacts = { readonly verdict?: Verdict };

export type Authority = "mechanical" | "judged";

export type LockState =
  | { state: "UNBOUND"; reason: string }
  | { state: "NEEDS_PROOF"; reason: string }
  | { state: "STALE"; reason: string }
  | { state: "JUDGE_CHANGED"; reason: string }
  | { state: "BROKEN"; reason: string }
  | { state: "INCONCLUSIVE"; reason: string }
  | { state: "LOCKED"; authority: Authority };

export function authorityOf(contract: ContractFacts): Authority | undefined {
  if (!contract.verdict) return undefined;
  return contract.verdict.kind === "executor" ? "mechanical" : "judged";
}

export function lockState(
  contract: ContractFacts,
  sentenceText: string,
  options: { judgeVersion?: string } = {},
): LockState {
  const verdict = contract.verdict;

  if (!verdict) {
    return {
      state: "NEEDS_PROOF",
      reason: "no verdict recorded against this contract yet",
    };
  }

  const current = sentenceVersion(sentenceText);
  if (verdict.sentenceVersion !== current) {
    return {
      state: "STALE",
      reason: `proved against an earlier wording of the sentence (${verdict.sentenceVersion}, now ${current})`,
    };
  }

  if (verdict.kind === "jev" && options.judgeVersion && verdict.judgeVersion) {
    if (options.judgeVersion !== verdict.judgeVersion) {
      return {
        state: "JUDGE_CHANGED",
        reason: `judged by ${verdict.judgeVersion}, which is no longer the connected judge (${options.judgeVersion})`,
      };
    }
  }

  switch (verdict.outcome) {
    case "PASS": {
      const authority = authorityOf(contract);
      if (!authority) return { state: "UNBOUND", reason: "no authority for this verdict" };
      return { state: "LOCKED", authority };
    }

    case "FAIL":
      return {
        state: "BROKEN",
        reason: "the proof ran and the thing does not satisfy its sentence",
      };

    case "INCONCLUSIVE":
      return {
        state: "INCONCLUSIVE",
        reason:
          "measured but undecidable: declare what result satisfies the sentence to earn a lock",
      };
  }
}

/** Whether an edit to this contract's sentence has to be propagated by the AI. */
export function needsRegeneration(
  contract: ContractFacts,
  sentenceText: string,
): boolean {
  const state = lockState(contract, sentenceText);
  return state.state === "STALE" || state.state === "NEEDS_PROOF";
}
