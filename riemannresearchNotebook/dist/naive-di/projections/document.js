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
import { relationPhrase, tagLabel } from "../render/wording.js";
function capitalise(phrase) {
    return phrase.charAt(0).toUpperCase() + phrase.slice(1);
}
/** Group every sentence into reading threads, one thread per starting point. */
export function threadsOf(surface) {
    const graph = surface.graph;
    const emitted = new Set();
    const threads = [];
    const startThread = (start) => {
        const entries = [];
        const queue = [{ node: start }];
        while (queue.length > 0) {
            const entry = queue.shift();
            if (emitted.has(entry.node.id))
                continue;
            emitted.add(entry.node.id);
            entries.push(entry);
            for (const wire of graph.outgoing(entry.node.id)) {
                if (emitted.has(wire.to.id))
                    continue;
                queue.push({ node: wire.to, phrase: relationPhrase(wire.relation) });
            }
        }
        return entries;
    };
    for (const root of graph.roots()) {
        if (emitted.has(root.id))
            continue;
        threads.push(startThread(root));
    }
    // Anything left has no beginning: a cycle, or a sentence with no wires.
    for (const node of graph.nodes()) {
        if (emitted.has(node.id))
            continue;
        emitted.add(node.id);
        threads.push([{ node }]);
    }
    return threads;
}
export function renderDocument(surface) {
    const threads = threadsOf(surface);
    if (threads.length === 0)
        return "Nothing has been reasoned yet.";
    return threads
        .map((entries) => entries
        .map((entry) => entry.phrase
        ? `${capitalise(entry.phrase)}: ${entry.node.text}`
        : `${tagLabel(entry.node.tag)}: ${entry.node.text}`)
        .join("\n"))
        .join("\n\n");
}
