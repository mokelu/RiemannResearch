# MiMo-V2.6 Plan — rewriteJS

**Author:** MiMo-V2.6 (opencode)
**Date:** 2026-09-29
**Status:** §1, §8, §9 remain valid. **§4–§7 are deferred** pending `MiMo-V2.6 foundation.md` — the model is being settled first, so no spec format, file tree, React Flow shape, or phase order is frozen yet.
**Source material:** `about rewriteJS.md` (your ChatGPT export), `riemannResearchNotebook-v1/` (the product)

---

## 0. What this folder is for

`rewriteJS` is not a copy of the notebook. It is the **instrument room**.

You said it yourself in the export: you can't read the code, so you can't know the structure. The fix is not to make you read code. The fix is to give you a second artifact that you *can* read — a machine — and to make the machine the thing that is true.

```text
You design and verify the machine.   (rewriteJS)
I compile the machine into software. (riemannResearchNotebook-v1)
```

---

## 1. The decision you asked me to make: parallel or start?

**Parallel, but not a fork.** Three tracks, deliberately different speeds:

| Track | Where | Touches the notebook? |
|---|---|---|
| **A. The machine** (spec data + interpreter) | `rewriteJS/machine/` | No. Zero lines. |
| **B. The viewer** (React Flow, runs and shows the machine) | `rewriteJS/viewer/` | No. Zero lines. |
| **C. The seam** (notebook UI dispatches UAR sentences) | `riemannResearchNotebook-v1/src/` | Yes, but only in Phase 5. |

Why parallel rather than straight-in:

1. The notebook has **45 green tests**. I ran them. I am not going to put an unproven spec layer under them on day one.
2. The notebook already has the right philosophy (`Surface.propose()` is the only write path, `render/surface.js:62`). The machine is a *second* source of structure, not a replacement. They must be shown to agree before they are joined.
3. If track A/B goes wrong you lose a week in a folder you can delete. If track C goes wrong you lose the notebook.

So: **we start immediately, in parallel, and the notebook stays untouched until the machine has run green in front of you.**

---

## 2. The idea, compressed (so we're both holding the same thing)

From your export, in order:

```text
UAR sentence      USER + ACTION + RESOURCE        "USER OPEN FILE"
   ↓ trigger
behavior          the thing that happens          validate → load → update → ready
   ↓ composed of
sub-behaviors     "SYSTEM VALIDATE FILE"
   ↓ decomposed no further than
atomic behavior   the floor. below this is CODE.
   ↓ implemented by
code              I write this. you never read it.
```

Two rules that fall out of it, and that I will enforce:

- **The behavior is data, not code.** A plain object. You can diff it, print it, hand it to me, throw it away.
- **Below the atomic line only I go.** You stop at `SYSTEM VALIDATE FILE`. If you ever find yourself wanting to understand `check path / check existence / check permissions`, that is my layer, not yours.

The vocabulary is a finite set of Lego blocks, exactly as you described:

```text
USERS     User | System | Plugin          (extensible later for permissions)
ACTIONS   Create Read Update Delete Validate Load Save Move Rename Open Close
RESOURCES File Folder Workspace Editor Selection Notebook Cell
EVENTS    Created Loaded Deleted Updated Opened Closed Failed AlreadyOpen
```

Actions are first-class. Improve `Validate` once and every behavior that uses `SYSTEM VALIDATE FILE` inherits it.

---

## 3. Architecture — three layers, strictly separated

```text
rewriteJS/
  machine/     pure ESM. no React, no DOM, no imports from viewer.
               This is the machine. It is testable headless.
  viewer/      React 18 + @xyflow/react. Renders the machine, runs it, lets you drag it.
  tools/       tiny node scripts (sync view state, print a trace).
```

**The hard rule: `machine/` may never import from `viewer/`, and `viewer/` never owns machine truth.**

This is the same law the notebook already wrote in `TheFullIdea/4. Projections.md`: *"one source of truth. the UI is therefore not the source of truth."* The house doesn't change when you walk around it.

Consequence, and it matters: `machine/` has **zero dependencies**. It can be unit tested in milliseconds and later imported by the notebook as a package.

---

## 4. The spec format — this is the most important artifact in the plan

Everything else is plumbing. This is the thing you will actually look at.

### 4.1 Node kinds (what can be in a machine)

| Kind | Meaning | React Flow shape |
|---|---|---|
| `sentence` | The UAR trigger. `USER OPEN FILE`. Entry point. | wide top node, distinct color |
| `behavior` | A composed behavior. Has a drill-down level. | rounded box, double-click to enter |
| `atomic` | The floor. Has an `impl` pointer. | leaf box, green if implemented, grey if not |
| `event` | Something that happened. `ok`, `invalid`, `AlreadyOpen`. | small diamond on an edge |

### 4.2 Edge kinds

| Kind | Meaning |
|---|---|
| `next` | control flow, step to step |
| `on` | event → which behavior runs next (this is a branch) |
| `emits` | behavior → event it produces |
| `contains` | composed → sub (used for drill-down, not nesting) |

### 4.3 Concrete example — the first machine we will write by hand

```js
// rewriteJS/machine/spec/leftPanel.openFile.js
export default {
  id: "leftPanel.openFile",
  sentence: { user: "USER", action: "OPEN", resource: "FILE" },
  entry: "validate",
  states: {
    validate: {
      kind: "atomic",
      behavior: "SYSTEM VALIDATE FILE",
      impl: "contract/atomic/system.validateFile.js",
      on: { ok: "load", invalid: "failed", alreadyOpen: "focusEditor" },
    },
    load: {
      kind: "atomic",
      behavior: "SYSTEM LOAD FILE",
      impl: "contract/atomic/system.loadFile.js",
      on: { ok: "updateEditor", error: "failed" },
    },
    updateEditor: {
      kind: "atomic",
      behavior: "SYSTEM UPDATE EDITOR STATE",
      impl: null,                       // grey node: not built yet
      on: { ok: "editorReady" },
    },
    editorReady: { kind: "atomic", behavior: "SYSTEM FOCUS EDITOR", impl: null, terminal: true },
    focusEditor: { kind: "atomic", behavior: "SYSTEM FOCUS EDITOR", impl: null, terminal: true },
    failed:      { kind: "atomic", behavior: "REPORT FAILURE",      impl: null, terminal: true },
  },
};
```

```js
// rewriteJS/machine/vocabulary.js  — the Lego blocks, nothing else lives here
export const USERS     = ["User", "System", "Plugin"];
export const ACTIONS   = ["Create","Read","Update","Delete","Validate","Load","Save","Move","Rename","Open","Close"];
export const RESOURCES = ["File","Folder","Workspace","Editor","Selection"];
export const EVENTS    = ["ok","invalid","error","alreadyOpen"];
```

A machine is validated against a JSON Schema (ajv — already a dependency of the notebook, so no new thinking). If a spec says `action: "Yeet"`, the test fails before any code runs.

### 4.4 Runtime

```js
const rt = createRuntime(spec, { handlers, clock });
rt.send("alreadyOpen");          // → jumps validate → focusEditor
rt.subscribe(trace => ...);      // trace is the thing the viewer animates
rt.state;                        // current state id
```

- **Handlers are injected, never imported by the runtime.** That is what lets tests fake them and lets the viewer run the same machine without any code written.
- The runtime returns `{ ok, errors }` and can never leave the machine in an invalid state (same contract as `Surface.propose`).

### 4.5 View state is separate from machine state

Positions are **not** in the spec. They live in a sidecar:

```text
machine/spec/leftPanel.openFile.js     ← structure. you and I edit this.
machine/view/leftPanel.openFile.json   ← x/y only. the viewer edits this.
```

This is your own `S37` from `modelling/sentences.md`: *"view state, not research data."* Dragging a box can never corrupt a machine, and the spec file stays a clean diff in git.

---

## 5. Files and folders — the full tree, phase by phase

Nothing here exists yet except `about rewriteJS.md` and this plan.

```text
rewriteJS/
├── about rewriteJS.md                 (yours, untouched)
├── MiMo-V2.6 plan.md                  (this file)
├── package.json                       vite + vitest + @xyflow/react
├── vitest.config.js                   environment: node for machine, jsdom for viewer
├── index.html                         entry for the viewer
├── vite.config.js
│
├── machine/                           ← PHASE 0. zero deps, all headless tests
│   ├── vocabulary.js                  USERS / ACTIONS / RESOURCES / EVENTS
│   ├── schema.js                      ajv JSON Schema for a machine spec
│   ├── validate.js
│   ├── validate.test.js
│   ├── runtime.js                     step / send / subscribe / trace
│   ├── runtime.test.js
│   ├── toFlow.js                      pure: spec → { nodes, edges }
│   ├── toFlow.test.js
│   ├── layout.js                      deterministic layered layout, ~40 lines, no dep
│   ├── layout.test.js
│   ├── index.js                       public entry: createRuntime, loadSpec, toFlow
│   │
│   ├── spec/                          ← the machines. one file per capability.
│   │   └── leftPanel.openFile.js      the first one. we write this together.
│   ├── view/                          ← sidecar positions, written by the viewer
│   │   └── leftPanel.openFile.json
│   └── contract/                      ← PHASE 4. the seam where I write code.
│       ├── atomic.js                  registry: behavior id → handler
│       ├── README.md                  the rule for the AI (see §8)
│       ├── atomic/
│       │   ├── system.validateFile.js
│       │   └── system.loadFile.js
│       └── generated.test.js          one assertion per atomic node in every spec
│
├── viewer/                            ← PHASE 1–3. React + React Flow
│   └── src/
│       ├── main.jsx
│       ├── App.jsx                    mode switch: Model | Run | Read-only
│       ├── store.js                   a 60-line event store. no redux.
│       ├── flow/
│       │   ├── MachineGraph.jsx       the ReactFlow host
│       │   ├── nodeTypes.jsx          declared at module scope (see §6.2)
│       │   ├── edgeTypes.jsx
│       │   ├── toFlowAdapter.js       machine/toFlow + view json → React Flow state
│       │   └── nodes/
│       │       ├── SentenceNode.jsx
│       │       ├── BehaviorNode.jsx
│       │       ├── AtomicNode.jsx
│       │       └── EventNode.jsx
│       ├── Runner.jsx                 play / pause / step / reset, speed  (PHASE 2)
│       ├── Inspector.jsx              selected node → inputs / outputs / failures
│       ├── Breadcrumb.jsx             drill into a composed behavior, back out
│       └── styles.css                 @import "@xyflow/react/dist/style.css"
│
├── tools/
│   ├── print-trace.js                 node machine/spec/x.js → prints the trace
│   └── sync-view.js                   copies viewer positions into machine/view/
└── README.md                          how to run it, and the daily loop
```

### Commands we will be able to run

```bash
cd rewriteJS
npm install
npm test          # machine specs + contract tests, no browser needed
npm run demo      # node tools/print-trace.js — the machine runs headless
npm run dev       # vite → the React Flow viewer
```

---

## 6. React Flow integration — the specifics you asked for

Package: **`@xyflow/react` v12**. Note that `mockups/16_three_panel_workspace_ai_chat_mockup.html:24` loads the older `reactflow@11` from a CDN. New code uses v12 and the `@xyflow/react` import name only. The mockups stay as they are; they are pictures, not dependencies.

### 6.1 The one-way transform

```text
machine/spec/*.js  ──toFlow()──►  { nodes, edges }  ──ReactFlow──►  screen
                                       ▲
                                       └── only x/y ever comes back, into machine/view/*.json
```

- `toFlow(spec)` is a **pure function**, so it is unit-testable without React (`machine/toFlow.test.js`).
- React Flow's `onNodesChange` → `applyNodeChanges` → write `data.x/data.y` into the view sidecar. Nothing else is written back. Ever.
- This is the same shape as `notebook/render/surface.js`: read freely, propose narrowly, validate on the way in.

### 6.2 The three bugs everyone hits — avoided up front

1. **`nodeTypes` / `edgeTypes` must be declared outside the component.** Declaring them inline makes React Flow remount every node on every render, which destroys node state and makes animation stutter. Module scope, frozen.
2. **`ReactFlowProvider` must wrap the app**, not just `<ReactFlow>`, so the toolbar and Inspector (siblings of the graph) can call `useReactFlow()` for `fitView()` and `screenToFlowPosition()`.
3. **React 18 StrictMode double-invokes effects.** The runtime subscription must unsubscribe in effect cleanup or you get duplicate traces. Test it with `npm run dev` and the React DevTools highlight on.

### 6.3 Making the machine *visible while it runs* — the part you actually want

This is the whole reason for React Flow, so it gets its own mechanism:

- The runtime emits a `trace`: `[{ state, behavior, event, at, status }]`.
- `toFlowAdapter` folds the trace onto the graph: each node gets `data.status ∈ {idle, running, done, failed}`, each edge gets `data.traversed`.
- Custom node components color themselves from `data.status`. The currently running edge gets `animated: true`.
- `Runner.jsx` gives you **Play / Pause / Step / Reset / speed**. Step is the important one: one click, one transition, so you can watch `USER OPEN FILE → validate → load → updateEditor → editorReady` and stop on the branch you care about.
- Animation is applied to **color and border only**, never to `transform`. React Flow positions nodes with transforms; fighting that is how people end up with jittery graphs.

### 6.4 Layout

Do not hand-place, and do not take a layout dependency in Phase 0.

`machine/layout.js` is ~40 lines: rank states by topological depth, order within a rank by spec order, `x = index * 280`, `y = rank * 160`. Deterministic, so the graph looks identical every time and a diff in the spec shows up as a diff in the picture.

You can drag anything afterward; positions are saved to `machine/view/`. A "Reset layout" button re-runs `layout.js`.

If machines grow nested, swap `layout.js` for `elkjs` later (it handles compound nodes; `dagre` does not). That is a Phase 3+ problem and is deliberately not in scope now.

### 6.5 Panels and mode

```text
┌──────────────────────────────────────────────────────────────┐
│ Model │ Run │ Read-only            Step ⏮ ◀ ▶ ⏭  1×   Reset │  ← Panel, inside ReactFlow
├──────────────────────────────────────────────────────────────┤
│                                                              │
│                    the machine graph                         │
│                                                              │
├──────────────────────────────┬───────────────────────────────┤
│ Inspector: SYSTEM VALIDATE FILE│  breadcrumb: leftPanel.openFile │
│ inputs  / outputs / failures  │  status: running (3 of 5)     │
└──────────────────────────────┴───────────────────────────────┘
```

- Toolbar lives in React Flow's `<Panel position="top-left">`.
- **Inspector is a sibling flex column, not a Panel.** It must show multi-line text and reflow; overlaid panels don't.
- `deleteKeyCode={null}` in Read-only mode — you cannot destroy a machine by mis-clicking.
- `nodesDraggable={mode === "Model"}`.
- View state (mode, zoom, positions, selected node) persists to `localStorage` only.

---

## 7. The five phases

Each phase ends with something you can look at. Nothing is "done" because I say it is done; it is done because a command goes green or a screen shows it.

### Phase 0 — the machine, headless
**Build:** `machine/vocabulary.js`, `schema.js`, `validate.js`, `runtime.js`, `toFlow.js`, `layout.js`, `spec/leftPanel.openFile.js`, plus their tests.
**No React at all.**
**Done when:** `npm test` green, and `npm run demo` prints the full trace of `USER OPEN FILE` including the `alreadyOpen` branch.
**You do:** read the spec file. If a transition is wrong, we change the spec — not the code.

### Phase 1 — you can see it
**Build:** `viewer/` read-only graph, 4 custom node types, Inspector, breadcrumb, deterministic layout, click-to-select.
**Done when:** `npm run dev` shows the OPEN FILE machine as a graph; clicking `SYSTEM VALIDATE FILE` shows its inputs/outputs/failures.
**You do:** look at it and tell me what is missing or mis-shaped.

### Phase 2 — you can run it  ← the payoff
**Build:** `Runner.jsx`, trace → status, Play/Step/Reset, speed.
**Done when:** press Step five times and watch the highlight walk the graph; take the `alreadyOpen` branch and watch it go sideways to `focusEditor`.
**You do:** verify the machine behaves the way you meant it to. This is the modelling session.

### Phase 3 — you can move it
**Build:** drag positions → `machine/view/*.json`, Reset layout, Export spec (clipboard JSON you can paste back to me), keyboard shortcuts.
**Done when:** drag a box, reload the page, it stayed. Export produces a valid spec.
**You do:** arrange the machine the way you think about it.

### Phase 4 — I get held to it
**Build:** `contract/atomic.js`, `contract/atomic/*.js`, `contract/generated.test.js`, `contract/README.md`.
**Done when:** delete one handler from `contract/atomic.js` and a test goes red.
**You do:** nothing. That is the point — you never have to read this layer again.

### Phase 5 — carry it into the notebook
**Build:**
1. `machine/package.json`, name `@riemann/machine`, `"type": "module"`, zero deps.
2. `riemannResearchNotebook-v1/package.json` gains `"@riemann/machine": "file:../rewriteJS/machine"`.
3. Pilot: one notebook action becomes a dispatched UAR sentence instead of a direct call.
4. Lift `viewer/src/flow/*` into the notebook and use it as the center panel's **Graph** projection, replacing the card list at `src/App.jsx:147`.
**Done when:** the notebook's own `npm test` still reports **45 passed** or better, and the graph view renders the reasoning structure with React Flow.

**Step 4 is the real prize.** The notebook's reasoning graph (nodes + relations) and the machine graph are the same shape of problem — one structure, many projections. `TheFullIdea/4` already says so. Build the React Flow host once, correctly, in `viewer/src/flow/`, and it becomes the center panel's Graph projection on the day we lift it.

---

## 8. The rule for me (put it in `contract/README.md`)

```text
THE CONTRACT

1. The spec (machine/spec/**) is the truth. AI may edit it only at the user's request.
2. AI writes code ONLY below the atomic line (machine/contract/atomic/**).
3. The user never reads atomic code. If he needs to, the abstraction is wrong.
4. generated.test.js is written from the spec, never by hand.
5. A red test means AI drifted from the vision. Not "fix the test."
6. Anything outside contract/atomic/ that changes machine behavior is out of bounds.
```

This is what replaces aimless prompting. You do not prompt "build me a left panel." You say **"make the contract green for `leftPanel.openFile`"**, and I either do it or I show you a spec I had to change to do it.

---

## 9. Your daily loop

```text
1. Pick one capability from the 97-item list.
2. We write its machine.        ~10 minutes, zero code, one small JS file.
3. You open the viewer, Run it, Step it, tell me what's wrong.
4. You say "frozen."
5. I implement the atomic behaviors. generated.test.js must go green.
6. Next capability.
```

Target: **one machine per sitting, not one feature per sitting.**

---

## 10. Non-goals — what we are deliberately not building

- **No RAG yet.** The notebook's retrieval layer comes later. The machine must be buildable and testable without it, or we won't know which part broke.
- **No workspace switcher, no auth, no database, no trash, no git status indicators.** Those are items 69–74 of your list. They are backlog, not Phase 1.
- **Not all 97 capabilities.** One machine, end to end, proven. Then the rest are cheap.
- **No changes to `riemannResearchNotebook-v1` until Phase 5.** Its 45 tests stay green the entire time.
- **No nested/compound React Flow nodes in v1.** Composed behaviors are *drill-down levels* with a breadcrumb, not nested boxes. Nested layout is a known tar pit and buys us nothing on the first machine.

---

## 11. Risks, and what I'll do about them

| Risk | Mitigation |
|---|---|
| Spec format churn after we start | Freeze the schema at the end of Phase 0. Everything else is negotiable, that isn't. |
| Two React Flow versions in one repo | New code: `@xyflow/react` v12 only. Mockups: left alone, they're static. |
| The viewer becomes a second product to maintain | Phases 1–2 are read + run. Only positions are editable in Phase 3. Cap enforced. |
| Over-modeling: 97 machines, none finished | §9. One per sitting. The first one is the whole proof. |
| The seam in Phase 5 breaks the notebook | Notebook `npm test` is the gate. 45 green or we stop. |
| You can't tell if a machine is right | Phase 2 exists for exactly this. If you can't run it, we built the wrong thing. |

---

## 12. Definition of "we have started"

All four, same day:

```bash
cd rewriteJS && npm install && npm test && npm run demo && npm run dev
```

1. Tests green.
2. `USER OPEN FILE` trace prints headlessly.
3. The graph renders in the browser.
4. One atomic handler implemented, `generated.test.js` green.

---

## 13. What I need from you before Phase 0

One answer: **go / change this.**

If go, I start with `machine/vocabulary.js` + `schema.js` + `runtime.js` + `spec/leftPanel.openFile.js` and their tests, and hand you the spec file to read before I write any UI.
