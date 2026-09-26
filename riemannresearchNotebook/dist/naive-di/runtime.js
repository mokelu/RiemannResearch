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
/** One sentence, with its registered tag. */
export class RuntimeNode {
    id;
    text;
    tag;
    constructor(id, text, tag) {
        this.id = id;
        this.text = text;
        this.tag = tag;
    }
    isTagged(...tags) {
        return tags.includes(this.tag);
    }
}
/**
 * A wire between two sentences. Holds the nodes themselves, not their ids.
 * `relation` is whatever the AI chose to call it; nothing here checks the name.
 */
export class RuntimeRelation {
    from;
    relation;
    to;
    constructor(from, relation, to) {
        this.from = from;
        this.relation = relation;
        this.to = to;
    }
    get id() {
        return `${this.from.id} -[${this.relation}]-> ${this.to.id}`;
    }
    /** The far end of the wire, seen from one side. */
    other(side) {
        if (side === this.from)
            return this.to;
        if (side === this.to)
            return this.from;
        throw new Error(`node ${side.id} is not part of ${this.id}`);
    }
}
/**
 * A contract: one sentence, plus the thing standing under it and whatever proof
 * was run. It is not a sentence kind and it is not a tag. It points at a
 * sentence node, which is what lets the sentence stay the thing a human edits.
 */
export class RuntimeContract {
    id;
    sentence;
    domain;
    output;
    proof;
    verdict;
    constructor(id, sentence, domain, output, proof, verdict) {
        this.id = id;
        this.sentence = sentence;
        this.domain = domain;
        this.output = output;
        this.proof = proof;
        this.verdict = verdict;
    }
    /** The words of the sentence this contract answers to. */
    get text() {
        return this.sentence.text;
    }
}
export class ReasoningGraph {
    #nodes;
    #relations;
    #contracts;
    #byId = new Map();
    #outgoing = new Map();
    #incoming = new Map();
    #contractId = new Map();
    /**
     * Indexes are always derived from the data handed in, so a graph can never
     * hold a wire that its own nodes do not support.
     */
    constructor(nodes, relations, contracts = []) {
        this.#nodes = Object.freeze([...nodes]);
        this.#relations = Object.freeze([...relations]);
        this.#contracts = Object.freeze([...contracts]);
        for (const node of this.#nodes) {
            if (this.#byId.has(node.id)) {
                throw new Error(`duplicate node id "${node.id}"`);
            }
            this.#byId.set(node.id, node);
            this.#outgoing.set(node.id, []);
            this.#incoming.set(node.id, []);
        }
        for (const relation of this.#relations) {
            if (!this.#byId.has(relation.from.id) || !this.#byId.has(relation.to.id)) {
                throw new Error(`relation ${relation.id} points outside the graph`);
            }
            this.#outgoing.get(relation.from.id).push(relation);
            this.#incoming.get(relation.to.id).push(relation);
        }
        for (const contract of this.#contracts) {
            if (!this.#byId.has(contract.sentence.id)) {
                throw new Error(`contract ${contract.id} points outside the graph`);
            }
            this.#contractId.set(contract.id, contract);
        }
    }
    get size() {
        return this.#nodes.length;
    }
    /** Every node, in the order the AI produced them. */
    nodes() {
        return this.#nodes;
    }
    /** Every wire, in the order the AI produced them. */
    relations() {
        return this.#relations;
    }
    /** Every contract standing under a sentence. */
    contracts() {
        return this.#contracts;
    }
    contract(id) {
        return this.#contractId.get(id);
    }
    node(id) {
        return this.#byId.get(id);
    }
    requireNode(id) {
        const found = this.#byId.get(id);
        if (!found)
            throw new Error(`no node with id "${id}"`);
        return found;
    }
    /** All nodes carrying one of the given tags — what a component would ask for. */
    nodesTagged(...tags) {
        return this.#nodes.filter((node) => node.isTagged(...tags));
    }
    /** Wires leaving a node. */
    outgoing(id) {
        return this.#outgoing.get(this.requireNode(id).id) ?? [];
    }
    /** Wires arriving at a node. */
    incoming(id) {
        return this.#incoming.get(this.requireNode(id).id) ?? [];
    }
    /** Nodes on the far side of wires leaving `id`, optionally filtered by relation. */
    next(id, ...relations) {
        return this.#traverse(id, "out", relations);
    }
    /** Nodes on the far side of wires arriving at `id`, optionally filtered. */
    previous(id, ...relations) {
        return this.#traverse(id, "in", relations);
    }
    /** Everything reachable by following wires forward. Safe on cycles. */
    closure(id, ...relations) {
        const start = this.requireNode(id);
        const found = [];
        const seen = new Set([start.id]);
        const queue = [...this.#matching(this.outgoing(start.id), relations)];
        while (queue.length > 0) {
            const relation = queue.shift();
            const nextNode = this.#farSide(relation, "out");
            if (seen.has(nextNode.id))
                continue;
            seen.add(nextNode.id);
            found.push(nextNode);
            queue.push(...this.#matching(this.outgoing(nextNode.id), relations));
        }
        return found;
    }
    /** Nodes with nothing pointing at them: where the reasoning starts. */
    roots() {
        return this.#nodes.filter((node) => this.incoming(node.id).length === 0);
    }
    /** Nodes with nothing pointing away from them: where it stops. */
    leaves() {
        return this.#nodes.filter((node) => this.outgoing(node.id).length === 0);
    }
    /** Plain data again, for storage or for sending back to the AI. */
    toJSON() {
        return {
            nodes: this.#nodes.map(({ id, text, tag }) => ({ id, text, tag })),
            relations: this.#relations.map(({ from, relation, to }) => ({
                from: from.id,
                relation,
                to: to.id,
            })),
            ...(this.#contracts.length > 0
                ? {
                    contracts: this.#contracts.map(({ id, sentence, domain, output, proof, verdict }) => ({
                        id,
                        sentence: sentence.id,
                        domain,
                        output,
                        proof,
                        ...(verdict ? { verdict } : {}),
                    })),
                }
                : {}),
        };
    }
    #matching(relations, filters) {
        if (filters.length === 0)
            return [...relations];
        return relations.filter((r) => filters.includes(r.relation));
    }
    /** The node the given wire points at, from the point of view of a direction. */
    #farSide(relation, direction) {
        return direction === "out" ? relation.to : relation.from;
    }
    #traverse(id, direction, filters) {
        const node = this.requireNode(id);
        const wires = direction === "out" ? this.outgoing(node.id) : this.incoming(node.id);
        return this.#matching(wires, filters).map((relation) => this.#farSide(relation, direction));
    }
}
/**
 * Turn validated data into a live graph. The `ValidatedNaiveDI` type is the
 * gate: unvalidated JSON will not compile here, so the boundary cannot be
 * skipped by accident.
 */
export function materialize(data) {
    const nodes = data.nodes.map((node) => new RuntimeNode(node.id, node.text, node.tag));
    const byId = new Map(nodes.map((node) => [node.id, node]));
    const relations = data.relations.map((relation) => new RuntimeRelation(byId.get(relation.from), relation.relation, byId.get(relation.to)));
    const contracts = (data.contracts ?? []).map((contract) => new RuntimeContract(contract.id, byId.get(contract.sentence), contract.domain, contract.output, contract.proof, contract.verdict));
    return new ReasoningGraph(nodes, relations, contracts);
}
