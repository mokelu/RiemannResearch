# Chapter 1 — The Problem

Modern software is built around a simple assumption: the programmer controls the machine. The programmer describes data structures, functions, classes, state transitions, APIs, and execution procedures. The computer then follows those instructions.

This model has been extraordinarily successful. Yet it creates a fundamental distance between what a person wants and what the computer is instructed to do.

A person says:

> “When the button is pressed, tell me.”

A conventional programming language must translate this into implementation:

* identify the button;
* register an event listener;
* detect the press;
* maintain whatever state is necessary;
* invoke another function;
* communicate the result.

The person did not think in any of these terms. They simply described a desired relationship between things in a world.

Intent programming begins with a simple pitch: Instead of requiring the programmer to translate the world or the sentence or an idea into machine-oriented abstractions, we can construct a computational world in which the things being discussed are themselves computational participants.

The button is not merely a DOM element.
The chart is not merely an object.
The spreadsheet is not merely a data structure.
They can be represented as **computational selves**.

This changes the nature of programming.

---

## 1.2 From Programming Machines to Programming a World

Traditional programming can be understood as:

> **Tell the machine how to perform a computation.**

Intent programming proposes:

> **Tell the computational world what you want to happen.**

Consider:

```text
When the button is pressed, tell me.
```

In conventional programming, the button is passive. Some external program watches the button and decides what should happen.

In an intent-programming system, the button can possess a **finite self**.

The button can receive an instruction.

It can observe its own relevant state.

It can communicate with other selves.

It can react when the required condition occurs.

The distinction is subtle but important.

The system is no longer organized exclusively around a central program that observes passive objects.

Instead, the world contains computational entities capable of participating in computation.

---

## 1.3 Intent as First-Person Programming

We define **intent programming** as:

> **First-person programming in which software components are treated as living computational selves, allowing a person to express what they want the world to become while the system determines and executes the necessary actions.**

The term *first-person* is important.

Consider:

```text
I want to edit the spreadsheet.
```

The traditional interpretation treats *spreadsheet* as an object that some external program must manipulate.

Intent programming instead asks:

> What if the spreadsheet itself is a computational self?

The sentence can therefore become a relationship between participants:

```text
User → Spreadsheet
        edit
```

More complex intentions can involve many participants:

```text
Button
Chart
Workspace
AI
```

The intent becomes a coordinated activity among these computational selves.

This is why intent programming naturally resembles a **play, drama, or symphony**.

There are actors.

There are actions.

There are events.

There are relationships.

There is a world in which these things occur.

---

## 1.4 Computational Selves

A computational self is an entity that possesses its own computational identity within the world.

A finite self may contain:

```text
FINITE SELF
│
├── Algebra
├── CEP
├── AI
└── Coordination
```

The algebraic component provides deterministic state and transition behavior.

The Complex Event Processing component provides event and temporal reasoning.

The AI component provides general reasoning and interpretation.

The coordination layer allows the self to communicate and cooperate with other selves.

The result is fundamentally different from an ordinary object.

An ordinary object is primarily something that a program acts upon.

A computational self is something that **participates in the program**.

---

## 1.5 The World as a Computational Environment

Once components become computational selves, the software system itself can be understood as a **world**.

That world contains:

```text
Button Self
Chart Self
Spreadsheet Self
Workspace Self
AI Self
```

Each self has its own state and capabilities.

The selves can communicate:

```text
Button → AI
Chart → Workspace
Spreadsheet → User
```

They can respond to events and participate in larger sequences of activity.

Programming therefore becomes less like constructing a single procedure and more like **constructing a world whose inhabitants can act**.

This provides a natural foundation for event-driven computation.

---

## 1.6 The Central Question

This raises the central question of this work:

> **What would a programming system look like if the components of the software world were themselves computational actors capable of receiving intent and acting autonomously?**

The question is not merely how to make natural language control existing software.

It is deeper.

It asks whether the fundamental unit of software can move from:

```text
object
```

to:

```text
self
```

and from:

```text
program
```

to:

```text
symphony of selves
```

The remainder of this work develops that model.

It introduces **Symphony** as the structured representation of intent, **Maxi (MaximalSelf)** as the coordinating computational self, and the **Linguistic Event-Driven Engine (LEDEN)** as the event-driven environment in which computational selves can receive instructions, communicate, respond to events, and act.

The objective is not to replace existing computational models.

It is to place them inside a new model of programming:

> **A world in which the things we program are capable of participating in their own computation.**
