/**
 * The Document projection: the structure read as prose.
 *
 * Order is this projection's business, not the structure's. It walks outward
 * from the sentences nothing points at, so a chain reads from its starting
 * point rather than in whatever order the AI happened to emit it. Sentences
 * unreachable that way — loose ends and circular chains — are listed after the
 * threads so that nothing is ever quietly dropped.
 *
 * The connective words come from the wording table, and an unlisted relation is
 * printed as the AI named it. Whether the chain is a *good* chain is JEV's
 * question, not this one.
 */
import type { Surface } from "../render/surface.js";
import type { RuntimeNode } from "../runtime.js";
type Entry = {
    node: RuntimeNode;
    phrase?: string;
};
/** Group every sentence into reading threads, one thread per starting point. */
export declare function threadsOf(surface: Surface): Entry[][];
export declare function renderDocument(surface: Surface): string;
export {};
