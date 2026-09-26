/**
 * The naive DI runtime: valid data becomes a live, queryable structure.
 *
 * Nothing here invents anything. The AI's JSON has already been through the
 * boundary check, so every tag is registered, every id is unique, and every
 * edge points at a real node. What the edge is *called* is the AI's business,
 * and stays unexamined here. This file's only job is to turn that flat text
 * into objects wired to each other, and to answer questions about the result.
 *
 * Reasoning about *meaning* still lives nowhere. That is JEV's job.
 */
import type { NodeTag, RelationLabel } from "./vocabulary.js";
import type { Contract, NaiveDIInput } from "./schema.js";
import type { ValidatedNaiveDI } from "./validate.js";
/** One sentence, with its registered tag. */
export declare class RuntimeNode {
    readonly id: string;
    readonly text: string;
    readonly tag: NodeTag;
    constructor(id: string, text: string, tag: NodeTag);
    isTagged(...tags: NodeTag[]): boolean;
}
/**
 * A wire between two sentences. Holds the nodes themselves, not their ids.
 * `relation` is whatever the AI chose to call it; nothing here checks the name.
 */
export declare class RuntimeRelation {
    readonly from: RuntimeNode;
    readonly relation: RelationLabel;
    readonly to: RuntimeNode;
    constructor(from: RuntimeNode, relation: RelationLabel, to: RuntimeNode);
    get id(): string;
    /** The far end of the wire, seen from one side. */
    other(side: RuntimeNode): RuntimeNode;
}
/**
 * A contract: one sentence, plus the thing standing under it and whatever proof
 * was run. It is not a sentence kind and it is not a tag. It points at a
 * sentence node, which is what lets the sentence stay the thing a human edits.
 */
export declare class RuntimeContract {
    readonly id: string;
    readonly sentence: RuntimeNode;
    readonly domain: string;
    readonly output: Contract["output"];
    readonly proof: Contract["proof"];
    readonly verdict?: Contract["verdict"];
    constructor(id: string, sentence: RuntimeNode, domain: string, output: Contract["output"], proof: Contract["proof"], verdict?: Contract["verdict"]);
    /** The words of the sentence this contract answers to. */
    get text(): string;
}
export declare class ReasoningGraph {
    #private;
    /**
     * Indexes are always derived from the data handed in, so a graph can never
     * hold a wire that its own nodes do not support.
     */
    constructor(nodes: RuntimeNode[], relations: RuntimeRelation[], contracts?: RuntimeContract[]);
    get size(): number;
    /** Every node, in the order the AI produced them. */
    nodes(): readonly RuntimeNode[];
    /** Every wire, in the order the AI produced them. */
    relations(): readonly RuntimeRelation[];
    /** Every contract standing under a sentence. */
    contracts(): readonly RuntimeContract[];
    contract(id: string): RuntimeContract | undefined;
    node(id: string): RuntimeNode | undefined;
    requireNode(id: string): RuntimeNode;
    /** All nodes carrying one of the given tags — what a component would ask for. */
    nodesTagged(...tags: NodeTag[]): readonly RuntimeNode[];
    /** Wires leaving a node. */
    outgoing(id: string): readonly RuntimeRelation[];
    /** Wires arriving at a node. */
    incoming(id: string): readonly RuntimeRelation[];
    /** Nodes on the far side of wires leaving `id`, optionally filtered by relation. */
    next(id: string, ...relations: RelationLabel[]): readonly RuntimeNode[];
    /** Nodes on the far side of wires arriving at `id`, optionally filtered. */
    previous(id: string, ...relations: RelationLabel[]): readonly RuntimeNode[];
    /** Everything reachable by following wires forward. Safe on cycles. */
    closure(id: string, ...relations: RelationLabel[]): readonly RuntimeNode[];
    /** Nodes with nothing pointing at them: where the reasoning starts. */
    roots(): readonly RuntimeNode[];
    /** Nodes with nothing pointing away from them: where it stops. */
    leaves(): readonly RuntimeNode[];
    /** Plain data again, for storage or for sending back to the AI. */
    toJSON(): NaiveDIInput;
}
/**
 * Turn validated data into a live graph. The `ValidatedNaiveDI` type is the
 * gate: unvalidated JSON will not compile here, so the boundary cannot be
 * skipped by accident.
 */
export declare function materialize(data: ValidatedNaiveDI): ReasoningGraph;
