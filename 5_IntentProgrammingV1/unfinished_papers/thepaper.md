**Riemann 1: A General Purpose Framework for Intent Programming**

### Core thesis

> **Intent programming is first-person programming in which computational components are treated as finite selves capable of receiving intent, communicating, responding to events, and acting within a shared computational world.**

Then the paper introduces the pieces in roughly this order:

1. **The Problem** — traditional programming addresses machines through implementation details rather than expressing desired changes to a world.

2. **Intent Programming** — expressing desired outcomes through the perspective of the entities involved.

3. **Finite Selves** — computational entities that possess state, capabilities, coordination instructions, and access to algebraic, event-processing, and AI computation.

4. **Symphony** — the structured representation of intent that coordinates multiple selves.

5. **Maxi (MaximalSelf)** — the execution/coordinating self that interprets Symphony and distributes work among the world.

6. **Linguistic Event-Driven Engine (LEDEN)** — the event-driven substrate allowing linguistic instructions to become reactive behavior.

7. **Universal Computational Substrate** — why a finite self can participate in arbitrary Symphony when the required computational capability is available.

8. **The World** — selves, state, facts, events, and external interfaces such as Vue/React/Angular.

9. **Example** — something very simple:

```text
When Button is pressed
within 10 seconds
after Chart crossed SMA
while Workspace is editing
tell AI.
```

and show how that becomes a Symphony, gets decomposed by Maxi, and ultimately causes real-world state transitions.

10. **Riemann 1** — the prototype implementation demonstrating the model.
