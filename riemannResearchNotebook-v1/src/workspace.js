/**
 * The workspace: a tree of folders and files, and nothing else.
 *
 * This is the left panel's model — the same shape `leftpanel_v4.html` works
 * with, but as pure functions so the panel can be a thin view over them.
 * Every operation takes a root and returns a *new* root; the caller decides
 * when to store it. Nothing here touches the browser, and nothing here knows
 * what a reasoning structure is: a file carries `structure` as opaque data,
 * the same way the panel carried names.
 */

import { SEEDS } from "./seed.js";

/** What a brand-new file holds: an empty document that the boundary accepts. */
export function emptyStructure() {
  return { blocks: [], nodes: [], relations: [] };
}

let seq = 0;

/** An id that stays unique across sessions, so stored trees never collide. */
export function nextId() {
  seq += 1;
  return `n${Date.now().toString(36)}${seq.toString(36)}`;
}

/* ------------------------------------------------------------------ reads */

export function findNode(root, id, node = root) {
  if (node.id === id) return node;
  if (node.children) {
    for (const child of node.children) {
      const found = findNode(root, id, child);
      if (found) return found;
    }
  }
  return null;
}

export function findParent(root, id, node = root) {
  if (!node.children) return null;
  for (const child of node.children) {
    if (child.id === id) return node;
    const found = findParent(root, id, child);
    if (found) return found;
  }
  return null;
}

/** root … node, inclusive — what "copy path" prints. */
export function pathOf(root, id, node = root, acc = []) {
  const next = [...acc, node];
  if (node.id === id) return next;
  if (node.children) {
    for (const child of node.children) {
      const found = pathOf(root, id, child, next);
      if (found) return found;
    }
  }
  return null;
}

/** Is `id` somewhere inside `ancestorId`? (A folder may not move into itself.) */
export function isDescendant(root, id, ancestorId) {
  const path = pathOf(root, id);
  return !!path && path.slice(0, -1).some((node) => node.id === ancestorId);
}

/** The file a fresh session should open: the first one in reading order. */
export function firstFileId(root) {
  if (root.type === "file") return root.id;
  for (const child of root.children ?? []) {
    const found = firstFileId(child);
    if (found) return found;
  }
  return null;
}

/** Files and folders, root not counted — the panel's footer line. */
export function countWorkspace(root) {
  let files = 0;
  let folders = 0;
  (function walk(node) {
    if (node.id !== root.id) {
      if (node.type === "folder") folders += 1;
      else files += 1;
    }
    node.children?.forEach(walk);
  })(root);
  return { files, folders };
}

/* ----------------------------------------------------------------- writes */

/**
 * Insert a new node. A non-folder parent is not a place a child can go, so
 * the node lands at the root instead of vanishing — same as the mockup.
 */
export function createNode(root, parentId, type, id, name = "") {
  const next = structuredClone(root);
  let parent = parentId ? findNode(next, parentId) : next;
  if (!parent || parent.type !== "folder") parent = next;

  const node = { id, type, name };
  if (type === "folder") node.children = [];

  parent.children ??= [];
  parent.children.unshift(node);
  return next;
}

export function renameNode(root, id, name) {
  const clean = (name ?? "").trim();
  if (!clean) return root;

  const next = structuredClone(root);
  const node = findNode(next, id);
  if (!node || node.id === next.id) return next;
  node.name = clean;
  return next;
}

/** Removes a node and everything under it. The root itself never goes. */
export function removeNode(root, id) {
  if (id === root.id) return root;

  const next = structuredClone(root);
  const parent = findParent(next, id);
  if (!parent) return next;
  parent.children = parent.children.filter((child) => child.id !== id);
  return next;
}

/** Files only. The copy lands directly after the original, as in the mockup. */
export function duplicateFile(root, id, newId) {
  const next = structuredClone(root);
  const node = findNode(next, id);
  const parent = findParent(next, id);
  if (!node || node.type !== "file" || !parent) return next;

  const copy = {
    ...structuredClone(node),
    id: newId,
    name: node.name.replace(/(\.[^.]+)?$/, (m) => ` copy${m || ""}`),
  };
  parent.children.splice(parent.children.indexOf(node) + 1, 0, copy);
  return next;
}

/** Refuses anything that would make the tree lie: cycles, files as targets. */
export function moveNode(root, sourceId, targetId) {
  if (sourceId === targetId) return root;

  const next = structuredClone(root);
  const source = findNode(next, sourceId);
  const target = findNode(next, targetId);
  if (!source || !target || target.type !== "folder") return next;
  if (isDescendant(next, targetId, sourceId)) return next;

  const parent = findParent(next, sourceId);
  if (!parent || parent.id === targetId) return next;

  parent.children.splice(parent.children.indexOf(source), 1);
  target.children ??= [];
  target.children.unshift(source);
  return next;
}

/** Writes a file's contents. Anything that is not a file leaves the tree alone. */
export function setFileStructure(root, id, structure) {
  const next = structuredClone(root);
  const node = findNode(next, id);
  if (!node || node.type !== "file") return next;
  node.structure = structuredClone(structure);
  return next;
}

/* ------------------------------------------------------------------- seed */

/**
 * The workspace a first-time visitor gets: an example that already shows a
 * finished result, an empty file to work in, and — when the browser holds a
 * structure saved before workspaces existed — that work restored as the
 * first file, so nobody's research is lost to this upgrade.
 */
export function seedWorkspace(restoredStructure) {
  const example = {
    id: "file-example",
    type: "file",
    name: "Example — morning coffee",
    structure: structuredClone(SEEDS.Reasoning),
  };
  const fresh = {
    id: "file-untitled",
    type: "file",
    name: "Untitled research",
    structure: restoredStructure
      ? structuredClone(restoredStructure)
      : emptyStructure(),
  };

  const children = restoredStructure ? [fresh, example] : [example, fresh];
  return { id: "root", type: "folder", name: "Workspace", children };
}
