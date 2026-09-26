/**
 * The only way an interactive view may ask for a change.
 *
 * These operations are structural, never semantic: a patch can add a sentence,
 * rename its tag or wire two sentences together, but it cannot claim anything
 * is true. A patch is applied to plain data and the result goes back through
 * the same validator the AI's output faces, so an edit made by dragging a card
 * is held to exactly the standard as one made by a model.
 *
 * Nothing here mutates its input. A patch produces a new object or fails.
 */
import type { Contract, NaiveDIInput, Output, Proof, Verdict } from "../schema.js";
import type { NodeTag, RelationLabel } from "../vocabulary.js";
export type Patch = {
    op: "addNode";
    id: string;
    text: string;
    tag: NodeTag;
} | {
    op: "removeNode";
    id: string;
} | {
    op: "setText";
    id: string;
    text: string;
} | {
    op: "retag";
    id: string;
    tag: NodeTag;
} | {
    op: "connect";
    from: string;
    relation: RelationLabel;
    to: string;
} | {
    op: "disconnect";
    from: string;
    relation: RelationLabel;
    to: string;
}
/** Place a sentence under contract. The sentence itself is unchanged. */
 | {
    op: "bindContract";
    contract: Contract;
} | {
    op: "unbindContract";
    id: string;
} | {
    op: "setOutput";
    id: string;
    output: Output;
} | {
    op: "setProof";
    id: string;
    proof: Proof;
}
/** Attach the result of running a proof. Never granted a lock here. */
 | {
    op: "recordVerdict";
    id: string;
    verdict: Verdict;
};
/** Thrown when a patch names a node that is not in the structure. */
export declare class UnknownNodeError extends Error {
    constructor(id: string);
}
export declare function applyPatch(input: NaiveDIInput, patch: Patch): NaiveDIInput;
/** Thrown when a patch names a contract that is not in the structure. */
export declare class UnknownContractError extends Error {
    constructor(id: string);
}
