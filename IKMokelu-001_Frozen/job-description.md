# Riemann Research Notebook — 3-Day Blitz

## Objective

Ship a working, usable version of Riemann Research Notebook within 3 days.

This is not a prototype, mockup, architectural exercise, or design exploration.

The job is to take the current Riemann codebase and make the notebook usable end-to-end by a real person.

## What Riemann Research Notebook Is

Riemann Research Notebook is a free AI research workspace.

The user should be able to:

* Create and open a notebook
* Talk to AI
* Work with files and research material
* See and manipulate the things they are working on
* Keep their work persistent
* Return later and continue where they stopped

The notebook has three primary areas:

### Left panel

The user's notebooks, files, and workspace structure.

### Center panel

The actual work surface.

This is where documents, data, charts, tables, research outputs, and other workspace objects appear.

It should not just be an empty Markdown editor.

### Right panel

The AI conversation.

The AI should be able to understand what exists in the current notebook and help the user work with it.

## Core Requirement

The three panels must work together as one system.

The user should be able to:

1. Create a notebook.
2. Open it.
3. Add or open something to work on.
4. Talk to the AI about it.
5. See the result in the center.
6. Continue working.
7. Close the notebook.
8. Reopen it.
9. Find their work exactly where they left it.

That complete loop is the product.

## Workspace Reliability

For this 3-day release, “reliable” means:

* Workspace state persists.
* Notebook data persists.
* Files persist.
* Objects do not randomly disappear.
* Objects can be created.
* Objects can be moved.
* Objects can receive inputs.
* Objects can produce outputs.
* Objects can be connected.
* Objects can be disconnected.
* Objects can execute.
* AI can understand and interact with workspace objects.
* Reloading the application does not destroy the user's work.

The implementation does not need to be perfect.

It needs to be dependable enough that a real user can use the notebook without constantly encountering broken state.

## AI

The AI does not need every future Riemann capability.

It needs to reliably:

* Receive the user's conversation.
* Understand the current notebook context.
* Read relevant files/data.
* Create or modify supported workspace objects.
* Produce useful outputs in the center panel.
* Continue working from previous context.

## Initial Workspace Objects

Only support what is necessary for the first usable release.

Potential initial objects include:

* Markdown/text
* Files
* Tables/data
* Charts
* AI-generated research output

Do not spend the three days building dozens of artifact types.

## Persistence

A notebook must have durable identity and state.

At minimum, persist:

* Notebook identity
* Notebook contents
* Files
* Workspace objects
* Object positions/state where necessary
* Conversations
* Relevant AI-generated outputs

A user should be able to leave and come back without losing their work.

## Product Boundary

Do not attempt to finish:

* Cursor for traders
* Full trading system
* Full Abracadabra language
* Complete optimization engine
* GTA 6 research system
* All transpilers
* Complete automation platform
* Perfect charting system
* Every future Riemann artifact

Those are subsequent objectives.

This Blitz is about getting the foundation into users' hands.

## Definition of Done

The Blitz is complete when a new user can:

**Open Riemann → create a notebook → talk to AI → create/work with something → see it in the center → save it → close → reopen → continue working.**

That flow must work without manual intervention from the developer.

## Three-Day Priority

### Day 1 — Make the core loop work

Get the three-panel application functioning.

Notebook → AI → workspace.

Remove anything blocking the basic user journey.

### Day 2 — Persistence and interaction

Make notebook/workspace state durable.

Make objects usable, movable, connected and executable where supported.

Make AI interaction with the workspace work.

### Day 3 — Hardening and release

Fix the broken paths.

Test the complete user journey.

Clean up the obvious rough edges.

Deploy.

Create the public signup/download/access path.

Then stop building and let someone other than the developer use it.

## Final Deliverable

A publicly usable:

# Riemann Research Notebook

with:

**Notebook / Files | Workspace | AI**

working together as one product.

The goal is not to prove that Riemann is finished.

The goal is to prove that **Riemann exists.**
