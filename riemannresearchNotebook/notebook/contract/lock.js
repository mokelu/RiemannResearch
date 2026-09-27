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

import { sentenceVersion } from "./version.js";

/** Which authority stands behind a verdict, if any. */
export function authorityOf(contract) {
  if (!contract.verdict) return undefined;
  return contract.verdict.kind === "executor" ? "mechanical" : "judged";
}

/**
 * Derive a contract's state from what the structure says right now. `contract`
 * only needs a `verdict`; `options.judgeVersion` is the currently connected
 * judge, if any.
 */
export function lockState(contract, sentenceText, options = {}) {
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
export function needsRegeneration(contract, sentenceText) {
  const state = lockState(contract, sentenceText);
  return state.state === "STALE" || state.state === "NEEDS_PROOF";
}
