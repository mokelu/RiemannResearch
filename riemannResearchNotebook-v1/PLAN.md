# Riemann Notebook — Vision, Gap, Plan

This document restates the vision, admits exactly where the current code misses
it, and lays out the plan for the **first real Riemann Research Space**. That
Space is defined by one thing: a real AI response, returned as validated Riemann
JSON, becomes the structure of the Space and is rendered by the center. The
center is not a separate demo that later gets wired to an AI — the JSON entering
from the AI *is* the Space.

---

## 0. The `notebook/` file tree (as it exists today)

```text
notebook/
├── contract/                 ← empty folder (the prompt contract goes here)
├── projections/
│   ├── cells.js              ← renders the structure as a cell grid
│   ├── document.js           ← renders the structure as prose  ⚠ the bug lives here
│   ├── graph.js              ← renders nodes + wires for a canvas
│   ├── index.js              ← re-exports every projection
│   ├── structure.js          ← renders the raw JSON read-back
│   └── table.js              ← renders rows/columns
├── render/
│   ├── index.js              ← re-exports wording, patch, surface
│   ├── patch.js              ← the ONLY write path (addNode/retag/connect/…)
│   ├── surface.js            ← Surface: owns the live validated structure
│   └── wording.js            ← tag→label + relation→phrase tables
├── demo.js                   ← node-side script that prints projections
├── index.js                  ← public barrel of the whole module
├── runtime.js                ← ReasoningGraph / RuntimeNode / materialize()
├── runtime.test.js           ← vitest for the runtime
├── schema.js                 ← JSON Schema for AI output (nodes + relations)
├── validate.js               ← Ajv + hand-written cross-reference checks
├── validate.test.js          ← vitest for the validator
└── vocabulary.js             ← the registered NODE_TAGS (AI may not invent one)
```

Supporting files outside `notebook/` that matter to this plan:

```text
src/
├── App.jsx                   ← builds the Surface from SEEDS; lays out the panels
├── ChatPanel.jsx             ← the chat dock — SIMULATED, no network call
├── seed.js                   ← SEEDS.Reasoning — TEMPORARY scaffolding, not the Space
├── CellsView.jsx
├── main.jsx
└── styles.css
```

---

## 1. This is what I think the vision is

There is **one real artifact** in this system: a JSON structure of `nodes`
(tagged sentences) and `relations` (named connections between them).

```text
user talks to AI
  → AI is given a system prompt (the Riemann contract)
  → the prompt makes the AI return the Riemann JSON structure, nothing else
  → AI returns that JSON
  → Riemann validates it at the boundary
  → that JSON becomes the underlying structure of the Space
  → the center renders that structure
```

The rules that follow from this:

1. **The JSON is the Space.** The center is a viewer of the JSON, not a separate
   thing with its own content.
2. **The prompt is a contract, not a wish.** It demands pure Riemann JSON and
   forbids prose, markdown, or commentary.
3. **The validation boundary is real.** Anything that is not exactly the
   contract — prose, markdown, malformed JSON, an unknown tag, a relation that
   points at a node that does not exist — **fails visibly**. The system never
   quietly cleans up a model response and pretends the contract was met.
4. **Tags and relations are metadata.** They live in the JSON and power the
   Graph/Table/overlay projections. They are **not printed** into the document.
5. **Document view reads like a real document** — the natural, flowing prose the
   AI would have written — because the sentence texts, read in order, already
   are that prose.

---

## 2. This is where the current code does not meet it

### 2.1 The current Space does not implement the idea at all
There are two disconnected demos sitting side by side: `ChatPanel.jsx` produces
fake conversational text (`fakeAssistantReply`, no network), and the center
renders a hardcoded `SEED` chosen from a `<select>`. No AI response ever becomes
the structure. So today's Space is not a Riemann Space — it is a picture of one.

### 2.2 `SEEDS` is temporary scaffolding and must stop being the source of truth
`src/App.jsx` (line 22) builds the Surface from `SEEDS[seedName]`. The first
real Space replaces this: the Surface comes from a validated AI JSON, not from a
menu of hardcoded examples. `SEEDS` may survive only as an optional
empty-state/sample, never as what the Space *is*.

### 2.3 The Document projection is not a projection — it is an interpretation
`notebook/projections/document.js` commits two violations:

- **It injects labels into the text.** Lines 68–72 print
  `` `${tagLabel(entry.node.tag)}: ${entry.node.text}` `` and
  `` `${capitalise(entry.phrase)}: ${entry.node.text}` ``, producing the debug
  lines `ASSUMPTION: John is a dog.` / `Therefore: …`. This is the exact failure
  the vision forbids: tags and relation words must not appear in the document.
- **It manufactures reading order from the graph.** `threadsOf()` walks
  `graph.roots()` and follows wires, when `runtime.js` already keeps the AI's
  order (`nodes()` returns them in production order). Document should use the
  stored order directly, not a graph traversal.

### 2.4 The AI → JSON pipeline does not exist
- **No system prompt exists** in any code path. `TheFullIdea/*` are design docs;
  `schema.js` describes the shape but nothing hands it to a model.
- **No real model call exists** — `ChatPanel.jsx` says "no network calls."
- **No code path connects a response to the Surface** (`Surface.open` /
  `Surface.propose` is never called with AI output).

### 2.5 Validation failure is invisible to the user
`validate.js` returns clear errors and `Surface.open()` throws with them, but
nothing shows "the model wrote something invalid, here is why" back to the user.
When the real pipeline exists, this must surface in the chat — the boundary must
not fail silently, and must not be papered over by stripping markdown/fences.

---

## 3. The plan — one milestone, nothing else

Prove exactly this loop, end to end, and stop there:

```text
AI  →  valid { nodes, relations }  →  validated  →  becomes the Space  →  renders as a real document
```

Deliberately **out of scope for this first implementation**: artifact ids,
provenance (prompt version / model / run / timestamp), scores, confidence,
judgment envelopes, investigation-specific metadata. Add those only after the
loop above genuinely works.

### Step 1 — Create the real AI prompt/contract
- Fill the empty `notebook/contract/` folder:
  - `contract/prompt.js` exports the system prompt string. It embeds the
    registered `NODE_TAGS` (from `vocabulary.js`) and the exact JSON shape
    derived from `schema.js`, so the prompt and the validator can never drift.
    The prompt instructs: return ONLY a Riemann JSON object of the shape
    `{ nodes:[{id,text,tag}], relations:[{from,relation,to}] }` — no prose, no
    markdown, no code fences, no commentary.
  - `contract/index.js` barrel export.
- `contract/prompt.test.js`: assert the prompt text contains every registered
  tag and both `nodes`/`relations` keys.

### Step 2 — Make the AI return only the Riemann JSON
- Replace `fakeAssistantReply` in `src/ChatPanel.jsx` with a real `send()` that
  calls the model using `contract/prompt.js` as the system prompt.
- **Open decision D1 (blocking — need your call):** a live model call from the
  browser leaks the API key, so it must run behind a small proxy (a Cloudflare
  Worker or a Node route). Tell me where it runs and which model/credentials.
  Until then, put the call behind one `fetchRiemannJSON()` seam so the rest of
  the loop is real and testable, but do NOT fake the contract-shape data.
- Take the response **as-is** into Step 3. If it is prose/markdown/invalid, that
  is a failure, not something to strip and salvage.

### Step 3 — Validate the JSON at the boundary
- Feed the raw response to `validateReasoning(...)` (the existing
  `validate.js`). Keep the `VALIDATED` stamp gate in `runtime.js`.
- **No silent cleanup.** Do not strip fences, do not accept unknown tags, do not
  tolerate dangling relation refs. If it does not satisfy the contract, it is
  rejected and reported.

### Step 4 — Make that validated JSON become the actual Space
- On success, build the center Surface from the AI JSON via `Surface.open(json)`
  (or `Surface.propose(patch)` for additive edits) — the AI output *is* what the
  canvas renders.
- On failure, show the validator's exact errors in the chat: "the model wrote
  something invalid: `<reason>`." Keep the previous structure unchanged; never
  put the Surface into an invalid state.
- Use `Surface.subscribe(...)` so the canvas rerenders on change, replacing the
  `tick` re-render hack in `App.jsx`.

### Step 5 — Remove the hardcoded seed as the source of truth
- `App.jsx` no longer derives the Space from `SEEDS[seedName]`. The Space comes
  from the conversation's validated JSON.
- Keep `SEEDS` (or a single sample) only as an optional "load example" for an
  empty state — clearly labelled as scaffolding, never the default content.

### Step 6 — Make Document render the node text as a real document
- Rewrite `renderDocument(surface)` in `projections/document.js`:
  - iterate `surface.graph.nodes()` in **stored order** (delete `threadsOf()`);
  - render **only `node.text`**, flowing naturally as readable prose
    (sentence/paragraph flow), the way the AI's writing would read;
  - **never** print `tagLabel(...)` or relation phrases into the text — tags and
    relations stay metadata in the JSON for the other projections/overlays;
  - remove the now-unused `wording.js` import from `document.js` (Graph/Table may
    still use `wording.js`).
- `projections/document.test.js`: assert stored order is kept, the render equals
  the joined `node.text` values as flowing prose, and none of the tag labels or
  relation words (e.g. `"Assumption"`, `"Therefore"`) appear in the output.

### Step 7 — Only after the loop works, build the other projections
- Graph / Table / Cells render from the same AI-produced Surface. No new data
  source, no artifact-envelope work, until Steps 1–6 are demonstrably running
  against a real AI response.

---

## 4. Order and what I need from you

Run Steps 1 → 6 in sequence; each is testable and each leaves the app runnable.
Step 2's live call is gated on your answer to **D1** (where the model call runs;
which model/credentials). Everything else I can start immediately.

The milestone is met when: you type a request, the AI returns Riemann JSON, it
passes the boundary unchanged (or fails loudly), it becomes the Space, and the
Document tab reads like an ordinary document — with the tags and relations still
present in the JSON but invisible in the prose.
