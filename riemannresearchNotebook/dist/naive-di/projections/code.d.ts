/**
 * The Code projection: the canonical structure shown as itself.
 *
 * Zero interpretation. It prints the JSON exactly as the runtime holds it, and
 * then the same thing as the objects it was instantiated into, so a reader can
 * see that the data and the live structure say the same thing.
 */
import type { Surface } from "../render/surface.js";
export declare function renderCode(surface: Surface): string;
