/**
 * The Document projection: the structure read as a document.
 *
 * This is a projection, not an interpretation. It maps the AI's `blocks` onto
 * described elements and adds nothing else: no separators, spaces, or line
 * breaks of its own invention — every gap comes from a text run the AI wrote,
 * because runs land in reading order and order is a property of data. Tags are
 * never printed here; a reasoning sentence rides the page as its text inside
 * a span that carries the tag as metadata, so the other views can still find
 * it by id without the document ever saying "ASSUMPTION:".
 */

const MARK_ELEMENT = { strong: "strong", em: "em", code: "code", link: "a" };

function applyMarks(marks, href, inner) {
  let out = inner;
  for (const mark of marks ?? []) {
    if (mark === "link" && href) out = { tag: "a", props: { href }, children: [out] };
    else out = { tag: MARK_ELEMENT[mark], children: [out] };
  }
  return out;
}

function renderRun(run, graph, key) {
  if (run.kind === "node") {
    const node = graph.node(run.ref);
    return {
      tag: "span",
      props: {
        "data-riemann-tag": node.tag,
        "data-node-id": node.id,
        className: "riemann-sentence",
      },
      children: [node.text],
      key,
    };
  }
  // A plain text run is just a string; only a marked run becomes an element.
  if (!run.marks || run.marks.length === 0) return run.text;
  const content = applyMarks(run.marks, run.href, run.text);
  content.key ??= key;
  return content;
}

function renderRuns(runs, graph, keyBase) {
  return runs.map((run, i) => renderRun(run, graph, `${keyBase}.r${i}`));
}

function renderBlock(block, graph, key) {
  switch (block.type) {
    case "heading":
      return {
        tag: `h${block.level ?? 1}`,
        children: renderRuns(block.runs, graph, key),
        key,
      };
    case "paragraph":
      return { tag: "p", children: renderRuns(block.runs, graph, key), key };
    case "quote":
      return {
        tag: "blockquote",
        children: renderRuns(block.runs, graph, key),
        key,
      };
    case "list":
      return {
        tag: block.ordered ? "ol" : "ul",
        children: block.items.map((item, i) => ({
          tag: "li",
          children: renderRuns(item.runs, graph, `${key}.${i}`),
          key: `${key}.${i}`,
        })),
        key,
      };
    case "code":
      return {
        tag: "pre",
        children: [{ tag: "code", children: [block.text], key: `${key}.c` }],
        key,
      };
  }
}

/** The document as described elements — what a UI mounts, nothing more. */
export function renderDocumentTree(surface) {
  return surface.graph
    .blocks()
    .map((block, i) => renderBlock(block, surface.graph, `b${i}`));
}

/** The same tree as indented text, for anywhere there is no DOM. */
export function renderDocumentText(surface) {
  const flatten = (node) => {
    if (typeof node === "string") return node;
    const inner = (node.children ?? []).map(flatten).join("");
    switch (node.tag) {
      case "h1":
      case "h2":
      case "h3":
      case "h4":
      case "h5":
      case "h6":
        return `\n${"#".repeat(Number(node.tag[1]))} ${inner}\n`;
      case "blockquote":
        return `\n│ ${inner}\n`;
      case "li":
        return `• ${inner}\n`;
      case "pre":
        return `\n${inner}\n`;
      case "ul":
      case "ol":
        return `\n${inner}`;
      default:
        return inner;
    }
  };

  const written = renderDocumentTree(surface)
    .map(flatten)
    .map((block) => block.replace(/^\n+/, "").replace(/\s+$/, ""))
    .filter((block) => block !== "")
    .join("\n");

  return written || "Nothing has been reasoned yet.";
}
