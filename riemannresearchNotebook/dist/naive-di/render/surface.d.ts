/**
 * The surface: the only handle a projection is given.
 *
 * It owns the canonical live structure. A projection may read it and may
 * subscribe to change, and an interactive projection may propose an edit — but
 * nothing may reach in and alter a node. That is what keeps the structure, and
 * not the UI, the source of truth.
 *
 * A proposal is applied to plain data and re-validated. If validation fails,
 * the structure is left exactly as it was and the errors come back to the
 * view. There is no way to put the surface into an invalid state.
 */
import { type ReasoningGraph } from "../runtime.js";
import type { NaiveDIInput } from "../schema.js";
import { type Patch } from "./patch.js";
export type ProposalResult = {
    applied: true;
} | {
    applied: false;
    errors: string[];
};
export type Listener = (graph: ReasoningGraph) => void;
export declare class Surface {
    #private;
    private constructor();
    /** Open a surface on AI output, throwing if it is not structurally valid. */
    static open(value: unknown): Surface;
    static empty(): Surface;
    /** The live structure. Read-only by construction: no setters are exposed. */
    get graph(): ReasoningGraph;
    get size(): number;
    /** Plain data again — the canonical JSON, unchanged by any projection. */
    toJSON(): NaiveDIInput;
    /** Be told whenever the structure changes. Returns a way to stop listening. */
    subscribe(listener: Listener): () => void;
    /** Ask for a structural change. The only write path that exists. */
    propose(patch: Patch): ProposalResult;
}
