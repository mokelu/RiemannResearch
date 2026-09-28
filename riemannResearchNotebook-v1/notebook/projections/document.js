/**
 * The Document projection: the structure read as a document.
 *
 * This is a projection, not an interpretation. It takes the sentences in the
 * order they are stored and concatenates their text and nothing else. It adds
 * no separators, spaces, or line breaks — any spacing lives inside the sentence
 * text itself. The tags and relations stay in the underlying structure for the
 * other views to use; they are never woven into the prose here.
 */

export function renderDocument(surface) {
  const nodes = surface.graph.nodes();
  if (nodes.length === 0) return "Nothing has been reasoned yet.";

  return nodes.map((node) => node.text).join("");
}
