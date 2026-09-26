/**
 * The validator: the non-AI checkpoint between AI output and the runtime.
 *
 * Ajv handles shape: types, required fields, closed objects, registered tags,
 * and the two proof kinds. What JSON Schema cannot express is cross-reference,
 * so those rules are written here by hand:
 *
 *   - node ids and contract ids are unique
 *   - every relation points at two nodes that exist
 *   - every contract points at a sentence that exists
 *   - a contract's output target, if internal, points at a node that exists
 *   - a verdict may only be the kind of proof the contract declares
 *
 * All of these are structural. Whether a relation *holds*, or whether an
 * implementation actually satisfies its sentence, is never asked here.
 */
import Ajv2020 from "ajv/dist/2020.js";
import { naiveDISchema } from "./schema.js";
const ajv = new Ajv2020({
    allErrors: true,
    strict: true,
});
const schemaCheck = ajv.compile(naiveDISchema);
/**
 * A stamp, not a property. Only `validateNaiveDI` can produce data carrying it,
 * so anything that demands a `ValidatedNaiveDI` is guaranteed by construction to
 * have passed the boundary check. It exists only in types; it vanishes at runtime.
 */
export const VALIDATED = Symbol("riemann.naive-di.validated");
function duplicates(ids) {
    const seen = new Set();
    const again = new Set();
    for (const id of ids) {
        if (seen.has(id))
            again.add(id);
        else
            seen.add(id);
    }
    return again;
}
export function validateNaiveDI(value) {
    if (!schemaCheck(value)) {
        return {
            valid: false,
            data: undefined,
            errors: (schemaCheck.errors ?? []).map((e) => `${e.instancePath || "/"} ${e.message ?? ""}`.trim()),
        };
    }
    const data = value;
    const ids = new Set(data.nodes.map((node) => node.id));
    const contracts = data.contracts ?? [];
    const errors = [
        ...[...duplicates(data.nodes.map((node) => node.id))].map((id) => `node id "${id}" appears more than once`),
        ...[...duplicates(contracts.map((contract) => contract.id))].map((id) => `contract id "${id}" appears more than once`),
        ...data.relations
            .filter((relation) => !ids.has(relation.from) || !ids.has(relation.to))
            .map((relation) => `relation ${relation.from} -[${relation.relation}]-> ${relation.to} points at a node that does not exist`),
    ];
    for (const contract of contracts) {
        if (!ids.has(contract.sentence)) {
            errors.push(`contract "${contract.id}" is bound to sentence "${contract.sentence}", which is not a node that exists`);
        }
        if (contract.output.kind === "node" && !ids.has(contract.output.target)) {
            errors.push(`contract "${contract.id}" produces internal node "${contract.output.target}", which does not exist`);
        }
        if (contract.verdict && contract.verdict.kind !== contract.proof.kind) {
            errors.push(`contract "${contract.id}" records a ${contract.verdict.kind} verdict but declares a ${contract.proof.kind} proof`);
        }
    }
    if (errors.length > 0) {
        return { valid: false, data: undefined, errors };
    }
    return { valid: true, data: data, errors: [] };
}
