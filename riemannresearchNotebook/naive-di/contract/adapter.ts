/**
 * The two ways a contract can be proved, and the one door that reaches them.
 *
 * Nothing here knows whether the thing under contract is SurrealQL, a video
 * edit, an audio arrangement or an image layout. An executor is registered
 * against a language name, so adding a domain means adding a registration, not
 * changing this file.
 *
 * Two rules matter:
 *
 *   - A contract with no executor for its language cannot be proved. Naming a
 *     domain is always allowed; getting a verdict is not. The absence is
 *     reported, never substituted with a guess.
 *
 *   - A judgement is a measurement. It becomes PASS or FAIL only if the contract
 *     declared what score counts. Otherwise the verdict is INCONCLUSIVE, which is
 *     recorded and visible but cannot grant a lock.
 */

import type {
  ExecutorProof,
  JudgmentProof,
  Output,
  Proof,
  Verdict,
} from "../schema.js";
import { sentenceVersion } from "./version.js";

/**
 * A contract, whether plain data or a live runtime object. Proving needs the
 * sentence's words separately, so the sentence itself is deliberately not part
 * of this shape.
 */
export type ProvableContract = {
  readonly id: string;
  readonly domain: string;
  readonly output: Output;
  readonly proof: Proof;
};

export type ExecutionRequest = {
  contract: ProvableContract;
  proof: ExecutorProof;
};

export type ExecutionResult = {
  outcome: "PASS" | "FAIL";
  detail?: string;
};

export type JudgementRequest = {
  contract: ProvableContract;
  proof: JudgmentProof;
  /** The structure JEV is being asked about. */
  state: unknown;
};

export type JudgementResult = {
  decision: string | number;
};

/** Runs a proof natively: a temporary database, a compiler, a test runner. */
export type Executor = (request: ExecutionRequest) => Promise<ExecutionResult>;

/** Asks JEV a typed question and takes back a typed decision. */
export type Judge = (request: JudgementRequest) => Promise<JudgementResult>;

export class NoExecutorError extends Error {
  constructor(language: string) {
    super(`no executor registered for "${language}", so this contract cannot be proved`);
    this.name = "NoExecutorError";
  }
}

export class NoJudgeError extends Error {
  constructor() {
    super("this contract asks for judgement and no judge is connected");
    this.name = "NoJudgeError";
  }
}

export type ProofEnvironment = {
  /** Keyed by language name. Open set: any domain can appear here. */
  executors: Record<string, Executor>;
  judge?: Judge;
  /** Recorded on the verdict, so a lock can be broken by the judge changing. */
  judgeVersion?: string;
};

export function judgeOutcome(
  proof: JudgmentProof,
  decision: string | number,
): Verdict["outcome"] {
  if (typeof decision !== "number") return "INCONCLUSIVE";
  if (proof.accepts === undefined) return "INCONCLUSIVE";
  return decision >= proof.accepts.min ? "PASS" : "FAIL";
}

/**
 * Prove one contract. The sentence text goes in, so the verdict carries the
 * version it was produced against and can later be recognised as stale.
 */
export async function runProof(
  contract: ProvableContract,
  sentenceText: string,
  environment: ProofEnvironment,
): Promise<Verdict> {
  const proof = contract.proof;

  if (proof.kind === "executor") {
    if (contract.output.kind !== "file") {
      throw new NoExecutorError(contract.domain);
    }

    const executor = environment.executors[contract.output.language];
    if (!executor) {
      throw new NoExecutorError(contract.output.language);
    }

    const result = await executor({ contract, proof });
    return {
      kind: "executor",
      outcome: result.outcome,
      decision: result.detail ?? null,
      judgeVersion: null,
      sentenceVersion: sentenceVersion(sentenceText),
    };
  }

  if (!environment.judge) throw new NoJudgeError();

  const judgement = await environment.judge({ contract, proof, state: sentenceText });

  return {
    kind: "jev",
    outcome: judgeOutcome(proof, judgement.decision),
    decision: judgement.decision,
    judgeVersion: environment.judgeVersion ?? null,
    sentenceVersion: sentenceVersion(sentenceText),
  };
}
