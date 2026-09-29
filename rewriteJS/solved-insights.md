# Current Solved Insights

These are the concepts that are currently understood well enough to be treated as foundational decisions rather than open problems.

## 1. Alphabet

### Insight

The alphabet is the vocabulary of the system.

It defines the primitive symbols that can exist in the language.

Examples:

```text
Actors
Actions
Resources
Events
Conditions
...
```

The alphabet itself does not perform computation.

### Current Solution

Define the primitive symbols independently of their implementation.

```text
ALPHABET
  = the things that exist
```

The alphabet is therefore a declarative definition.

---

## 2. Grammar

### Insight

The grammar defines how symbols from the alphabet can be combined into valid structures.

For example:

```text
Actor + Action + Resource
```

can form:

```text
User + Open + File
```

The grammar does not perform the computation either.

### Current Solution

Keep the grammar independent from the alphabet and from execution.

```text
GRAMMAR
  = the rules for valid composition
```

It defines what forms are legal.

---

## 3. Continuous Interface

### Insight

Human language is continuous and unconstrained, while the symbolic system is discrete and structured.

A user may say:

```text
"I want to open the file."
```

while the symbolic Space-Time may contain a node such as:

```text
USER OPEN FILE
```

The natural-language sentence does not need to exactly match the symbolic sentence.

### Current Solution

Use a neural language model such as ModernBERT as a continuous interface over the discrete symbolic structure.

```text
Natural Language
       ↓
ModernBERT
       ↓
Semantic Proximity
       ↓
Space-Time Node
```

The neural layer determines where the incoming language is closest within the symbolic space.

The underlying symbolic structure remains discrete.

---

## 4. Neuro-Symbolic Runtime

### Insight

The system naturally separates into two parts:

```text
NEURAL
continuous interpretation

SYMBOLIC
discrete structure and constraints
```

The neural component handles the ambiguity and richness of human language.

The symbolic component provides the structured world in which valid states, relations, and transitions exist.

### Current Solution

Treat the combination as a runtime:

```text
Language
   ↓
Neural Interpretation
   ↓
Space-Time
   ↓
Symbolic Structure
   ↓
Valid Transition / Operation
```

The neural system interprets.

The symbolic system constrains.

That is the basic neuro-symbolic runtime model.

---

## 5. Hallucination

### Insight

The hallucination problem can be attacked by preventing the model from having to invent the underlying structure.

Instead of asking the model to freely generate the world, define the world first.

```text
Alphabet
   +
Grammar
   ↓
Space-Time
```

The model then maps language into that existing structured world.

### Current Solution

Constrain neural interpretation by the symbolic Space-Time.

Conceptually:

```text
Human Language
      ↓
Neural Interpretation
      ↓
Find Position in Space-Time
      ↓
Existing Symbolic Structure
      ↓
Allowed States / Transitions
```

The core idea is:

> The model should navigate a defined world rather than freely invent the world.

This does not claim that hallucination is mathematically eliminated in every possible system. The current insight is that a persistent symbolic space provides a structural constraint against unconstrained generation.

---

## 6. DFA / Space-Time

### Insight

The original DFA idea evolved into the concept of Space-Time.

The DFA is the discrete machine generated from the system's definitions.

```text
Alphabet
   +
Grammar
   ↓
Algebra
   ↓
Generated DFA
```

That generated DFA is now understood as the system's Space-Time.

The nodes represent structured states or structures in the world, and the transitions represent movement or transformation between them.

### Current Solution

Call the generated DFA:

```text
SPACE-TIME
```

Conceptually:

```text
ALPHABET
"What exists?"

GRAMMAR
"How may it be arranged?"

ALGEBRA
"Operate on those definitions."

        ↓

SPACE-TIME
"The generated structured world."
```

The continuous interface then sits over this Space-Time:

```text
Natural Language
       ↓
Continuous Interface
       ↓
SPACE-TIME
       ↓
Discrete States / Transitions
```

The important distinction is therefore:

```text
DFA = the underlying discrete machine
Space-Time = the richer generated world represented by that machine
```

The continuous interface does not make the DFA itself continuous. It provides a continuous way of entering and locating meaning within the discrete Space-Time.