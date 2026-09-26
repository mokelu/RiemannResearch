/**
 * The Cells projection: one editable cell per sentence.
 *
 * This is the interactive case, so it is the one that shows what the write path
 * is for. A cell never touches a node. It calls `ops`, which turns the intent
 * into a patch, which the surface validates before anything changes. If the edit
 * would make the structure illegal, the cells keep showing what they showed
 * before and the reason comes back instead.
 */
import { tagLabel } from "../render/wording.js";
export function renderCells(surface) {
    const graph = surface.graph;
    return graph
        .nodes()
        .map((node) => ({
        id: node.id,
        tag: node.tag,
        label: tagLabel(node.tag),
        text: node.text,
        leads: graph.outgoing(node.id).map((wire) => wire.to.id),
        follows: graph.incoming(node.id).map((wire) => wire.from.id),
    }));
}
export function cellOps(surface) {
    return {
        setText: (id, text) => surface.propose({ op: "setText", id, text }),
        setTag: (id, tag) => surface.propose({ op: "retag", id, tag }),
        connect: (from, relation, to) => surface.propose({ op: "connect", from, relation, to }),
        disconnect: (from, relation, to) => surface.propose({ op: "disconnect", from, relation, to }),
        addCell: (id, text, tag) => surface.propose({ op: "addNode", id, text, tag }),
        removeCell: (id) => surface.propose({ op: "removeNode", id }),
    };
}
