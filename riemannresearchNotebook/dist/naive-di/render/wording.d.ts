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
import type { NodeTag, RelationLabel } from "../vocabulary.js";
export declare const TAG_LABELS: Record<NodeTag, string>;
export declare function tagLabel(tag: NodeTag): string;
/** The AI's own relation, as a phrase. Unlisted relations pass through verbatim. */
export declare function relationPhrase(relation: RelationLabel): string;
