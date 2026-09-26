/**
 * The controlled vocabulary of naive deterministic intelligence.
 *
 * These lists register *tags* only. A node must carry a tag from here, and the
 * AI cannot invent one. Relations are deliberately absent: the AI is free to
 * name the connection between two nodes, and the runtime checks only that the
 * relation exists and that both ends are real nodes. Deciding whether a given
 * relation actually holds is JEV's job, not the vocabulary's.
 *
 * A future normalisation step may fold `supports` and `SUPPORTS` together as a
 * mechanical convenience. That is not the same as a registry of permitted
 * relations, and this file must not become one.
 */
export declare const ATOMIC_TAGS: readonly ["ENTITY", "PROPERTY", "VALUE", "EVENT", "TIME", "STATE", "PLACE", "THING"];
export declare const OPERATOR_TAGS: readonly ["RELATION", "FUNCTION", "ACTION"];
export declare const SENTENCE_TAGS: readonly ["FACT", "OBSERVATION", "DEFINITION", "CHOICE", "STRATEGY", "GOAL", "CLAIM", "QUESTION", "OBJECTION", "CONSEQUENCE", "ASSUMPTION", "EVIDENCE", "INFERENCE", "HYPOTHESIS", "PREDICTION", "PREMISE", "CONCLUSION", "CONDITION", "EVENT", "CAUSE", "EFFECT", "ANSWER", "INSTRUCTION", "INTENT", "CONSTRAINT", "REQUIREMENT"];
export declare const GRAMMATICAL_TAGS: readonly ["PUNCTUATION", "COMMA", "PERIOD", "QUESTION_MARK", "EXCLAMATION_MARK", "COLON", "SEMICOLON", "PARENTHESIS", "BRACKET", "BRACE", "QUOTATION", "APOSTROPHE", "DASH", "HYPHEN", "ELLIPSIS", "SLASH"];
/** Tags a node may carry. Relations are not listed here on purpose. */
export declare const NODE_TAGS: readonly ["ENTITY", "PROPERTY", "VALUE", "EVENT", "TIME", "STATE", "PLACE", "THING", "RELATION", "FUNCTION", "ACTION", "FACT", "OBSERVATION", "DEFINITION", "CHOICE", "STRATEGY", "GOAL", "CLAIM", "QUESTION", "OBJECTION", "CONSEQUENCE", "ASSUMPTION", "EVIDENCE", "INFERENCE", "HYPOTHESIS", "PREDICTION", "PREMISE", "CONCLUSION", "CONDITION", "EVENT", "CAUSE", "EFFECT", "ANSWER", "INSTRUCTION", "INTENT", "CONSTRAINT", "REQUIREMENT", "PUNCTUATION", "COMMA", "PERIOD", "QUESTION_MARK", "EXCLAMATION_MARK", "COLON", "SEMICOLON", "PARENTHESIS", "BRACKET", "BRACE", "QUOTATION", "APOSTROPHE", "DASH", "HYPHEN", "ELLIPSIS", "SLASH"];
export type AtomicTag = (typeof ATOMIC_TAGS)[number];
export type OperatorTag = (typeof OPERATOR_TAGS)[number];
export type SentenceTag = (typeof SENTENCE_TAGS)[number];
export type GrammaticalTag = (typeof GRAMMATICAL_TAGS)[number];
export type NodeTag = (typeof NODE_TAGS)[number];
/**
 * A relation is any name the AI gives a wire. The alias exists to make that
 * readable at the point of use; it deliberately constrains nothing.
 */
export type RelationLabel = string;
