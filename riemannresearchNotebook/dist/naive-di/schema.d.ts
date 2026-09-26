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
export declare const naiveDISchema: {
    readonly $schema: "https://json-schema.org/draft/2020-12/schema";
    readonly $id: "https://riemann.research/schema/naive-di.json";
    readonly type: "object";
    readonly additionalProperties: false;
    readonly required: readonly ["nodes", "relations"];
    readonly properties: {
        readonly nodes: {
            readonly type: "array";
            readonly items: {
                readonly type: "object";
                readonly additionalProperties: false;
                readonly required: readonly ["id", "text", "tag"];
                readonly properties: {
                    readonly id: {
                        readonly type: "string";
                        readonly minLength: 1;
                    };
                    readonly text: {
                        readonly type: "string";
                        readonly minLength: 1;
                    };
                    readonly tag: {
                        readonly type: "string";
                        readonly enum: readonly ["ENTITY", "PROPERTY", "VALUE", "EVENT", "TIME", "STATE", "PLACE", "THING", "RELATION", "FUNCTION", "ACTION", "FACT", "OBSERVATION", "DEFINITION", "CHOICE", "STRATEGY", "GOAL", "CLAIM", "QUESTION", "OBJECTION", "CONSEQUENCE", "ASSUMPTION", "EVIDENCE", "INFERENCE", "HYPOTHESIS", "PREDICTION", "PREMISE", "CONCLUSION", "CONDITION", "EVENT", "CAUSE", "EFFECT", "ANSWER", "INSTRUCTION", "INTENT", "CONSTRAINT", "REQUIREMENT", "PUNCTUATION", "COMMA", "PERIOD", "QUESTION_MARK", "EXCLAMATION_MARK", "COLON", "SEMICOLON", "PARENTHESIS", "BRACKET", "BRACE", "QUOTATION", "APOSTROPHE", "DASH", "HYPHEN", "ELLIPSIS", "SLASH"];
                    };
                };
            };
        };
        readonly relations: {
            readonly type: "array";
            readonly items: {
                readonly type: "object";
                readonly additionalProperties: false;
                readonly required: readonly ["from", "relation", "to"];
                readonly properties: {
                    readonly from: {
                        readonly type: "string";
                        readonly minLength: 1;
                    };
                    /**
                     * Free text on purpose: the AI introduces the relation. The runtime
                     * asks only that it is there and that both ends exist.
                     */
                    readonly relation: {
                        readonly type: "string";
                        readonly minLength: 1;
                    };
                    readonly to: {
                        readonly type: "string";
                        readonly minLength: 1;
                    };
                };
            };
        };
        /** Absent for ordinary reasoning. Present when a sentence controls a thing. */
        readonly contracts: {
            readonly type: "array";
            readonly items: {
                readonly type: "object";
                readonly additionalProperties: false;
                readonly required: readonly ["id", "sentence", "domain", "output", "proof"];
                readonly properties: {
                    readonly id: {
                        readonly type: "string";
                        readonly minLength: 1;
                    };
                    /** The sentence that is the contract. The human edits this, not the output. */
                    readonly sentence: {
                        readonly type: "string";
                        readonly minLength: 1;
                    };
                    /** code, video, audio, image, game, ... Nothing is enumerated here. */
                    readonly domain: {
                        readonly type: "string";
                        readonly minLength: 1;
                    };
                    readonly output: {
                        readonly oneOf: readonly [{
                            readonly type: "object";
                            readonly additionalProperties: false;
                            readonly required: readonly ["kind", "path", "language"];
                            readonly properties: {
                                readonly kind: {
                                    readonly const: "file";
                                };
                                /** An external thing: TypeScript, SurrealQL, an edit list, a scene file. */
                                readonly path: {
                                    readonly type: "string";
                                    readonly minLength: 1;
                                };
                                /** Open vocabulary. Naming a domain is always allowed. */
                                readonly language: {
                                    readonly type: "string";
                                    readonly minLength: 1;
                                };
                            };
                        }, {
                            readonly type: "object";
                            readonly additionalProperties: false;
                            readonly required: readonly ["kind", "target"];
                            readonly properties: {
                                readonly kind: {
                                    readonly const: "node";
                                };
                                /**
                                 * The thing being made is other sentences. This is what lets a video edit or
                                 * an image layout be built from the same structure that describes it, which
                                 * in turn is what lets JEV see it at all.
                                 */
                                readonly target: {
                                    readonly type: "string";
                                    readonly minLength: 1;
                                };
                            };
                        }];
                    };
                    readonly proof: {
                        readonly oneOf: readonly [{
                            readonly type: "object";
                            readonly additionalProperties: false;
                            readonly required: readonly ["kind", "setup", "action", "expects"];
                            readonly properties: {
                                readonly kind: {
                                    readonly const: "executor";
                                };
                                /** The native environment to run in: temporary SurrealDB, compiler, runtime. */
                                readonly setup: {
                                    readonly type: "string";
                                    readonly minLength: 1;
                                };
                                readonly action: {
                                    readonly type: "string";
                                    readonly minLength: 1;
                                };
                                /** The claim that turns execution into a verdict. Without it there is no PASS. */
                                readonly expects: {
                                    readonly type: "string";
                                    readonly minLength: 1;
                                };
                            };
                        }, {
                            readonly type: "object";
                            readonly additionalProperties: false;
                            readonly required: readonly ["kind", "question", "decision"];
                            readonly properties: {
                                readonly kind: {
                                    readonly const: "jev";
                                };
                                readonly question: {
                                    readonly type: "string";
                                    readonly minLength: 1;
                                };
                                /** Which typed decision JEV returns. Not a tag; a contract field. */
                                readonly decision: {
                                    readonly enum: readonly ["Noul", "Choice", "Score"];
                                };
                                /**
                                 * A judgement is a measurement, not a verdict. Declaring what counts turns
                                 * the number into PASS or FAIL. Without it the verdict stays INCONCLUSIVE:
                                 * real, recorded, visible, and unable to grant a lock.
                                 */
                                readonly accepts: {
                                    readonly type: "object";
                                    readonly additionalProperties: false;
                                    readonly required: readonly ["min"];
                                    readonly properties: {
                                        readonly min: {
                                            readonly type: "number";
                                            readonly minimum: 0;
                                            readonly maximum: 1;
                                        };
                                    };
                                };
                            };
                        }];
                    };
                    readonly verdict: {
                        readonly type: "object";
                        readonly additionalProperties: false;
                        readonly required: readonly ["kind", "outcome", "sentenceVersion"];
                        readonly properties: {
                            readonly kind: {
                                readonly enum: readonly ["executor", "jev"];
                            };
                            readonly outcome: {
                                readonly enum: readonly ["PASS", "FAIL", "INCONCLUSIVE"];
                            };
                            /** The decision JEV returned, before anything compared it to a threshold. */
                            readonly decision: {
                                readonly oneOf: readonly [{
                                    readonly type: "string";
                                }, {
                                    readonly type: "number";
                                }, {
                                    readonly type: "null";
                                }];
                            };
                            /** Recorded so a lock can be broken by the judge changing, not only the sentence. */
                            readonly judgeVersion: {
                                readonly type: readonly ["string", "null"];
                            };
                            /** Version of the sentence this verdict was produced against. */
                            readonly sentenceVersion: {
                                readonly type: "string";
                                readonly minLength: 1;
                            };
                        };
                    };
                };
            };
        };
    };
};
export type FileOutput = {
    kind: "file";
    path: string;
    language: string;
};
export type NodeOutput = {
    kind: "node";
    target: string;
};
export type Output = FileOutput | NodeOutput;
export type ExecutorProof = {
    kind: "executor";
    setup: string;
    action: string;
    expects: string;
};
export type JudgmentProof = {
    kind: "jev";
    question: string;
    decision: "Noul" | "Choice" | "Score";
    accepts?: {
        min: number;
    };
};
export type Proof = ExecutorProof | JudgmentProof;
export type Verdict = {
    kind: "executor" | "jev";
    outcome: "PASS" | "FAIL" | "INCONCLUSIVE";
    decision?: string | number | null;
    judgeVersion?: string | null;
    sentenceVersion: string;
};
export type Contract = {
    id: string;
    sentence: string;
    domain: string;
    output: Output;
    proof: Proof;
    verdict?: Verdict;
};
export type NaiveDINode = {
    id: string;
    text: string;
    tag: string;
};
export type NaiveDIRelation = {
    from: string;
    relation: string;
    to: string;
};
export type NaiveDIInput = {
    nodes: NaiveDINode[];
    relations: NaiveDIRelation[];
    contracts?: Contract[];
};
