# leftpanel/ — the left panel, written as behavior

This folder is the left panel of the Riemann Research Notebook described in
programs a machine can run, so that a viewer can draw it and an AI can build
everything underneath it.

It is a **specification for reading**, not code. Nothing here is imported,
compiled, or executed by the app today.

```
leftpanel/
  alphabet.ab                      what symbols exist
  grammar.ab                       how they may be arranged
  behaviors/Redraw.ab              shared terminal behavior
  behaviors/ReportFailure.ab       shared terminal behavior
  programs/  18 × *.ab             one file per user intent
  check.js                         rule checker — a tool, not part of the spec
```

Layer order: **ALPHABET → GRAMMAR → PROGRAMS**. The alphabet does nothing. The
grammar does nothing. The programs are the first thing here that can run.

Verify the folder against its own rules with `node check.js`. It enforces
R1-R7 and reports each hole by name: a missing catch, an undeclared symbol,
a dangling `goto`, an `enter` that does not follow from the sentence. It
found two real defects while this folder was being written.

Source of truth for capability:
`riemannResearchNotebook-v1/mockups/leftpanel/leftpanel_v4.html`
(checklist: `leftpanel_tasks.md`, 89 items).

Model: `rewriteJS/MiMo-V2.6 foundation.md`.

---

## 1. Program index

| Program | Sentence | v4 function | tasks |
|---|---|---|---|
| `UserOpensFile.ab` | User Open File | `openFile(id)` :634 | 14, 22, 39 |
| `UserClosesFile.ab` | User Close File | `closeTab(id)` :641 | 39 |
| `UserCreatesFile.ab` | User Create File | `createNode(cur,'file')` :563 | 6 |
| `UserCreatesFolder.ab` | User Create Folder | `createNode(cur,'folder')` :563 | 7 |
| `UserRenamesFile.ab` | User Rename File | `startRename` :517 / `commitEdit` :524 | 15 |
| `UserRenamesFolder.ab` | User Rename Folder | `startRename` :517 / `commitEdit` :524 | 25 |
| `UserDeletesFile.ab` | User Delete File | `deleteNode` :580 / `showConfirm` :799 | 18 |
| `UserDeletesFolder.ab` | User Delete Folder | `deleteNode` :580 / `showConfirm` :799 | 28 |
| `UserDuplicatesFile.ab` | User Duplicate File | `duplicateNode(id)` :603 | 16 |
| `UserMovesFile.ab` | User Move File | `moveNode(s,t)` :615 | 17, 49 |
| `UserMovesFolder.ab` | User Move Folder | `moveNode(s,t)` :615 | 27, 50 |
| `UserSelectsNode.ab` | User Select Node | `selectNode(id)` :506 | 53, 54 |
| `UserExpandsFolder.ab` | User Expand Folder | `toggleFolder(id)` :511 | 24, 30 |
| `UserCollapsesFolder.ab` | User Collapse Folder | `toggleFolder(id)` :511 | 29 |
| `UserExpandsAll.ab` | User Expand Tree | lambdas :769, :846 | 76 |
| `UserCollapsesAll.ab` | User Collapse Tree | :850, :861 | 76 |
| `UserSearchesTree.ab` | User Search Tree | `#search` input :872 | 11, 42 |
| `UserCopiesPath.ab` | User Copy Path | `copyPath(id)` :791 | 20 |

| Behavior | Reached from | v4 |
|---|---|---|
| `Redraw.ab` | 17 of 18 programs | `renderTree/renderTabs/renderEditor/updateStats` |
| `ReportFailure.ab` | every `goto ReportFailure` | **no v4 surface** |

**Programs deliberately absent.** `UserConfirmsDeletion`, `UserCancelsEdit`,
`UserCommitsRename`, `UserCancelsDelete`, `UserBlursRenameInput` — all of these
are *answers* to a running program, not starts. See §3.

---

## 2. v4 status

**IMPLEMENTED** — v4 runs the whole program:

`UserClosesFile`, `UserCreatesFile`, `UserCreatesFolder`, `UserRenamesFile`,
`UserRenamesFolder`, `UserDeletesFile`, `UserDeletesFolder`,
`UserDuplicatesFile`, `UserMovesFile`, `UserMovesFolder`, `UserSelectsNode`,
`UserExpandsFolder`, `UserCollapsesFolder`, `UserExpandsAll`,
`UserCollapsesAll`, `UserSearchesTree`

**PARTIAL** — the panel does part of it:

| Program | missing |
|---|---|
| `UserOpensFile` | the entire `validate → load → update → focus` chain. `openFile()` :634 pushes a tab, sets `active`, repaints. No validation, no load, no focus step. |
| `UserCopiesPath` | failure is swallowed: `.catch(() => {})` :793 |

**NOT BUILT** — specified here, absent from v4:

- `ReportFailure` has no surface at all. `commitEdit` silently restores the
  original name :538; `moveNode` silently returns on all four guards :616-623;
  `copyPath` discards the rejection :793. The panel goes quiet; the trace must not.
- `*.rename.exists` — `commitEdit` writes `node.name` with no sibling check :541.
- `*.create.invalid` — `createNode` never validates a name; it only silently
  falls back to root when the target is not a folder :565.
- `*.delete.failed`, `*.move.failed` — every mutation is an in-memory array
  splice. There is no write that can fail yet.
- `*.render.failed`, `stats.update.failed` — v4 assumes every paint succeeds.

This is the honest state. I7 says the code must emit what the spec declares;
today it does not. That gap is recorded, not hidden.

---

## 3. Trigger ≠ sentence

A **sentence** is `User <action> <resource>` and gets a program. A **trigger**
is how the panel learns the sentence was said. They are not the same thing,
and collapsing them is what makes specs rot.

`User Open File` is said by:

- clicking a file row — :427-431
- pressing Enter on a selected file — :886-889
- the context menu **Open** — :779
- the row **⋯** button → same menu — :417-421

Four widgets, one sentence, one program. If the panel gains a command palette
or a keyboard shortcut tomorrow, the number of programs does not change.

This is why the files are named `UserOpensFile.ab` and not
`UserClicksFile.ab`. Naming after the widget means renaming the spec every
time the widget moves.

**Two kinds of user act** (`grammar.ab`):

- **(a) starts work** → sentence → its own program.
  Right-click a file, choose *Rename*.
- **(b) answers the system mid-program** → response → caught by the program
  already running. Clicking *Delete* in the confirmation dialog is
  `dialog.confirm.accepted`, caught by `UserDeletesFile`.

Consequences:

- no `UserConfirmsDeletion.ab` — the dialog is a suspension inside
  `UserDeletesFile`
- no `UserCancelsEdit.ab` — Esc is `file.rename.cancelled`, caught by
  `UserRenamesFile`
- no `UserCommitsRename.ab` — Enter is `file.rename.ok`, same program
- search has no commit, so each keystroke is a *new* firing of the same
  sentence, not a suspension

---

## 4. Naming decisions

**Response syntax.** `resource.action.result` — `file.load.ok`,
`dialog.confirm.accepted`, `folder.resolve.selected`.

Not `resource.on.action(actor)`. Three reasons:

1. `on` is reserved for handlers; a response is not a handler.
2. The actor is already the first column of the term (foundation §7). Putting
   it in the response would say it twice.
3. The response must be derivable from the term so the alphabet can never
   disagree with itself. `system load file` → `file.load.*`, with nothing to
   write by hand.

**`requested` is universal, not special to Open.** `grammar.ab` R6: `enter` is
always `<sentence-resource>.<sentence-action>.requested`. So `Open` declares
`ok | failed` like every other action — it is not a one-result verb.

**One failure per real event.** An action declares `failed` exactly when the
machine has somewhere real to fail *to*. Load reads bytes; Render paints;
Report writes a sink. Select, Expand and Collapse are in-memory flag flips —
they declare `ok` only. A folder that will not expand is `render.failed`,
never `expand.failed`.

**Typed sentences, untyped selection.** Sentences carry `File` or `Folder`
because the responses differ (`file.rename.ok` vs `folder.rename.ok`), even
when v4 runs identical code. Selection uses `Node` — nothing about being
selected knows what kind of row it is.

**Actor is a column, not a name.** `declare actor` — `User` is a member of it
(foundation SET1). `System` acts too: `system validate file`.

**Authorization is a separate layer**, outside L0, with no representation
here (SET3). There is no `denied` result in this alphabet on purpose.

---

## 5. Declared but unused

Kept because they belong to the model; flagged so nobody thinks they are
oversights.

| Entry | Why it is here |
|---|---|
| `actor App`, `actor Plugin` | the actor column must be extensible to prove it is not hardcoded to `User` |
| `resource Workspace` | tasks 1-4, 69-74, 83 all unchecked — no panel act touches it yet |
| `action Cancel` | no *step* uses it; cancellation arrives as a `*.rename.cancelled` result, which is a different thing |
| `action Open` | sentence-only. R6 supplies `.requested`; no step is written `system open file` |

---

## 6. Open questions

1. **`exists` is never emitted.** `commitEdit` :541 and `duplicateNode` :607
   have no sibling-name check. Does the AI add the check, or is `exists`
   dropped from `Rename`/`Duplicate`? Until this is answered, **I5 cannot be
   checked** against these two programs.
2. **`createNode`'s silent root fallback** :565. The program treats
   `folder.resolve.root` as a *result*. v4 does it as a substitution with no
   event. Bug, or intended?
3. **Task 24 "Open folder" is checked**, but v4 has no reveal-in-folder —
   clicking a folder toggles it. Mapped to `UserExpandsFolder` for now.
4. **`UserSelectsNode` ends in `halt`, not `Redraw`.** v4 repaints nothing on
   selection (:485-509 toggles classes only). Is a bare `halt` an acceptable
   terminal, or must every program end in a shared behavior?
5. **Path separator** — `pathOf` joins with `"/"` unconditionally :792.
   Platform rule unspecified.
6. **Multi-select** (tasks 51, 52, unchecked) would break `Select: ok` and the
   single-`Node` assumption. Out of scope until it is built.

---

## 7. Not this folder

`riemannResearchNotebook-v1/mockups/leftpanel/machine/` is a **different and
non-adopted** decomposition: one file per v4 function (`UserClicksFile`,
`SystemTogglesFolder`, `UserPressesF2`…), response syntax
`resource.on.action(actor)`, ~84 files. It was produced by another model.

It is left exactly as it is. Do not merge the two, and do not port its syntax
into this folder. The decomposition here is sentence-per-intent, which is what
the foundation requires; theirs is trigger-per-widget, which is what §3 above
exists to argue against.

---

## 8. How to read this

1. `alphabet.ab` — if a name is not declared there, it cannot appear below.
2. `grammar.ab` — rules R1-R7. R3 is the one to check by hand: every step
   must catch **every** result its action declares. A missing catch is a hole.
3. Pick a program. Read the `sentence`, then follow the `goto`s.
4. The two behaviors are terminals. Everything ends in `halt`.

The atomic boundary is a **term whose action is primitive** (`Validate`,
`Load`, `Render`, `Update`, `Focus`, `Report`). Those are where refinement
`⟼` produces code — that is the AI's job. Sentences are not refined; they
are what the person said.

Two independent checks, once code exists:

- **I5 blames the spec** — a step exits only on responses it declares
- **I7 blames the code** — the emitted response is one the step declares
