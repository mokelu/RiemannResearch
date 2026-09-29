# RewriteJS Foundation — the algebra of primitives

**Author:** MiMo-V2.6 (opencode)
**Date:** 2026-09-29
**Status:** model only. **No representation decided** — no JSON, no JS object shape, no schema language, no React Flow, no repo layout. Those are downstream of this document.
**Relation to `MiMo-V2.6 plan.md`:** the plan's §4 (spec format), §5 (file tree), §6 (React Flow), §7 (phases) are now **deferred** until you accept or reject this model. The plan's §1 (parallel tracks), §8 (the contract rule), §9 (daily loop) survive untouched.

**Purpose:** answer your eight questions precisely, using the single example `USER OPEN FILE`, before anything is frozen.

---

## 0. What I am changing in my own thinking

1. I had put **one** arrow between a sentence and code. Your pyramid has **three different arrows**, and conflating them is what makes the whole thing feel slippery. Section 3.2 separates them.
2. `USER OPEN FILE` and `SYSTEM VALIDATE FILE` are not two kinds of object. They are the **same** object in two positions. That single observation collapses most of the ambiguity about "what is a sentence."
3. The atomic boundary is not "where the code starts." **The boundary is an event.** Section 5 states it as an obligation, which is what makes it testable.

---

## 1. The ladder — and where the viewer sits

```text
L0  PRIMITIVES        USER  ACTION  RESOURCE  EVENT  BEHAVIOR
                              │
L1  SENTENCES         a term placed at the entry of a machine, actor is human
                              │
L2  BEHAVIORS         terms + composition operators. behavior = graph of terms
                              │
L3  MACHINE           sentences + definitions + routing. the thing you look at
                              │
L4  RUNTIME           the interpreter. the only layer with time in it
                              │
L5  IMPLEMENTATION    refinement of atomic terms into code
```

**The machine viewer is not on this ladder.** It is a window onto L3 (static shape) and L4 (live trace). It is not a layer, it owns no data, and nothing about the model depends on it existing. This is why we can investigate the algebra now with no React, no browser, and no repo decisions.

Each layer answers exactly one question:

| Layer | Question it answers |
|---|---|
| L0 | What words exist? |
| L1 | What did the person do? |
| L2 | What does doing it consist of? |
| L3 | What is the whole shape, all at once? |
| L4 | What happened, in order, this time? |
| L5 | Who writes the code, and what is that code's only duty? |

---

## 2. L0 — the five primitives

### 2.1 What each primitive is, and what it is not

| Primitive | What it names | What it is **not** |
|---|---|---|
| **USER** (actor) | who acts | not a permission system; not a login — see §2.5 |
| **ACTION** | what is done, as a verb | not a function; not an implementation |
| **RESOURCE** | what it is done to | not a file on disk; not a state object |
| **EVENT** | what was observed to happen | not a callback; not a message on a bus |
| **BEHAVIOR** | a unit of doing | not code; not a state machine "object" |

**USER, ACTION, RESOURCE, EVENT are alphabets.** They are letters. The algebra is about forming words from letters.

What "alphabet" means precisely is now split, and the split matters:

```text
closed at load time,   every name a spec uses must appear in the declared set.
open at authoring      new names enter by `declare`, not by editing RewriteJS.
```

So the vocabulary is **checkable, not hardcoded**. If a spec says `action: Yeet` and `Yeet` was never declared, that is a rejection — not a typo to be tolerated. But if you need `CEO` as an actor, you declare it and it exists; nothing in the framework changes.

Which alphabets get the `declare` treatment, and which stay fixed, is **D6** (§10). The actor column is settled: extensible by declaration. See §2.5.

### 2.2 ACTION as a first-class primitive

An Action is first-class when it can be **named and held without a resource**. So `Validate` is a value you can point at, list, import, and improve — before you know what it will ever be applied to.

```text
ACTION
  name       Validate
  kind       primitive | derived
  arity      which resources it takes, each with a role
  accepts    { File, Folder, Workspace }      ← signature: where it can be used
  emits      { ok, invalid, alreadyOpen }     ← declared events, PRIMITIVE only
  contract   the obligation handed down       ← PRIMITIVE only
  definition a behavior expression            ← DERIVED only
```

Two kinds, and the split is the whole point:

- **primitive** — has a floor. `emits` is *declared* by the person designing the machine. It is a promise about what the implementation is allowed to say.
- **derived** — has a definition. `emits` is *inferred* as the union of what its definition can emit. It has no code of its own; it is pure structure.

Arity matters, and I am not going to pretend everything is one-resource:

```text
Validate   (File) →                   single resource
Move       (File, Folder) →           two resources, roles: primary, target
Update     (EditorState, Selection) → two resources, roles: primary, source
```

So an Action carries **roles**, not just a list of arguments. That is what lets `SYSTEM VALIDATE FILE` and `FILE MOVE FOLDER` be built by the same constructor without ambiguity about which resource is which.

### 2.3 RESOURCE as a first-class primitive

```text
RESOURCE
  name       File
  contains   Folder → File              optional, compositional on resources
```

That is nearly all. Note what is **absent**: the list of actions that apply to a file is *not stored on the resource*. It is the inverse of `Action.accepts`, so it is **derived, never stored**.

This is your own `S31`/`S32` anti-drift law applied to the primitive layer: never store a fact that can be computed, because a stored fact can lie.

```text
actions(File)  ≜  { A ∈ ACTION : File ∈ accepts(A) }
```

### 2.4 EVENT as a first-class primitive

```text
EVENT
  name       ok | invalid | alreadyOpen | error | ...
```

**Events are consumed locally, at the node that emitted them.** The graph is the namespace.

```text
from [validate] --ok--> [load]
from [updateEditor] --ok--> [editorReady]
```

Both edges are labelled `ok`, and they never collide, because routing is looked up *at the emitting node*. This matters: it means RewriteJS never needs a global event registry, which is exactly the kind of thing that turns into a 400-line enum that nobody dares edit.

### 2.5 The USER column — an extensible alphabet, not a permission system

The actor column is headed **`User`**. Its members are `User`, `System`, `App`, `Plugin`, `CEO`, …

**Two things named `User`, and they must not be confused:**

```text
User      the name of the column            (the sort)
User      a member of that column           (an actor)
```

Internally this document writes the column **`ACTOR`** and keeps `User` as a member, precisely so the collision never reaches the model. When your notes say "the `User` column", read `ACTOR`. This is a naming convention, not a representation decision — but it should be fixed now, because it will otherwise appear in every spec.

#### Alphabet

```text
ACTOR = { User, System, App, Plugin, CEO, ... }
```

Not hardcoded as the complete set. Not a fixed enum in the framework.

#### Declaration

```text
declare User
declare System
declare App
declare Plugin
declare CEO
```

Therefore:

```text
ACTOR = {declared actors}
```

Extensible by declaration. Adding an actor changes **data**, never framework code.

#### What the column does and does not do

| The actor column **does** | The actor column **does not** |
|---|---|
| establish which actors exist | decide who may do what |
| let a term name its actor | constrain which resources an actor reaches |
| make the set checkable at spec load | encode roles, ownership, or hierarchy |

```text
the column establishes the available actors.
```

#### Authorization is a separate layer

```text
Actor  →  Permission  →  Resource
```

A separate permission system determines the relationships between actors and the resources they can operate on. An **OpenFGA / Zanzibar-style** layer could eventually provide this.

This is deliberately **outside L0**. The actor alphabet answers *who exists*; authorization answers *who may do what to which*. They are different questions and must not be merged, or the behavior algebra stops being domain-neutral.

Consequence for the model: **a behavior graph is the same regardless of who is authorized.** Authorization decides whether a sentence is permitted to start, or whether an atomic term is permitted to run — it does not shape the graph.

Where that check happens (before the sentence, at each node, or both) is **D7** (§10) and is deferred; we will talk about it later.

---

### 2.6 The four roles of a term — how a primitive becomes a sentence or an atomic behavior

Here is the constructor that does all the work.

```text
apply : ACTION × RESOURCEᵏ (bound to an ACTOR)  →  TERM

TERM = ⟨actor | action | resources⟩
```

`Validate` applied to `File` under `System` produces the term `⟨System | Validate | File⟩`. Written in words: `SYSTEM VALIDATE FILE`.

**The same term plays four roles depending on where it is put:**

| Role | Position | Example |
|---|---|---|
| **named** | in the vocabulary, nowhere yet | `SYSTEM VALIDATE FILE` in a list |
| **placed** | a node inside a machine | the box you see in the viewer |
| **running** | selected by the runtime, this instant | the highlighted box |
| **refined** | replaced by code | L5 |

So nothing is created when a sentence forms, and nothing is created when an atomic behavior forms. **There is one object.** Its role changes.

---

## 3. L1 — sentences

### 3.1 A sentence is a term, not a new type

```text
SENTENCE  =  a TERM whose
               • actor is human          (kind: User)
               • position is the `entry` of a machine
               • action is declared triggerable for that resource
```

That is the entire definition. There is no separate sentence object, no sentence class, no sentence schema. This is the economy I was missing: `USER OPEN FILE` and `SYSTEM VALIDATE FILE` are visibly the same shape on the page because **they are the same shape in the model.** One is human-actor + entry position; the other is system-actor + interior position.

### 3.2 Your pyramid contains three different arrows

This is the correction I owe you. Read the pyramid again:

```text
USER + ACTION + RESOURCE
        │  (1) CONSTRUCTION
     SENTENCE
        │  (2) DECOMPOSITION
     BEHAVIOR → COMPOSED → SUB-BEHAVIORS → ATOMIC
        │  (3) REFINEMENT
      CODE
```

| Arrow | Kind | Written | What it means |
|---|---|---|---|
| **(1)** construction | `apply` | `Validate × File ⟼ ⟨System\|Validate\|File⟩` | a term is *formed* from primitives |
| **(2)** decomposition | `→[event]` | `Validate --ok--> Load` | a behavior is a *graph of terms* wired by events |
| **(3)** refinement | `⟼` | `⟨System\|Validate\|File⟩ ⟼ validateFileImpl` | an atomic term is *replaced by* code |

They are not the same operation. Arrow (1) never runs. Arrow (2) runs only in the runtime's head. Arrow (3) is where software happens. Most of the confusion in describing this system comes from writing all three as "→".

**Arrow (3) is the only arrow that produces code. Arrows (1) and (2) produce data.**

---

## 4. L2 — the behavior algebra

### 4.1 The central definition

```text
BEHAVIOR  =  a labelled directed graph over TERMS
             with exactly one entry
             and one or more exits
             each edge guarded by an EVENT
```

Everything else is a consequence.

```text
ATOMIC BEHAVIOR     exactly one node, whose action is primitive
COMPOSED BEHAVIOR   more than one node; may reference derived actions
```

Sub-behaviors are terms like any other. So composition is **uniform**: a behavior is a graph of terms, the leaves are atomic, the interior is routing. There is no second mechanism.

### 4.2 The operators

| Operator | Reading | Example | Law |
|---|---|---|---|
| `apply` | action onto resources | `Validate × File` | yields a term |
| `→[e]` | e-then | `Validate --ok--> Load` | the only edge form |
| `;` | sequence | `VALIDATE ; LOAD` | **monoid**: associative, unit `skip` |
| `≜` | derived definition | `Open(f) ≜ ...` | definitions must be **acyclic** |
| `⟨actor⟩` | actor binding | `System ⊢ ...` | substitution, no new structure |
| `⟼` | refinement to code | atomic `⟼` impl | L5 only; **not** a composition operator |

`;` is just sugar for a two-node graph with one edge. It earns its own row only because the monoid law is what lets us reason about long sequences without expanding them.

**Not in v1, listed so we don't rediscover them later:** parallel composition, retry/loop, timeouts, cancellation, cross-machine calls. Each one changes the runtime, so each is a deliberate decision, not an accidental feature.

### 4.3 How atomic behaviors compose into larger ones

By **reference and routing only** — never by nesting code.

```text
Open(f) ≜
      Validate(f)
         --ok-->           Load(f)
                              --ok-->        Update(EditorState)
                                               --ok-->        Focus(Editor)
         --invalid-->      ReportFailure
         --alreadyOpen-->  Focus(Editor)
         Load --error-->   ReportFailure
         Update --error--> ReportFailure
```

Read that carefully: `ReportFailure` and `Focus(Editor)` appear **twice** and they are the *same* nodes in the graph, not copies. Reuse at the behavior level is reference, not duplication.

### 4.4 Events: declared, emitted, routed — three different owners

This is the load-bearing part of the algebra.

| Stage | Owner | Statement |
|---|---|---|
| **declared** | the machine designer | `Validate emits {ok, invalid, alreadyOpen}` |
| **emitted** | the implementation (AI) | on each run, emit **exactly one** of the declared |
| **routed** | the machine (declarative) | `from node --event--> node` |

Two checks fall out, and they are different tests:

```text
SPEC CHECK     node's exit labels ⊆ action's declared emits
               (validates the spec against itself; run at spec-load time)

CODE CHECK     implementation's emitted event ∈ node's exit labels
               (validates code against the spec; generated test)
```

If the spec check fails, the machine is broken. If the code check fails, the AI drifted. **Different failures, different blame, different tests.**

---

## 5. The atomic boundary, stated exactly

> **The boundary is not where the code starts. The boundary is an event.**

```text
ABOVE the boundary   — what to do, given that an event happened.
                      terms, sequences, routing, machines, vocabulary.
                      RewriteJS owns this. Pure data. No code.

THE BOUNDARY         — one term, ⟨System | Validate | File⟩,
                      and the obligation: emit exactly one event
                      from the node's exit set.

BELOW the boundary   — check path, check existence, check permissions, check format.
                      AI owns this. RewriteJS has no representation of it.
                      It never will.
```

Two consequences worth stating plainly:

1. **Atomicity is a property of the model's resolution, not of the world.** `SYSTEM VALIDATE FILE` is atomic because we chose to stop there. Below it the structure simply ends. If you ever want to see deeper, that is a deliberate decision to move the boundary, and it costs a new spec — not a new kind of object.
2. **The boundary is testable without reading code.** Generated test: run the handler against a fake world, assert it emits one event from the exit set and nothing else. That is the entire contract. It is why you never have to open a file below the line.

---

## 6. L3 and L4

### 6.1 The machine (L3)

```text
MACHINE =  a set of sentences (entries)
         + action definitions (the derived ones)
         + the terms it contains
         + the routing table (edges)
```

One law: **every event that can be emitted is either routed, or terminates the machine.** An unhandled event is not an exception to be caught — it is a named outcome, `UNHANDLED(e)`, visible in the trace. Silence is never allowed.

### 6.2 The runtime (L4) — execution as five rules

```text
state  =  ⟨current term, resource bindings, world, pending event, trace⟩

R1  start     at the machine's entry term, bindings taken from the sentence
R2  expand    if the term's action is derived, replace it with its definition
R3  execute   if primitive: hand term + bindings to the implementation;
              implementation returns ONE event e; append ⟨term, e⟩ to trace
R4  route     look up e at the current node
                 found     → move to target, go to R2
                 not found → terminate UNHANDLED(e)
R5  halt      node has no outgoing edges → terminate with its event
```

Note R2 before R3: derived actions never reach the implementation. They are macro-expanded by the runtime. That is what makes "behavior is data" true — the runtime is reading a program you wrote out of terms.

### 6.3 OPEN DECISION D1 — expansion vs. stack (model-level, needs your call)

Derived actions can be executed two ways. This is a **model** decision, not a representation one, so it belongs here rather than downstream.

| | **(A) expand** — flatten at load | **(B) stack** — push/pop at run |
|---|---|---|
| Execution model | plain DFA / state graph | pushdown automaton |
| `Focus(Editor)` used in two places | expanded twice, two distinct runtime states | one state, two return points |
| Trace | unambiguous, one flat sequence | needs depth markers |
| Completion signal | none needed | must invent a distinguished `done` event |
| Runtime complexity | lower | higher (continuation stack) |
| Viewer | shows source hierarchy + a "flatten" toggle showing what really runs | shows what runs directly |

**My recommendation: (A) expand.**

Reasons: the trace stays flat and unambiguous, which matters because *the trace is the thing you read*; no need to invent a completion event; the runtime stays a DFA, which keeps R1–R5 the entire specification. The hierarchy still exists — it is the **source** structure, and the viewer can show it and then show its flattening on a toggle, which is itself a useful thing to look at.

Cost of (A): the spec must expand before execution, and expansion sites need fresh identity. That is a mechanical, testable transformation.

---

## 7. THE WORKED EXAMPLE — `USER OPEN FILE`

### 7.1 L0 — the alphabets this example touches

```text
declare User          ┐
declare System        ┘ the actor column is extensible by declaration (§2.5)

ACTOR     { User, System }
ACTION    Open (derived)  Validate (primitive)  Load (primitive)
          Update (primitive)  Focus (primitive)
RESOURCE  File  Folder  EditorState  Editor
EVENT     ok  invalid  alreadyOpen  error  ready
```

Only `ACTOR` is shown with `declare`, because it is the settled case. Whether `ACTION`, `RESOURCE` and `EVENT` get the same treatment is **D6** — pending our later conversation.

### 7.2 The action table — what is declared, what is inferred

| Action | kind | accepts | emits | where defined |
|---|---|---|---|---|
| `Open` | **derived** | File, Folder, Workspace | *inferred* | §7.4 |
| `Validate` | primitive | File, Folder, Workspace | `{ok, invalid, alreadyOpen}` | declared |
| `Load` | primitive | File, Folder | `{ok, error}` | declared |
| `Update` | primitive | EditorState | `{ok, error}` | declared |
| `Focus` | primitive | Editor, Selection | `{ok}` | declared |

`Open`'s inferred `emits` = union over its exits = `{ok, invalid, alreadyOpen, error}`.

### 7.3 L1 — the sentence

```text
apply(Open, [File], actor=User)  =  ⟨User | Open | File⟩
                                    =  "USER OPEN FILE"
```

It is a sentence because the actor is human and it sits at the entry of machine `leftPanel.openFile`. Nothing else about it is special. Take away those two conditions and it is an ordinary term.

### 7.4 L2 — the derived definition

```text
Open(f) ≜
    Validate(f)
      --ok-->           Load(f)
                          --ok-->         Update(EditorState)
                                            --ok-->        Focus(Editor)
      --invalid-->      ReportFailure()
      --alreadyOpen-->  Focus(Editor)
    Load      --error--> ReportFailure()
    Update    --error--> ReportFailure()
```

Four atomic terms inside it. Note `ReportFailure` is itself a composed behavior shared with other machines — reuse at level L2, not L0.

### 7.5 The machine as graph

```text
                      [USER OPEN FILE]                ⟨User | Open | File⟩     entry
                              │  (expands)
                              ▼
                    ┌──► [SYSTEM VALIDATE FILE] ◄── Validate × File      ATOMIC
                    │         │  │  │
                    │     ok──┘  │  └──alreadyOpen──────────────┐
                    │            │invalid                      │
                    │            ▼                             ▼
                    │    [REPORT FAILURE] ◄──error── [SYSTEM LOAD FILE]   ATOMIC
                    │       composed                        │
                    │                                       │ok
                    │                                       ▼
                    │                        [SYSTEM UPDATE EDITOR STATE] ATOMIC
                    │                                       │
                    │                                    ok─┘
                    │                                       ▼
                    └──────────────────────────────── [SYSTEM FOCUS EDITOR] ATOMIC
                                                          terminal
```

Node inventory — **6 nodes, 4 atomic, 2 composed** (the entry counts as a sentence, which expands away under D1-A):

| Node | Kind | Action | Actor |
|---|---|---|---|
| `USER OPEN FILE` | sentence / entry | Open (derived) | User |
| `SYSTEM VALIDATE FILE` | **atomic** | Validate | System |
| `SYSTEM LOAD FILE` | **atomic** | Load | System |
| `SYSTEM UPDATE EDITOR STATE` | **atomic** | Update | System |
| `SYSTEM FOCUS EDITOR` | **atomic** | Focus | System |
| `REPORT FAILURE` | composed | — | System |

### 7.6 One execution — the happy path

```text
sentences   apply(Open, [File], User)
            → expand Open(f)
  R1        at  ⟨System | Validate | File⟩         bindings {f: /notes/a.md}
  R3        implementation runs, emits ok          trace: [Validate/File, ok]
  R4        ok at Validate → ⟨System | Load | File⟩
  R3        emits ok                               trace: [..., Load/File, ok]
  R4        ok at Load → ⟨System | Update | EditorState⟩
  R3        emits ok                               trace: [..., Update/EditorState, ok]
  R4        ok at Update → ⟨System | Focus | Editor⟩
  R3        emits ok                               trace: [..., Focus/Editor, ok]
  R5        no outgoing edges → halt ok
```

Five events, five traces, one halt. The other path — the one you should also look at:

```text
  R3        Validate/File emits alreadyOpen
  R4        alreadyOpen at Validate → ⟨System | Focus | Editor⟩     (skips Load entirely)
  R3        emits ok
  R5        halt ok
```

### 7.7 What is reusable — the reuse map

| Reuse kind | Evidence in this example |
|---|---|
| **Action × resource** | `Validate` gives `SYSTEM VALIDATE FILE`, `SYSTEM VALIDATE FOLDER`, `SYSTEM VALIDATE WORKSPACE`. One contract, three instances. Improve `Validate`, all three improve. |
| **Action × actor** | the definition `Open(f)` is written against a bound actor, so `System ⊢ Open(f)` and `User ⊢ Open(f)` are the same structure with a different binding. |
| **Behavior reference** | `Focus(Editor)` is one node reached from two predecessors. `ReportFailure` is one composed behavior shared across machines. |
| **Structure (not stored)** | `actions(File)` is derived from `Action.accepts`, never written down. |
| **Contract across instances** | the generated test for `Validate` is *one* test that runs against all three resource instances. |

### 7.8 What becomes implementation code — the refinement map

Exactly the four atomic terms. Nothing else.

| Atomic term | Refined to | Declared emits | Node exits used |
|---|---|---|---|
| `⟨System\|Validate\|File⟩` | `validateFileImpl` | ok, invalid, alreadyOpen | ok, invalid, alreadyOpen |
| `⟨System\|Load\|File⟩` | `loadFileImpl` | ok, error | ok, error |
| `⟨System\|Update\|EditorState⟩` | `updateEditorStateImpl` | ok, error | ok |
| `⟨System\|Focus\|Editor⟩` | `focusEditorImpl` | ok | ok |

Spec check first: every "node exits used" column is a subset of the "declared emits" column. If it isn't, the machine is rejected before a single line of code exists.

Then four generated tests, one per row, each asserting: *emits exactly one event, from the third column, and nothing else.*

### 7.9 What does NOT become code

The sentence. The sequence. The branching. The routing. The definitions. The vocabulary. The machine. The trace. The viewer.

**All of that is data.** Four handlers and their tests are the entire software footprint of `USER OPEN FILE`.

---

## 8. Invariants — laws that must never be violated

If any of these breaks, we have drifted from the model, regardless of whether the tests are green.

| # | Law | Checked at |
|---|---|---|
| I1 | Every name a spec uses is drawn from a **declared** alphabet — undeclared names are rejected at load, declared ones are legal forever | spec load |
| I2 | `Action.accepts` covers every resource it is applied to | spec load |
| I3 | Derived action definitions are acyclic | spec load |
| I4 | Every behavior has exactly one entry and ≥1 exit | spec load |
| I5 | Node exit labels ⊆ that action's declared `emits` | spec load |
| I6 | Every emitted event is routed or terminates the machine | spec load (static reachability) |
| I7 | An implementation emits exactly one event from the node's exits | generated test |
| I8 | Nothing above L5 has a code path | architecture / review |
| I9 | Derived facts are derived, never stored | spec load (no `actions` field on a resource) |
| I10 | The runtime never enters an invalid state | runtime contract, same shape as `Surface.propose` |

I5 and I7 are the pair that matters most. **I5 blames the spec. I7 blames the code.** They are separate tests and must never be merged, or we lose the ability to say who was wrong.

---

## 9. Your eight questions, answered

| # | Your question | Answer | Where |
|---|---|---|---|
| 1 | What is an Action as a first-class primitive? | A named value holding kind, arity with roles, accepted resources, declared events, and either a contract or a definition. Holdable with no resource. | §2.2 |
| 2 | What is a Resource as a first-class primitive? | A named value, optionally with containment. The set of actions that apply to it is derived, never stored. | §2.3 |
| 3 | How are Actions applied to Resources? | `apply` binds actor + action + resource list into a **term** `⟨actor\|action\|resources⟩`. One constructor, four roles. | §2.6 |
| 4 | How does that produce a sentence or atomic behavior? | It produces neither by itself. It is a sentence when actor is human and position is `entry`; it is atomic when the action is primitive. **Same object, two positions.** | §3.1, §4.1 |
| 5 | How are atomic behaviors composed into larger ones? | By reference and by event-guarded edges only. A behavior is a graph of terms. Never by nesting code. | §4.1, §4.3 |
| 6 | How are events produced and consumed? | Declared by the designer, emitted by the implementation (exactly one), routed by the machine. Consumed locally at the emitting node. | §4.4 |
| 7 | How does the runtime execute the structure? | Five rules: start → expand → execute → route → halt. DFA under D1-A. | §6.2 |
| 8 | What is the boundary between declarative and implementation? | **An event.** Above: what to do given an event. The boundary: one term + the duty to emit one declared event. Below: code, which RewriteJS never represents. | §5 |

---

## 10. Open decisions — split honestly

### Settled (your input, already incorporated)

| # | Decision | Outcome |
|---|---|---|
| **SET1** | the actor column | **extensible by `declare`**, not a fixed enum (§2.5) |
| **SET2** | column vs member naming | column reads `ACTOR` in the model; `User` is a member (§2.5) |
| **SET3** | authorization | a **separate** layer, `Actor → Permission → Resource`, OpenFGA/Zanzibar-shaped; outside L0 (§2.5) |

### Model-level (must decide before freezing anything)

| # | Decision | Options | My recommendation |
|---|---|---|---|
| **D1** | derived-action execution | (A) expand / (B) stack | **A** — flat trace, no completion event, runtime = R1–R5 |
| **D2** | event scope | local-at-node / global registry | **local** — the graph is the namespace (§2.4) |
| **D3** | unhandled event | named terminal `UNHANDLED(e)` / throw / silent | **named terminal** — silence is never allowed (§6.1) |
| **D4** | is `ReportFailure` a behavior or a primitive? | composed / primitive | **composed** — it has visible structure worth seeing |
| **D5** | arity-2 actions (Move) in v1 | in / out | **in the model, out of the first example** — `apply` already supports it; we just don't demo it yet |
| **D6** | do ACTION / RESOURCE / EVENT also take `declare`? | all four extensible / actors only / mixed | *undecided* — the actor column is settled; whether `declare` generalises is **talk-later** |
| **D7** | where is authorization evaluated? | before the sentence / at each atomic term / both | *undecided* — **talk-later** (§2.5). Note it cannot reshape the graph either way |
| **D8** | does `CEO` carry meaning to the model, or only to the permission layer? | model-visible role / opaque name | *undecided* — **talk-later**. If opaque, actors are pure names and §2.5 stays this small |

### Deferred (representation — explicitly NOT decided here)

- serialization format (JSON, `.js`, markdown, database)
- schema/validation language
- whether a machine is one file, one folder, or one table
- runtime language and how it is hosted
- viewer technology, React Flow or otherwise
- repository layout, package boundaries, build
- how AI receives a spec and returns code

**Nothing in §1–§8 depends on any of those.** That is the test of whether this is really a model or just a plan wearing a model's clothes.

---

## 11. What I need from you

Answer in any order; a one-line "D1=A, rest yes" is enough.

1. **D1** — expand or stack? (I say expand.)
2. **D2, D3, D4, D5** — accept my recommendation or change it.
3. **D6, D7, D8** — parked for a later conversation, per your note. They do not block anything in §1–§9; I have written them down so they don't get lost.
4. Confirm **§5**: the boundary is an event, and below it RewriteJS has no representation.
5. Confirm **§3.2**: three distinct arrows, only (3) produces code.

Then I will take your answers and produce the next artifact: the **complete primitive spec for this one example** — every primitive, every term, every edge, every declared event, written out in full for `USER OPEN FILE` — with no serialization format attached, so you can judge the model before we argue about the container.
