/**
 * A sentence's version, derived from its own words.
 *
 * Nothing stores a counter that someone has to remember to bump. The version is
 * whatever the text hashes to right now, so an edit to a sentence changes its
 * version whether or not anything noticed, and every proof attached to it can be
 * checked against it. This is the whole staleness mechanism, and it needs no
 * bookkeeping to work.
 *
 * Small and dependency-free on purpose: it is not cryptography, only a stable
 * fingerprint of text.
 */

export function sentenceVersion(text: string): string {
  let hash = 0x811c9dc5;

  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return (hash >>> 0).toString(16).padStart(8, "0");
}
