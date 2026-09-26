/**
 * The only way an interactive view may ask for a change.
 *
 * These operations are structural, never semantic: a patch can add a sentence,
 * rename its tag or wire two sentences together, but it cannot claim anything
 * is true. A patch is applied to plain data and the result goes back through
 * the same validator the AI's output faces, so an edit made by dragging a card
 * is held to exactly the standard as one made by a model.
 *
 * Nothing here mutates its input. A patch produces a new object or fails.
 */
/** Thrown when a patch names a node that is not in the structure. */
export class UnknownNodeError extends Error {
    constructor(id) {
        super(`no node with id "${id}" to edit`);
        this.name = "UnknownNodeError";
    }
}
export function applyPatch(input, patch) {
    const has = (id) => input.nodes.some((node) => node.id === id);
    switch (patch.op) {
        case "addNode":
            return {
                ...input,
                nodes: [
                    ...input.nodes,
                    { id: patch.id, text: patch.text, tag: patch.tag },
                ],
            };
        case "removeNode":
            // Wires touching the removed sentence go with it. Its contracts do not:
            // a sentence standing under contract cannot be deleted quietly, so the
            // boundary rejects the edit and says why.
            return {
                ...input,
                nodes: input.nodes.filter((node) => node.id !== patch.id),
                relations: input.relations.filter((relation) => relation.from !== patch.id && relation.to !== patch.id),
            };
        case "setText": {
            if (!has(patch.id))
                throw new UnknownNodeError(patch.id);
            return {
                ...input,
                nodes: input.nodes.map((node) => node.id === patch.id ? { ...node, text: patch.text } : node),
            };
        }
        case "retag": {
            if (!has(patch.id))
                throw new UnknownNodeError(patch.id);
            return {
                ...input,
                nodes: input.nodes.map((node) => node.id === patch.id ? { ...node, tag: patch.tag } : node),
            };
        }
        case "connect":
            return {
                ...input,
                relations: [
                    ...input.relations,
                    { from: patch.from, relation: patch.relation, to: patch.to },
                ],
            };
        case "disconnect":
            return {
                ...input,
                relations: input.relations.filter((relation) => !(relation.from === patch.from &&
                    relation.relation === patch.relation &&
                    relation.to === patch.to)),
            };
        case "bindContract":
            return {
                ...input,
                contracts: [
                    ...(input.contracts ?? []).filter((contract) => contract.id !== patch.contract.id),
                    patch.contract,
                ],
            };
        case "unbindContract":
            return withContracts(input, (input.contracts ?? []).filter((contract) => contract.id !== patch.id));
        case "setOutput":
            return withContracts(input, replaceContract(input, patch.id, (contract) => ({
                ...contract,
                output: patch.output,
            })));
        case "setProof":
            return withContracts(input, replaceContract(input, patch.id, (contract) => ({
                ...contract,
                proof: patch.proof,
                // A new proof makes any earlier verdict meaningless, so it goes with it.
                verdict: undefined,
            })));
        case "recordVerdict":
            return withContracts(input, replaceContract(input, patch.id, (contract) => ({
                ...contract,
                verdict: patch.verdict,
            })));
    }
}
function replaceContract(input, id, change) {
    const contracts = input.contracts ?? [];
    if (!contracts.some((contract) => contract.id === id)) {
        throw new UnknownContractError(id);
    }
    return contracts.map((contract) => contract.id === id ? change(contract) : contract);
}
function withContracts(input, contracts) {
    // Keys holding nothing are removed rather than left as undefined, so the
    // result stays exactly the shape the schema describes.
    const cleaned = contracts.map((contract) => {
        const copy = { ...contract };
        if (copy.verdict === undefined)
            delete copy.verdict;
        return copy;
    });
    if (cleaned.length === 0) {
        const { contracts: _dropped, ...rest } = input;
        return rest;
    }
    return { ...input, contracts: cleaned };
}
/** Thrown when a patch names a contract that is not in the structure. */
export class UnknownContractError extends Error {
    constructor(id) {
        super(`no contract with id "${id}" to edit`);
        this.name = "UnknownContractError";
    }
}
