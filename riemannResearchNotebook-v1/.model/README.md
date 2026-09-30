# .model/ — the notebook, written as behavior

This folder is the Riemann Research Notebook — left panel, centre, right panel —
described in programs a machine can run, so that a viewer can draw it and an AI can
build everything underneath it.

It is a **specification for reading**, not code. Nothing here is imported, compiled,
or executed by the app today.

```
.model/
  alphabet.ab                      what symbols exist
  grammar.ab                       how they may be arranged
  behaviors/Redraw.ab              shared terminal behavior
  behaviors/ReportFailure.ab       shared terminal behavior
  programs/  30 × *.ab             one file per user intent
  check.js                         rule checker — a tool, not part of the spec
```

Layer order: **ALPHABET → GRAMMAR → PROGRAMS**. The alphabet does nothing. The
grammar does nothing. The programs are the first thing here that can run.

Verify the folder against its own rules with `npm run check:model`
(`node .model/check.js`). It enforces R1-R7 and reports each hole by name: a
missing catch, an undeclared symbol, a dangling `goto`, an `enter` that does not
follow from the sentence. It has caught real defects every time it has been run.

Sources of truth for capability:

- left panel: `leftpanel_v4.html` (repo root; checklist: `leftpanel-old/leftpanel_tasks.md`)
- centre, right, persistence: **the shipped app** — `src/`

Model: `rewriteJS/MiMo-V2.6 foundation.md`.

---

## 1. Program index

### Left panel (18)

| Program | Sentence | app |
|---|---|---|
| `UserOpensFile.ab` | User Open File | `App.jsx openFile()` |
| `UserClosesFile.ab` | User Close File | — (no tabs in the app) |
| `UserCreatesFile.ab` | User Create File | context menu → `createEntry` |
| `UserCreatesFolder.ab` | User Create Folder | context menu → `createEntry` |
| `UserRenamesFile.ab` | User Rename File | context menu / F2 / double-click |
| `UserRenamesFolder.ab` | User Rename Folder | context menu / F2 |
| `UserDeletesFile.ab` | User Delete File | context menu / Del → confirm dialog |
| `UserDeletesFolder.ab` | User Delete Folder | context menu / Del → confirm dialog |
| `UserDuplicatesFile.ab` | User Duplicate File | context menu |
| `UserMovesFile.ab` | User Move File | drag onto a folder |
| `UserMovesFolder.ab` | User Move Folder | drag onto a folder |
| `UserSelectsNode.ab` | User Select Node | row click / right-click |
| `UserExpandsFolder.ab` | User Expand Folder | chevron / row click |
| `UserCollapsesFolder.ab` | User Collapse Folder | chevron / row click |
| `UserExpandsAll.ab` | User Expand Tree | context menu "Expand All" |
| `UserCollapsesAll.ab` | User Collapse Tree | context menu "Collapse All" |
| `UserSearchesTree.ab` | User Search Tree | explorer search box |
| `UserCopiesPath.ab` | User Copy Path | context menu "Copy Path" |

### Centre + right (12)

| Program | Sentence | app |
|---|---|---|
| `UserSelectsView.ab` | User Select View | viewbar tabs (Document · Graph · Table · Cells · Structure) |
| `UserAddsMaterial.ab` | User Add Material | **no widget yet** — the paste box |
| `UserAddsSentence.ab` | User Add Sentence | Cells view add form |
| `UserEditsSentence.ab` | User Edit Sentence | cell textarea, onBlur |
| `UserTagsSentence.ab` | User Tag Sentence | cell tag dropdown |
| `UserConnectsSentence.ab` | User Connect Sentence | cell connect control |
| `UserDeletesSentence.ab` | User Delete Sentence | cell ✕ |
| `UserLoadsExample.ab` | User Load Example | header "Load example" |
| `UserSendsMessage.ab` | User Send Message | chat send button / Enter / suggestion chip |
| `UserStartsChat.ab` | User Start Chat | chat "New chat" |
| `UserTogglesPanels.ab` | User Toggle Panel | header "Minimize panels" |
| `UserTogglesChat.ab` | User Toggle Chat | header "Hide chat" |

| Behavior | Reached from | app |
|---|---|---|
| `Redraw.ab` | every program that changes what is seen | one React commit: tree, editor, chat, stats (no tab strip) |
| `ReportFailure.ab` | every `goto ReportFailure` | Cells banner · chat error bubbles — **partly** |

**Programs deliberately absent.** `UserConfirmsDeletion`, `UserCancelsEdit`,
`UserCommitsRename`, `UserCancelsDelete`, `UserBlursRenameInput` — all of these
are *answers* to a running program, not starts. See §3.

---

## 2. Status vs the shipped app — this table is the ship queue

Re-checked against `src/` on 2026-09-30. Three labels only:

**IMPLEMENTED** — the app runs the whole program:

Left panel: `UserCreatesFile`, `UserCreatesFolder`, `UserRenamesFile`,
`UserRenamesFolder`, `UserDeletesFile`, `UserDeletesFolder`,
`UserSelectsNode`, `UserExpandsFolder`, `UserCollapsesFolder`,
`UserExpandsAll`, `UserCollapsesAll`, `UserSearchesTree`

Centre/right: `UserSelectsView`, `UserAddsSentence`, `UserEditsSentence`,
`UserTagsSentence`, `UserConnectsSentence`, `UserDeletesSentence`,
`UserLoadsExample`, `UserStartsChat`, `UserTogglesPanels`, `UserTogglesChat`

**PARTIAL** — the app does part of it:

| Program | missing |
|---|---|
| `UserOpensFile` | the `focus editor` step. `openSurface()` validates, loads and updates — nothing moves focus. |
| `UserDuplicatesFile` | the chain after the insert: v4 (:610-612) selects the copy and starts its inline rename; `duplicateEntry()` (`App.jsx:127`) returns without either. The copy lands silently. |
| `UserMovesFile`, `UserMovesFolder` | the expand-target step. v4 expands the folder you drop into (:627); the app does not, so a moved row can vanish into a collapsed folder. Guards and insert are built. |
| `UserCopiesPath` | failure is swallowed: `.catch(() => {})` (`LeftPanel.jsx:254`) |
| `UserSendsMessage` | the `ask` chain needs `OPENAI_API_KEY` + the dev proxy; a static build fails at `assistant.ask.failed`. Parse failure and boundary refusal are built (error bubbles). |
| `Redraw` | `system render tab` has no surface — the app has no tab strip. |
| `ReportFailure` | carried by the Cells banner and chat error bubbles only. |

**NOT BUILT** — specified here, absent from the app:

- `UserAddsMaterial` — the paste box. This is the milestone verb "put research
  material into it" in its direct reading (today's path is one sentence at a
  time via `UserAddsSentence`).
- `UserClosesFile` — no tab strip, no close affordance. Kept for when tabs arrive.
- The Explorer header lost three v4 buttons: **New File**, **New Folder**,
  **Collapse All** (`#btnNewFile`/`#btnNewFolder`/`#btnCollapse`, v4 :190-196).
  The programs name them as triggers; the React header is title-only. Create
  and collapse-all are reachable from context menus alone.
- **Move does not expand the target** — see the PARTIAL rows above; v4 does
  (`state.expanded.add(targetId)`, :627) and the old machine does.
- **Overlay Escape.** v4/the old machine close the confirm dialog and the
  context menu on Esc. The app's dialog answers click + overlay-click only
  (`LeftPanel:605-617`); the menu answers click + contextmenu only
  (`LeftPanel:172-173`). The rename input does handle Esc (`:666`).
- Left-panel guard refusals stay silent: empty rename restores quietly, an
  illegal move returns quietly, `saveWorkspace` failure only `console.error`s
  (`persistence.js:75`). The trace must not be silent; the UI is.
- `*.rename.exists`, `*.duplicate.exists` — no sibling-name check exists.
- `*.render.failed` — the app assumes every paint succeeds.

Top of the queue for milestone 1: **`UserAddsMaterial` (build the paste box)**,
then **expand-the-target on move** (the result must be visible), then the
header buttons, then `UserOpensFile` focus, then surface the left-panel
refusals.

This is the honest state. I7 says the code must emit what the spec declares;
today it does not. That gap is recorded, not hidden.

---

## 3. Trigger ≠ sentence

A **sentence** is `User <action> <resource>` and gets a program. A **trigger**
is how the panel learns the sentence was said. They are not the same thing, and
collapsing them is what makes specs rot.

`User Open File` is said by: a row click · Enter on a selected row · the context
menu **Open** · the row **⋯** button → same menu. Four widgets, one sentence,
one program. `User Send Message` is said by: the send button · Enter in the
composer · a suggestion chip — three widgets, one program. If the app gains a
command palette tomorrow, the number of programs does not change.

This is why the files are named `UserOpensFile.ab` and not `UserClicksFile.ab`.
Naming after the widget means renaming the spec every time the widget moves.

**Two kinds of user act** (`grammar.ab`):

- **(a) starts work** → sentence → its own program.
  Right-click a file, choose *Rename*.
- **(b) answers the system mid-program** → response → caught by the program
  already running. Clicking *Delete* in the confirmation dialog is
  `dialog.confirm.accepted`, caught by `UserDeletesFile`.

Consequences: no `UserConfirmsDeletion.ab` (dialog = suspension inside
`UserDeletesFile`); no `UserCancelsEdit.ab` (Esc = `file.rename.cancelled`);
no `UserCommitsRename.ab` (Enter = `file.rename.ok`); search has no commit, so
each keystroke is a *new* firing of the same sentence.

---

## 4. Naming decisions

**Response syntax.** `resource.action.result` — `file.load.ok`,
`dialog.confirm.accepted`, `folder.resolve.selected`. Not
`resource.on.action(actor)`: `on` is reserved for handlers; the actor is already
the first column of the term; and the response must be derivable from the term
so the alphabet can never disagree with itself.

**`requested` is universal, not special to Open.** `grammar.ab` R6: `enter` is
always `<sentence-resource>.<sentence-action>.requested`. So `Open` declares
`ok | failed` like every other action.

**One failure per real event.** An action declares `failed` exactly when the
machine has somewhere real to fail *to*. Load reads; Render paints; Report
writes a sink; Save writes browser storage; Ask waits on the network. Select,
Expand, Collapse, Tag, Start, Toggle and Update are in-memory flips — `ok`
only. A folder that will not expand is `render.failed`, never `expand.failed`.

**Typed sentences, untyped selection.** Sentences carry `File` or `Folder`
because the responses differ, even when the code is identical. Selection uses
`Node` — nothing about being selected knows what kind of row it is.

**Actor is a column, not a name.** `declare actor` — `User` is a member of it.
`System` acts too: `system validate sentence`.

**Authorization is a separate layer**, outside L0, with no representation here.
There is no `denied` result in this alphabet on purpose.

---

## 5. What changed when centre and right were modelled (pass 2)

Recorded so the diff is readable against the founder's left-panel pass:

- `Validate`: `already_open` **dropped**. The app re-opening an open file is
  idempotent — nothing observes "already open", and the old branch pointed at
  a focus step the app does not run. The catch was removed from
  `UserOpensFile.ab`.
- `Update`: `failed` **dropped** — applying in-memory state has nowhere to fail
  to (THE LINE). `editor.update.failed` catches removed from
  `UserOpensFile.ab` / `UserClosesFile.ab`; `stats.update.failed` catch removed
  from `Redraw.ab`.
- New actions: `Add · Edit · Tag · Connect · Send · Start · Toggle` (user),
  `Ask · Save` (system).
- New resources: `Material · Sentence · View · Example` (centre),
  `Message · Reply · Chat · Panel · Assistant` (right).
- `Redraw` gained `system render chat` — one React commit paints the whole
  tree, so the thread is painted with the same two results as every other paint.
- Every mutation program ends in `system save workspace` → Redraw. Saving is a
  milestone verb ("save the work"), so it is now in the model, with its real
  failure path (`workspace.save.failed` → ReportFailure).
- The checker itself was repaired: it ran as CommonJS inside an ESM package
  (would not start), it choked on the founder's `(v20454)` / `-> v20439`
  annotations, and it swallowed trailing `# comments` into declared names.
  All three fixed in `check.js`; annotations are stripped, not deleted — they
  still live in the programs.

**Pass 3 (old-machine audit, same day):** all 81 files of
`leftpanel-old/machine/` classified in §8; fixes that fell out of it:

- `UserCreatesFile`/`UserCreatesFolder`: **empty-name semantics corrected to
  the app** — empty commit → kept as "Untitled" (product decision,
  `LeftPanel:236-238`), not discarded as v4 did; boundary refusal (`invalid`)
  now routes to Redraw with the node kept — a refusal is never a reason to
  destroy work. Esc → discard stays (app `:246-247`).
- Both create programs gained the **expand-parent step** the app already runs
  (`LeftPanel:215`); both move programs gained the **expand-target step** v4
  runs (`:627`) — the app doesn't yet, recorded as PARTIAL.
- Status corrections: `UserDuplicatesFile` and `UserMoves*` are PARTIAL, not
  IMPLEMENTED; three v4 header buttons are missing; overlay Escape is missing.
- Paths corrected (the v4 mockup lives at the repo root, tasks and the old
  machine under `leftpanel-old/`).

---

## 6. Declared but unused

Kept because they belong to the model; flagged so nobody thinks they are
oversights.

| Entry | Why it is here |
|---|---|
| `actor App`, `actor Plugin` | the actor column must be extensible to prove it is not hardcoded to `User` |
| `action Cancel` | no *step* uses it; cancellation arrives as a `*.rename.cancelled` result, which is a different thing |
| `action Open` | sentence-only. R6 supplies `.requested`; no step is written `system open file` |

---

## 7. Open questions

1. **`exists` is never emitted.** rename/duplicate have no sibling-name check.
   Does the app add the check, or is `exists` dropped from
   `Rename`/`Duplicate`? Until this is answered, **I5 cannot be checked**
   against these two programs.
2. **`createNode`'s silent root fallback** — the model treats
   `folder.resolve.root` as a *result*; the app does it as a substitution with
   no event. Bug, or intended?
3. **`UserSelectsNode` ends in `halt`, not `Redraw`** — selection repaints
   nothing structural. Is a bare `halt` an acceptable terminal, or must every
   program end in a shared behavior?
4. **Path separator** — `pathOf` joins with `"/"` unconditionally. Platform rule
   unspecified.
5. **Multi-select** would break `Select: ok` and the single-`Node` assumption.
   Out of scope until it is built.
6. **The founder's `(vNNNN)` annotations** appear on `UserOpensFile.ab` steps
   and catches (`(v20450)`, `-> v20439`…). The checker treats them as side
   annotations and strips them. What are they — instance ids? timestamps?
   Should every term carry one? The answer decides whether they are promoted
   into grammar or stay comments.
7. **"Expand All" appears twice with different scope** — whole tree (root menu)
   and one folder's subtree (folder menu). One sentence or two?

---

## 8. Coverage audit — the old machine, file by file

`leftpanel-old/machine/` holds 81 program files in a different grammar
(trigger-per-widget, `resource.on.action(actor)`, **no checker**). It was read
in full and every file is classified below — four labels, no fifth, nothing
unclassified. That is what "no handwavy" means mechanically: a behavior either
points at an entry in this folder, or it carries a reason.

- **COVERED** — our model has it: a program, a step, an answer, or a trigger
  named in a header.
- **BELOW-MODEL** — widget machinery between sentences (menu open/close, drag
  feedback, row paint). Deliberate — §3. The app implements it; naming it here
  makes the silence a choice, not an oversight.
- **GAP-CODE** — the spec is right, the app is missing it → the §2 queue.
- **OBSOLETE** — tabs / v4-only chrome the app does not have.

Audited in passing: the old machine's own completeness is unverifiable —
~20 `System*` helpers it calls have no file (`SystemCollectSubtreeIds`,
`SystemClearTreeContainer`, `SystemRestoreNodeName`, …), one reference doesn't
match its file (`SystemClearDropTargets` vs `SystemClearsDropTargets`), one
file name is a typo (`UserDoubleClcsRow`), and nothing checks it. This folder
stays checked by `npm run check:model`.

### COVERED — 46 files

| old file(s) | our entry |
|---|---|
| `UserOpensFile`, `SystemValidatesFile` | `UserOpensFile.ab` — validate/load/update (PARTIAL: focus) |
| `SystemLoadsFile`, `SystemUpdatesEditorState`, `SystemOpensEditor` | `load` · `update editor` · Redraw `render editor` |
| `UserCreatesFile`, `UserCreatesFolder`, `SystemCreatesNode`, `SystemResolvesTargetFolder`, `SystemExpandsFolder` | `UserCreatesFile.ab` / `UserCreatesFolder.ab` — resolve → create → **expand** → select → rename; empty name → "Untitled" (app semantics, program header) |
| `UserRenamesFile`, `UserRenamesFolder`, `SystemStartsRename`, `SystemFocusesRenameInput`, `SystemRenamesNode` | begin-edit + rename steps in both rename programs |
| `UserCommitsRename`, `UserBlursRenameInput`, `UserCancelsRename` | answers: `file.rename.ok` / blur-commits / `.cancelled` → discard-if-new (grammar (b), not programs) |
| `UserDeletesFile`, `UserDeletesFolder`, `SystemShowsConfirmDialog`, `SystemRemovesNode` | confirm + delete steps (subtree splice in app `removeNode`) |
| `UserConfirmsDelete`, `UserCancelsDelete` | answers: `dialog.confirm.accepted` / `.cancelled` — §3: no `UserConfirmsDeletion.ab` |
| `UserMovesNode`, `SystemMovesNode` | `UserMovesFile.ab` / `UserMovesFolder.ab` — four guards; expand-target step (app gap → below) |
| `UserSelectsNode`, `SystemSelectsNode` | `UserSelectsNode.ab` — select, halt, class paint |
| `UserExpandsFolder`, `UserCollapsesFolder`, `SystemTogglesFolder`, `SystemCollapsesFolder` | `UserExpandsFolder.ab` / `UserCollapsesFolder.ab` |
| `UserExpandsAllFolders`, `UserCollapsesAllFolders`, `SystemExpandsAllFolders`, `SystemCollapsesAllFolders` | `UserExpandsAll.ab` / `UserCollapsesAll.ab` (scoped `onto folder` step) |
| `UserSearchesFiles`, `SystemFiltersTree` | `UserSearchesTree.ab` — ok + empty; keydown swallow matches app `:528` |
| `UserCopiesPath`, `SystemCopiesTextToClipboard` | `UserCopiesPath.ab` (PARTIAL: failure swallowed) |
| `SystemRendersTree`, `SystemUpdatesStats` | Redraw `render tree` · `update stats`; empty message exists in app (`:551-554`) |
| `SystemRendersEditor` | Redraw `render editor` |
| `SystemSelectsNode` (paint half) | below — `SystemUpdatesSelectionHighlight` row |
| `UserPressesF2`, `UserPressesDeleteKey`, `UserPressesEnterKey` | triggers named in the rename/delete/open headers; app `:273`, `:276`, `:279-282` |

### BELOW-MODEL — 25 files (widget machinery, deliberate)

| family | old files | where it lives |
|---|---|---|
| context menu | `SystemBuildsFileMenu`, `SystemBuildsFolderMenu`, `SystemBuildsTreeMenu`, `SystemShowsContextMenu`, `SystemHidesContextMenu`, `UserClicksOutsideContextMenu`, `UserRightClicksRow`, `UserRightClicksTree`, `UserClicksMoreButton`, `UserPicksContextMenuItem` | menu = trigger machinery (§3): app `menuFor`/`rootMenu`, document click close `:172-173`, clamped position; a pick IS the chosen sentence's trigger |
| drag | `UserStartsDrag`, `SystemStartsDrag`, `UserDragOversRow`, `SystemMarksDropTarget`, `SystemClearsDropTargets`, `SystemEndsDrag`, `UserDropsNodeOnFolder`, `UserDropsNodeOnTree` | trigger machinery of `User Move *`; app `:394-419`, `:539-548`; the four drop guards are `dropAllowed` `:361-365` and the move program's results |
| overlays | `UserPressesEscapeKey`, `SystemHidesConfirmDialog` | no global Escape program: each overlay belongs to the running program (rename `.cancelled`, dialog `.cancelled`) — priority dissolves when only one program runs. App gaps recorded in §2. |
| row paint / dispatch | `UserClicksRow`, `UserClicksFile`, `UserClicksFolder`, `UserDoubleClcsRow`, `SystemUpdatesSelectionHighlight` | triggers (§3) + React class paint; selection ends in `halt` by design |

### GAP-CODE — 4 files (spec right, app missing → queue)

| old file | missing in the app |
|---|---|
| `UserClicksNewFileButton` | header **New File** button (v4 `#btnNewFile` :190) |
| `UserClicksNewFolderButton` | header **New Folder** button (v4 `#btnNewFolder` :193) |
| `UserClicksCollapseAllButton` | header **Collapse All** button (v4 `#btnCollapse` :196) |
| `UserDuplicatesFile` | the select + inline-rename chain after insert (§2 PARTIAL row) |

Plus two behaviors spread across files, both recorded in §2: expand-target
after move (`UserMovesNode` / v4 :627) and overlay Escape
(`UserPressesEscapeKey` → dialog/menu).

### OBSOLETE — 6 files (no tabs in the app)

`SystemActivatesTab`, `SystemAddsTab`, `SystemRemovesTab`, `SystemRendersTabs`,
`UserClicksTab`, `UserClosesTab` — the tab strip v4 had. Our
`UserClosesFile.ab` keeps the specification; the day tabs return, the spec is
already ahead of the build.

---

## 9. Not this folder

`leftpanel-old/machine/` is a **different and non-adopted** decomposition:
one file per v4 function (`UserClicksFile`, `SystemTogglesFolder`,
`UserPressesF2`…), response syntax `resource.on.action(actor)`, 81 program
files — every one classified in §8. It
was produced by another model.

It is left exactly as it is. Do not merge the two, and do not port its syntax
into this folder. The decomposition here is sentence-per-intent, which is what
the foundation requires; theirs is trigger-per-widget, which is what §3 above
exists to argue against.

---

## 10. How to read this

1. `alphabet.ab` — if a name is not declared there, it cannot appear below.
2. `grammar.ab` — rules R1-R7. R3 is the one to check by hand: every step
   must catch **every** result its action declares. A missing catch is a hole.
3. Pick a program. Read the `sentence`, then follow the `goto`s.
4. The two behaviors are terminals. Everything ends in `halt`.

The atomic boundary is a **term whose action is primitive** (`Validate`,
`Load`, `Render`, `Update`, `Focus`, `Save`, `Ask`, `Report`). Those are where
refinement `⟼` produces code — that is the AI's job. Sentences are not refined;
they are what the person said.

Two independent checks, once code exists:

- **I5 blames the spec** — a step exits only on responses it declares
- **I7 blames the code** — the emitted response is one the step declares

