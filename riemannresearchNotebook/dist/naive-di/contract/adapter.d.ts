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
import type { ExecutorProof, JudgmentProof, Output, Proof, Verdict } from "../schema.js";
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
export declare class NoExecutorError extends Error {
    constructor(language: string);
}
export declare class NoJudgeError extends Error {
    constructor();
}
export type ProofEnvironment = {
    /** Keyed by language name. Open set: any domain can appear here. */
    executors: Record<string, Executor>;
    judge?: Judge;
    /** Recorded on the verdict, so a lock can be broken by the judge changing. */
    judgeVersion?: string;
};
export declare function judgeOutcome(proof: JudgmentProof, decision: string | number): Verdict["outcome"];
/**
 * Prove one contract. The sentence text goes in, so the verdict carries the
 * version it was produced against and can later be recognised as stale.
 */
export declare function runProof(contract: ProvableContract, sentenceText: string, environment: ProofEnvironment): Promise<Verdict>;
