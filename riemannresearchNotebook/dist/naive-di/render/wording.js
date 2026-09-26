/**
 * Presentation wording: declared data, never logic.
 *
 * The tag map is total by construction — TypeScript forces an entry for every
 * registered tag, so adding a tag to the vocabulary breaks the build until it
 * is given a human name here.
 *
 * The relation map is deliberately partial. Relations are the AI's own words,
 * so an unlisted relation is shown exactly as the AI wrote it. Nothing here
 * decides whether a relation is legitimate or what it proves.
 */
export const TAG_LABELS = {
    // Atomic
    ENTITY: "Entity",
    PROPERTY: "Property",
    VALUE: "Value",
    EVENT: "Event",
    TIME: "Time",
    STATE: "State",
    PLACE: "Place",
    THING: "Thing",
    // Operator
    RELATION: "Relation",
    FUNCTION: "Function",
    ACTION: "Action",
    // Sentence
    FACT: "Fact",
    OBSERVATION: "Observation",
    DEFINITION: "Definition",
    CHOICE: "Choice",
    STRATEGY: "Strategy",
    GOAL: "Goal",
    CLAIM: "Claim",
    QUESTION: "Question",
    OBJECTION: "Objection",
    CONSEQUENCE: "Consequence",
    ASSUMPTION: "Assumption",
    EVIDENCE: "Evidence",
    INFERENCE: "Inference",
    HYPOTHESIS: "Hypothesis",
    PREDICTION: "Prediction",
    PREMISE: "Premise",
    CONCLUSION: "Conclusion",
    CONDITION: "Condition",
    CAUSE: "Cause",
    EFFECT: "Effect",
    ANSWER: "Answer",
    INSTRUCTION: "Instruction",
    INTENT: "Intent",
    CONSTRAINT: "Constraint",
    REQUIREMENT: "Requirement",
    // Grammatical. Rarely used as a heading, but still named rather than
    // silently falling back to the raw identifier.
    PUNCTUATION: "Punctuation",
    COMMA: "Comma",
    PERIOD: "Period",
    QUESTION_MARK: "Question mark",
    EXCLAMATION_MARK: "Exclamation mark",
    COLON: "Colon",
    SEMICOLON: "Semicolon",
    PARENTHESIS: "Parenthesis",
    BRACKET: "Bracket",
    BRACE: "Brace",
    QUOTATION: "Quotation",
    APOSTROPHE: "Apostrophe",
    DASH: "Dash",
    HYPHEN: "Hyphen",
    ELLIPSIS: "Ellipsis",
    SLASH: "Slash",
};
export function tagLabel(tag) {
    return TAG_LABELS[tag];
}
/**
 * How a relation reads when it joins two sentences. Keys are matched in a
 * normalised form purely so that `Implies` and `implies` share one piece of
 * copy. This is a wording lookup, not a list of permitted relations.
 */
const RELATION_PHRASES = {
    implies: "therefore",
    implies_that: "therefore",
    supports: "and this is supported by",
    contradicts: "but this contradicts",
    depends_on: "which depends on",
    derives: "which derives from",
    because: "because",
    causes: "so this causes",
    is: "which is",
};
function normalise(relation) {
    return relation.trim().toLowerCase().replace(/\s+/g, "_");
}
/** The AI's own relation, as a phrase. Unlisted relations pass through verbatim. */
export function relationPhrase(relation) {
    return RELATION_PHRASES[normalise(relation)] ?? relation;
}
