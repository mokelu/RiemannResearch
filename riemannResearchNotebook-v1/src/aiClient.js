/**
 * The browser's only handle on the model.
 *
 * It talks to a same-origin route (`/api/riemann`), never to the model provider
 * directly — the secret lives on the server, not in this file. What comes back
 * is the model's raw text answer, handed over untouched. Deciding whether that
 * text is valid Riemann JSON is the boundary's job, not ours; we do not tidy,
 * strip, or repair it here.
 */

import { RIEMANN_SYSTEM_PROMPT } from "../notebook/contract/prompt.js";

/** Ask the model, in Riemann's voice, and return its raw text reply. */
export async function askRiemann(userText) {
  const response = await fetch("/api/riemann", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ prompt: userText, system: RIEMANN_SYSTEM_PROMPT }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`model call failed (${response.status}): ${detail}`.trim());
  }

  const data = await response.json();
  return data.text;
}
