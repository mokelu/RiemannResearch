/*
 * These lists register *tags* only. A node must carry a tag from here, and the
 * AI cannot invent one. Relations are deliberately absent: the AI is free to
 * name the connection between two nodes, and the runtime checks only that the
 * relation exists and that both ends are real nodes. Deciding whether a given
 * relation actually holds is JEV's/Laya's job, not the vocabulary's.
 */

export const ATOMIC_TAGS = [
  "ENTITY",
  "PROPERTY",
  "VALUE",
  "EVENT",
  "TIME",
  "STATE",
  "PLACE",
  "THING",
];

export const OPERATOR_TAGS = ["RELATION", "FUNCTION", "ACTION"];

export const SENTENCE_TAGS = [
  "FACT",
  "OBSERVATION",
  "DEFINITION",
  "CHOICE",
  "STRATEGY",
  "GOAL",
  "CLAIM",
  "QUESTION",
  "OBJECTION",
  "CONSEQUENCE",
  "ASSUMPTION",
  "EVIDENCE",
  "INFERENCE",
  "HYPOTHESIS",
  "PREDICTION",
  "PREMISE",
  "CONCLUSION",
  "CONDITION",
  "EVENT",
  "CAUSE",
  "EFFECT",
  "ANSWER",
  "INSTRUCTION",
  "INTENT",
  "CONSTRAINT",
  "REQUIREMENT",
];

export const GRAMMATICAL_TAGS = [
  "PUNCTUATION",
  "COMMA",
  "PERIOD",
  "QUESTION_MARK",
  "EXCLAMATION_MARK",
  "COLON",
  "SEMICOLON",
  "PARENTHESIS",
  "BRACKET",
  "BRACE",
  "QUOTATION",
  "APOSTROPHE",
  "DASH",
  "HYPHEN",
  "ELLIPSIS",
  "SLASH",
];

export const NODE_TAGS = [
  ...ATOMIC_TAGS,
  ...OPERATOR_TAGS,
  ...SENTENCE_TAGS,
  ...GRAMMATICAL_TAGS,
];

/**
 * A relation is any name the AI gives a wire — in other words, any string.
 * It exists to make the connection readable at the point of use, and it
 * deliberately constrains nothing.
 */
