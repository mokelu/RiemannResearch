Yes. I think you are actually correcting the notebook rather than breaking it.

The thing that was confusing us is that we were mixing four different things:

```text id="9p7w5c"
1. Block type
2. Block instance
3. Source data / files
4. Views
```

The clean model is:

```text id="m0g2kp"
NOTEBOOK
│
├── Block instance
├── Block instance
├── Block instance
└── Block instance
```

But each block instance has a type:

```text id="r5d2tx"
Block Type
 ├── Chart      → contract
 ├── Document   → contract
 ├── Markdown   → contract
 ├── Code       → contract
 ├── Sheet      → contract
 ├── Calendar   → contract
 ├── Board      → contract
 └── ...
```

So `Chart` is not the data. It is a contract saying, roughly, “give me data that satisfies these requirements and I know how to render it.”

Then:

```text id="7k3e8w"
Block instance
    ↓
references data
    ↓
satisfies Chart contract
    ↓
renders Chart
```

That immediately solves your file problem.

A user's uploaded `research.md` does not have to become a giant collection of tagged blocks the moment they upload it. It can simply exist as source material. Later, the system can parse or extract useful structure from it when needed. Mixed Markdown/code/rubbish is therefore not a failure of the notebook; it is simply an input that hasn't yet been converted into structured Riemann data.

So I would actually remove Files from the notebook's structural hierarchy:

```text id="u2s8ce"
Notebook
│
├── Blocks
│   ├── Chart
│   ├── Note
│   ├── Sheet
│   └── Board
│
└── Sources
    ├── CSV
    ├── JSON
    ├── Markdown
    ├── PDF
    └── whatever the user uploaded
```

But `Sources` doesn't necessarily have to be visible in the left sidebar. It can be accessed through the notebook's context, center panel, or AI conversation.

The same goes for conversations. I increasingly think conversations are not really notebook objects either. They are interaction sessions with the notebook or with a selected block.

That gives you something much cleaner:

```text id="j4zq2k"
Notebook
      │
      ├───────────────┐
      ↓               ↓
   Blocks           Sources
      │
      ↓
  contracts
      │
      ↓
  views / lenses
```

And now your canvas idea makes more sense.

The canvas is not the notebook itself.

The canvas is one way of arranging the notebook's blocks spatially:

```text id="3k0f6n"
             Canvas View

      ┌───────────┐
      │ Document  │
      └─────┬─────┘
            │
            ↓
      ┌───────────┐
      │   Chart   │
      └─────┬─────┘
            │
            ↓
      ┌───────────┐
      │  Sheet    │
      └───────────┘
```

And now your question about connections becomes very important.

I would not make blocks connect merely because they are blocks.

A connection should mean something:

```text
Document
   │
   │ produces / filters / supplies
   ↓
Chart
```

or:

```text
Markdown
   ↓
Decision / Rule
   ↓
Calendar
```

or:

```text
Sheet
   ↓
Chart
```

That is where ZEN becomes interesting.

ZEN doesn't need to be the foundation of the notebook. It can become one of the things that determines the relationship between blocks.

For example:

```text id="e8q2qn"
DATA
 ↓
Decision Table
 ↓
which rows qualify?
 ↓
Chart contract
 ↓
Chart
```

So the graph is not “connect everything like n8n.”

It is:

> blocks can have meaningful relationships, and those relationships can be computed.

That is much closer to the thing you are describing.

And I think your view list should also be simplified. I would not make `Document`, `Code`, `Chart`, `Markdown` all compete as global notebook views. Those are mostly block types/renderers.

The notebook-level views are more like:

```text id="3bd4pd"
Canvas
List
Table
Timeline
Graph
Gallery
```

Then inside a block, its own contract determines how it renders.

So you get:

```text id="z1j6sm"
Notebook
   │
   └── Canvas View
         │
         ├── Chart Block
         ├── Document Block
         ├── Sheet Block
         └── Calendar Block
```

That feels much more coherent to me.

And yes, this means the notebook is no longer “a place containing chats and artifacts.”

It is becoming:

> A persistent composition of blocks, contracts, relationships and views.

That is a significantly deeper object than the original notebook UI we started with.
