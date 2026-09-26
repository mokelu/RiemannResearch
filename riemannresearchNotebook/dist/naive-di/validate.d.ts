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
import { type NaiveDIInput } from "./schema.js";
/**
 * A stamp, not a property. Only `validateNaiveDI` can produce data carrying it,
 * so anything that demands a `ValidatedNaiveDI` is guaranteed by construction to
 * have passed the boundary check. It exists only in types; it vanishes at runtime.
 */
export declare const VALIDATED: unique symbol;
export type ValidatedNaiveDI = NaiveDIInput & {
    readonly [VALIDATED]: true;
};
export type ValidationResult = {
    valid: true;
    data: ValidatedNaiveDI;
    errors: never[];
} | {
    valid: false;
    data: undefined;
    errors: string[];
};
export declare function validateNaiveDI(value: unknown): ValidationResult;
