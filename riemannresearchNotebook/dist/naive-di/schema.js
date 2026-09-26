/**
 * The JSON Schema describing valid AI output.
 *
 * This is NOT something the AI generates. It is maintained here, derived from
 * our vocabulary, and it is the small boundary the system enforces.
 *
 * Two systems share one document. Sentences and wires are the original Naive DI
 * pair. A contract is a separate object that *points at* a sentence, so nothing
 * about the sentence vocabulary changes to support code, video, audio or images:
 * IMPLEMENTATION and PROOF are deliberately not tags.
 */
import { NODE_TAGS } from "./vocabulary.js";
/** What a contract makes, and where it lives. */
const fileOutput = {
    type: "object",
    additionalProperties: false,
    required: ["kind", "path", "language"],
    properties: {
        kind: { const: "file" },
        /** An external thing: TypeScript, SurrealQL, an edit list, a scene file. */
        path: { type: "string", minLength: 1 },
        /** Open vocabulary. Naming a domain is always allowed. */
        language: { type: "string", minLength: 1 },
    },
};
const nodeOutput = {
    type: "object",
    additionalProperties: false,
    required: ["kind", "target"],
    properties: {
        kind: { const: "node" },
        /**
         * The thing being made is other sentences. This is what lets a video edit or
         * an image layout be built from the same structure that describes it, which
         * in turn is what lets JEV see it at all.
         */
        target: { type: "string", minLength: 1 },
    },
};
/** How a contract gets proved: mechanical execution, or intelligent judgement. */
const executorProof = {
    type: "object",
    additionalProperties: false,
    required: ["kind", "setup", "action", "expects"],
    properties: {
        kind: { const: "executor" },
        /** The native environment to run in: temporary SurrealDB, compiler, runtime. */
        setup: { type: "string", minLength: 1 },
        action: { type: "string", minLength: 1 },
        /** The claim that turns execution into a verdict. Without it there is no PASS. */
        expects: { type: "string", minLength: 1 },
    },
};
const judgmentProof = {
    type: "object",
    additionalProperties: false,
    required: ["kind", "question", "decision"],
    properties: {
        kind: { const: "jev" },
        question: { type: "string", minLength: 1 },
        /** Which typed decision JEV returns. Not a tag; a contract field. */
        decision: { enum: ["Noul", "Choice", "Score"] },
        /**
         * A judgement is a measurement, not a verdict. Declaring what counts turns
         * the number into PASS or FAIL. Without it the verdict stays INCONCLUSIVE:
         * real, recorded, visible, and unable to grant a lock.
         */
        accepts: {
            type: "object",
            additionalProperties: false,
            required: ["min"],
            properties: { min: { type: "number", minimum: 0, maximum: 1 } },
        },
    },
};
const verdict = {
    type: "object",
    additionalProperties: false,
    required: ["kind", "outcome", "sentenceVersion"],
    properties: {
        kind: { enum: ["executor", "jev"] },
        outcome: { enum: ["PASS", "FAIL", "INCONCLUSIVE"] },
        /** The decision JEV returned, before anything compared it to a threshold. */
        decision: {
            oneOf: [{ type: "string" }, { type: "number" }, { type: "null" }],
        },
        /** Recorded so a lock can be broken by the judge changing, not only the sentence. */
        judgeVersion: { type: ["string", "null"] },
        /** Version of the sentence this verdict was produced against. */
        sentenceVersion: { type: "string", minLength: 1 },
    },
};
const contract = {
    type: "object",
    additionalProperties: false,
    required: ["id", "sentence", "domain", "output", "proof"],
    properties: {
        id: { type: "string", minLength: 1 },
        /** The sentence that is the contract. The human edits this, not the output. */
        sentence: { type: "string", minLength: 1 },
        /** code, video, audio, image, game, ... Nothing is enumerated here. */
        domain: { type: "string", minLength: 1 },
        output: { oneOf: [fileOutput, nodeOutput] },
        proof: { oneOf: [executorProof, judgmentProof] },
        verdict,
    },
};
export const naiveDISchema = {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: "https://riemann.research/schema/naive-di.json",
    type: "object",
    additionalProperties: false,
    required: ["nodes", "relations"],
    properties: {
        nodes: {
            type: "array",
            items: {
                type: "object",
                additionalProperties: false,
                required: ["id", "text", "tag"],
                properties: {
                    id: { type: "string", minLength: 1 },
                    text: { type: "string", minLength: 1 },
                    tag: { type: "string", enum: [...NODE_TAGS] },
                },
            },
        },
        relations: {
            type: "array",
            items: {
                type: "object",
                additionalProperties: false,
                required: ["from", "relation", "to"],
                properties: {
                    from: { type: "string", minLength: 1 },
                    /**
                     * Free text on purpose: the AI introduces the relation. The runtime
                     * asks only that it is there and that both ends exist.
                     */
                    relation: { type: "string", minLength: 1 },
                    to: { type: "string", minLength: 1 },
                },
            },
        },
        /** Absent for ordinary reasoning. Present when a sentence controls a thing. */
        contracts: {
            type: "array",
            items: contract,
        },
    },
};
