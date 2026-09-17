You're right to look outward instead of hand-rolling everything. The trick is to match each **concern** to the right category of tool — authorization libraries solve a fundamentally different problem than state machines, which solve a different problem than CRDTs.

Here's the exhaustive map, organized by concern.

---

## 1. Authorization & Ownership (the OpenFGA family)

This is where you were looking, and the ecosystem is rich. The key distinction: **ReBAC** (relationship-based, like Google Zanzibar) vs **RBAC/ABAC** (role/attribute-based). For a notebook platform where users own notebooks, share them, and collaborate, ReBAC is the right shape — ownership *is* a relationship.

| Library | Model | Runs where | TypeScript? |
|---|---|---|---|
| **OpenFGA** | ReBAC (Zanzibar) | Separate service | Yes, official SDK |
| **Permify** | ReBAC + RBAC + ABAC | Separate service | Yes, `permify-javascript` |
| **Oso** | Polar policy language (RBAC/ReBAC) | Embedded library | Yes, `oso` for Node |
| **Cerbos** | RBAC + ABAC, deny-by-default | Separate policy engine | Yes |
| **Casbin** | ACL / RBAC / ABAC | Embedded library | Yes, `casbin` |

**OpenFGA** is the canonical choice. You define object types (`user`, `notebook`, `artifact`) and relations (`owner`, `viewer`, `editor`), then check `user:alice can_view notebook:btc`. It stores every relationship as a tuple in a SQL database and exposes a declarative TypeScript-like namespace language for defining object types and relations. It's inspired by Google's Zanzibar paper, which is what Google uses internally for exactly this kind of hierarchical ownership.

**Permify** is the closest open-source alternative — also Zanzibar-inspired, also service-based, but with a DSL compatible with RBAC, ReBAC, *and* ABAC. If you want one authorization system that grows from "user owns notebook" to "user can edit artifact if they're a member of a workspace and the artifact isn't archived," Permify handles that transition more gracefully.

**Oso** is different: it's an *embedded* library, not a service. You install it, define policies in a declarative language called Polar, and call `oso.authorize(actor, action, resource)` directly in your app code. No separate infrastructure. The tradeoff: you're running authorization logic in-process, which is simpler but less scalable. For a single-user-per-notebook model in v1, Oso is overkill — but it's worth knowing because it's the "no extra service" option.

**Casbin** is the veteran. It supports ACL, RBAC, and ABAC in one library. It's mature and widely used, but the configuration files are notoriously fiddly, and the TypeScript port (`@casbinjs/core`) is a wrapper around the core Go implementation, which means you're always slightly behind.

**My recommendation for your case:** start with **OpenFGA** if you're willing to run a service. It's the most established, the most documented, and the model (tuples + relations) maps perfectly onto "user owns notebook" and "user can view artifact in notebook." If you want zero infrastructure, **CASL** (not Casbin) is the TypeScript-native alternative — it's isomorphic, incrementally adoptable, and designed for exactly the "simple claim-based → full ABAC" spectrum you'd grow through.

---

## 2. Lifecycle & Workflow State (for backtest runs, not for notebooks)

Notebooks don't need a state machine. They have a simple lifecycle: active → archived → deleted. A `status` union type handles it. But the *things inside* notebooks — backtest runs, agent tasks, data ingestion jobs — absolutely need lifecycle management. That's where workflow engines come in.

**XState** is the standard for finite state machines and statecharts in TypeScript. It lets you model "a backtest run is either queued, running, succeeded, or failed, and only transitions in these specific ways" as a declarative machine. Zero dependencies. If you ever find yourself writing `if (status === 'running' && !cancelled)` more than twice, reach for XState.

**Temporal** is the heavyweight. It's a durable execution engine — workflows survive process crashes, network partitions, and restarts. For a trading platform where a backtest might run for 45 seconds or 45 minutes and *must* complete, Temporal is the right abstraction. The TypeScript SDK lets you write workflows as plain functions and activity calls, and Temporal handles retries, timeouts, and persistence. This is what you'd use when "the agent kicked off a sweep of 200 parameter combinations and three of them failed" becomes a real operational problem.

**Immer** isn't a workflow tool, but it solves the *update* side of lifecycle: writing immutable state transitions without spread-operator hell. If you're updating a nested notebook record with artifacts inside conversations, Immer lets you write `draft.artifacts[2].name = 'new'` and produces the correct immutable result. Small library, disproportionate payoff.

---

## 3. Presentation State (the center panel's three views)

This is **TanStack Query** territory, with **Zustand** filling the gaps.

**TanStack Query** is for *server state* — data that lives in SurrealDB and needs caching, refetching, and synchronization. When the user opens a notebook, TanStack Query fetches the notebook, its artifacts, and its conversations, caches them, and revalidates when the user navigates away and back. It's explicitly *not* a replacement for client state managers like Zustand — it's the layer between your database and your UI.

**Zustand** is for *client state* — which view is active (chart/markdown/spreadsheet), which notebook is selected, whether the left panel is collapsed. It's lightweight, doesn't wrap your app in providers, and pairs with TypeScript for strongly typed stores with autocomplete and compile-time safety.

The pattern: **TanStack Query for "what's in the database," Zustand for "what's on screen."** Don't mix them. A chart spec lives in SurrealDB (TanStack Query); whether the user has the chart *maximized* lives in Zustand.

---

## 4. Validation & Schema (the runtime safety net)

**Zod** is the de facto standard. It's a TypeScript-first schema validation library with static type inference — you define a schema once, and Zod gives you both the runtime validator *and* the TypeScript type. For your notebook, the value isn't validating `name: string` — SurrealDB already does that. The value is validating the **artifact spec** at the boundary: when the agent produces a chart spec, Zod verifies it matches `ChartSpec` before it's written to the database. When the frontend receives a notebook from the API, Zod verifies it before rendering.

The integration pattern: define Zod schemas for artifact specs, derive TypeScript types with `z.infer`, and validate on *write* (agent → DB) and *read* (DB → UI). SurrealDB's schema handles the base record; Zod handles the polymorphic `spec` object that SurrealDB can't type.

---

## 5. Collaboration & Real-Time (if notebooks become shared)

**Yjs** and **Automerge** are the two CRDT libraries that matter. They solve the "two users editing the same notebook at the same time" problem without locking or manual merge. Yjs is the faster, more widely adopted one — it powers collaborative editors in many production apps and has built-in support for popular text editors. Automerge is more general-purpose (JSON-like data structures) and has a more principled offline-first design.

For your case, this is probably **not v1**. Single-user notebooks don't need CRDTs. But it's worth knowing the boundary: the moment you add "share this notebook with a collaborator," you're in CRDT territory, and retrofitting collaboration into a non-CRDT data model is painful. If sharing is on the roadmap within 6 months, design the artifact `spec` fields as CRDT-compatible from the start — plain JSON objects that can later be wrapped.

---

## 6. UI Components (the three panels)

**Radix UI** + **shadcn/ui** is the standard stack. Radix provides unstyled, accessible primitives (dialog, dropdown, tooltip, tabs) — the behavior without the visuals. shadcn/ui wraps Radix in styled components built with Tailwind CSS, and it's not a library you install via npm — it's a collection of components you *copy into your project* and own. That's the key property: you're not dependent on a package maintainer's styling decisions; you own the code.

For your center panel's view switcher (chart/markdown/spreadsheet/kanban), Radix Tabs gives you the accessible primitive; you style it. For the left panel's tree, Radix has no tree primitive — you'd build it with Collapsible or use a dedicated tree library. For the right panel's chat, you're building custom anyway, but Radix gives you ScrollArea and Popover.

**Recharts** is the standard React charting library for the center panel. Built on D3, declarative React components, works with TypeScript. It's not a trading-chart library (no built-in candlesticks), but for equity curves, drawdowns, and metrics visualizations, it's the right default. For candlestick charts specifically, **lightweight-charts** (TradingView's open-source library) is the better choice.

---

## 7. ORM / Database Layer (where you already landed)

You've already decided: **raw `surrealdb` SDK, no surqlize**. That's correct for now. But if you ever reconsider, the alternatives are **Drizzle ORM** (lightweight, TypeScript-first, but for SQL databases — not SurrealDB) and **Prisma** (powerful, but its SurrealDB support is nonexistent). Neither works with SurrealDB. The SurrealDB-specific ORMs (`surqlize`, `dali-orm`, `SurrealORM`) are all early-stage and thin. Sticking with the official SDK is the right call.

---

## The one-sentence summary

**OpenFGA** for authorization, **XState** for backtest lifecycle, **TanStack Query + Zustand** for presentation state, **Zod** for artifact spec validation, **Radix + shadcn** for UI, **Recharts/lightweight-charts** for charts, and **raw SurrealDB SDK** for the database. Everything else — Yjs, Temporal, Immer — is a day-30 concern, not a day-one concern.