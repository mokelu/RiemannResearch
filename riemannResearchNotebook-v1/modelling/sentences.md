# The Sentences — Notebook Structure

Each sentence is a single fact, stated so it can be judged true or false by looking at the codebase.
Numbered (S1, S2, …) so tests and discussions can refer back to them.

Companion document: `notebook.jsonc` (the JSON structure these sentences describe).

---

## A. Notebook identity

- **S1.** A notebook must have a unique id.
- **S2.** A notebook must have an owner.
- **S3.** A notebook must have a title.
- **S4.** A notebook must record when it was created and when it was last changed.
- **S5.** A newly created notebook must be empty — zero conversations, zero files, zero artifacts.

## B. Membership

- **S6.** A notebook must contain exactly three kinds of members: conversations, files, and artifacts. Nothing else may live directly inside a notebook.
- **S7.** A notebook may hold any number of conversations, including zero.
- **S8.** A notebook may hold any number of files, including zero.
- **S9.** A notebook may hold any number of artifacts, including zero.
- **S10.** Every member of a notebook — conversation, file, artifact — must have an id that is unique within that notebook.
- **S11.** A conversation, file, or artifact must belong to exactly one notebook.

## C. Conversations

- **S12.** A conversation must have a title, a creation time, and an ordered list of messages.
- **S13.** Every message must have a role (user or ai), content, and a timestamp.
- **S14.** An ai message may record which artifacts it produced.
- **S15.** A notebook is valid while only conversations exist in it — the center of a notebook may be empty.
- **S16.** Deleting a conversation must never delete or alter any artifact, file, or other conversation.

## D. Files

- **S17.** A file must have a name, a format, a size, and an upload time.
- **S18.** A file is raw data placed into the notebook by the user; the notebook must never edit a file's contents in place.
- **S19.** A file's bytes may live outside the notebook document; the notebook stores only the file's record.

## E. Artifacts

- **S20.** Every artifact must be exactly one kind of: chart, note, sheet, or board. No other kind may exist.
- **S21.** An artifact must have a title and must record when it was last changed.
- **S22.** An artifact must record the conversation that produced it, or null if it was made by hand.
- **S23.** An artifact may record zero or more files it was derived from.
- **S24.** Production and derivation records are history only. They must never constrain, invalidate, or cascade anything — the artifact survives the deletion of its origin conversation and of every file it cites.
- **S25.** An artifact's body must match its kind: a chart holds chart config, a note holds markdown, a sheet holds columns and rows, a board holds placements.
- **S26.** Deleting an artifact must never delete or alter any other artifact, conversation, or file.

## F. Boards

- **S27.** A board is an artifact, and is subject to every artifact sentence.
- **S28.** A board must consist of placements only: references to other artifacts by id, with a position.
- **S29.** A board must never store a copy of the thing it displays.
- **S30.** When an artifact on a board is deleted, the board must remain valid; its placement may simply render as an empty spot.

## G. Derived facts

- **S31.** All counts shown anywhere in the interface (panel headers, badges, tree totals) must be computed from membership, never stored.
- **S32.** The order of conversations in the left panel must be derived from their timestamps, never stored as a separate ordering.

## H. The three panels

- **S33.** A notebook workspace must present three panels: a left panel of contents, a center panel of work, and a right panel of conversation.
- **S34.** The left panel must show only the current notebook's conversations, files, and artifacts.
- **S35.** The left panel must group artifacts by kind.
- **S36.** At most one artifact is shown in the center panel at a time; exactly one conversation is active in the right panel at a time; the two are chosen independently.
- **S37.** Which artifact and which conversation are currently active is view state, not research data — it must be storable outside the notebook and deletable without losing any research.
- **S38.** A dock must stand to the left of the panel, present in every notebook, and must provide at least Notebooks and Search.
- **S39.** Search must span all of the user's notebooks; the left panel must span only the current one.

## I. Scope and neutrality

- **S40.** A notebook must be domain-neutral — no notebook kind, type, or domain field may exist. Trading, fantasy football, and any other subject differ only in their contents.
- **S41.** Deleting a notebook must delete its conversations, files, and artifacts together. This is the one and only permitted cascade in the entire system.

---

## How they compose

- **S16, S24, S26 + S41** are what "a graph, but not dependency-based" means, precisely. The only arrow that ever cuts is S41 — the notebook's wall. Inside it, nothing propagates.
- **S31, S32** are the anti-drift pair — they forbid stored counts or ordering fields, the kind of quiet lie that creeps in later.
- **S24** is the single most important sentence in the set. It is the philosophy written as a law: *history never breaks anything.*

---

*This file is the intent. The code must keep every sentence true. When a test goes red, the AI drifted from the vision.*
