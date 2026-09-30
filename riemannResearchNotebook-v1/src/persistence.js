/**
 * The workspace's memory in the browser.
 *
 * What is stored is the whole tree — folders, file names, and each file's
 * structure as the canonical JSON the surface already emits. Nothing is added
 * on the way out; on the way back in, the tree must still look like a tree or
 * it is treated as absent, and each file's structure meets the boundary again
 * the moment the file is opened.
 *
 * A structure saved before workspaces existed (the old single-structure key)
 * is restored, not discarded: it comes back as the first file of a seeded
 * workspace, so an upgrade never costs somebody their research.
 *
 * Storage failures go to the console, never to the user's screen. A full or
 * blocked storage must not take the session down — the work is still there.
 */

import { seedWorkspace } from "./workspace.js";
import { validateReasoning } from "../notebook/validate.js";

const WORKSPACE_KEY = "riemann-notebook.workspace";
const LEGACY_KEY = "riemann-notebook.structure";

function isNode(node) {
  if (!node || typeof node !== "object") return false;
  if (typeof node.id !== "string" || typeof node.name !== "string") {
    return false;
  }
  if (node.type === "file") {
    return (
      node.structure === undefined ||
      (typeof node.structure === "object" && node.structure !== null)
    );
  }
  if (node.type === "folder") {
    return Array.isArray(node.children) && node.children.every(isNode);
  }
  return false;
}

/** Does this parsed value still describe a workspace, or just JSON? */
export function isWorkspace(root) {
  return isNode(root) && root.type === "folder";
}

/** The stored workspace, a migrated pre-workspace structure, or null. */
export function loadWorkspace() {
  try {
    const raw = globalThis.localStorage.getItem(WORKSPACE_KEY);
    if (raw) {
      const root = JSON.parse(raw);
      if (isWorkspace(root)) return root;
    }

    // Pre-workspace sessions saved one structure under one key. Bring it
    // back only if it still passes the boundary — half-true work is not
    // restored as if it were whole.
    const legacy = globalThis.localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const structure = JSON.parse(legacy);
      const result = validateReasoning(structure);
      if (result.valid) return seedWorkspace(structure);
    }

    return null;
  } catch {
    return null;
  }
}

/** Write the whole workspace back. Never throws. */
export function saveWorkspace(root) {
  try {
    globalThis.localStorage.setItem(WORKSPACE_KEY, JSON.stringify(root));
  } catch (error) {
    console.error("notebook: could not save to browser storage", error);
  }
}
