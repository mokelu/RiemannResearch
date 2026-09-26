/**
 * The Structure projection: the canonical object shown as itself.
 *
 * This is the view formerly mistaken for a "code view". It shows the structure,
 * not any implementation, so the word *code* is now free to mean the thing an
 * AI writes underneath a sentence.
 *
 * Zero interpretation: it prints the JSON exactly as the runtime holds it, then
 * the same thing as the objects it was instantiated into.
 */
import type { Surface } from "../render/surface.js";
export declare function renderStructure(surface: Surface): string;
