# Chapter 3 — Finite Selves

## 3.1 What Is a Finite Self?

A **finite self** is a computational entity that represents a thing in the world.

A Button can have a finite self.

A Chart can have a finite self.

A Spreadsheet can have a finite self.

The finite self gives the thing an identity and allows it to act within the world.

## 3.2 What a Finite Self Contains

A finite self has several parts:

```text
Finite Self
├── Machine Data
├── Algebra
├── CEP
├── AI
├── UTM
└── Coordination
```

**Machine Data** gives the self its identity, structure, states, and capabilities.

**Algebra** handles deterministic state changes.

**CEP** handles events, timing, and patterns.

**AI** provides reasoning and interpretation.

**UTM** provides a universal computational substrate for holding and executing programs.

**Coordination** allows the self to communicate and work with other selves.

## 3.3 A Self Can Receive Instructions

A finite self can be given an instruction and continue acting without the AI constantly controlling it.

For example:

```text
Button:
    When I am pressed, tell AI.
```

The instruction becomes part of the Button's program.

The Button can then monitor its relevant events and act when the required condition occurs.

The AI does not need to remain present.

## 3.4 Finite Selves Work Together

Finite selves can communicate:

```text
Button → AI
Chart → Button
Spreadsheet → Chart
Workspace → Spreadsheet
```

Each self remains its own entity while participating in a larger computation.

This allows a system to be built from many independent selves rather than one large program controlling everything.

## 3.5 The Key Idea

> **A finite self turns a software component from something that is merely acted upon into something that can receive instructions, compute, communicate, and act on its own.**
