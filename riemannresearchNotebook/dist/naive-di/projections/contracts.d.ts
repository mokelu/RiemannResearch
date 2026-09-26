/**
 * The Contracts projection: which sentences have something standing under them,
 * and whether what is standing there still satisfies them.
 *
 * This is where the two authorities are kept visibly apart. A lock earned by an
 * executor and a lock earned by JEV are both shown, labelled, and never allowed
 * to resemble each other. A sentence that has been measured but not decided is
 * displayed as exactly that, rather than rounded up into a pass.
 */
import type { Surface } from "../render/surface.js";
import type { LockState } from "../contract/lock.js";
export type ContractView = {
    id: string;
    domain: string;
    sentenceId: string;
    sentenceTag: string;
    text: string;
    version: string;
    makes: string;
    provedBy: string;
    verdict: string;
    lock: LockState;
};
export declare function contractViews(surface: Surface, options?: {
    judgeVersion?: string;
}): ContractView[];
export declare function renderContracts(surface: Surface, options?: {
    judgeVersion?: string;
}): string;
