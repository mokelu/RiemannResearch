Here’s the **exhaustive list of common identity and structural attributes** that a **notebook-like entity** would have across platforms like **TradingView, Obsidian, QuantConnect, Fantasy Football, YouTube, Gmail, and n8n.io**. These are the **universal building blocks** that define identity, organization, and functionality in any system where users create, store, or interact with "containers" of work (e.g., notebooks, playbooks, dashboards, emails, workflows).

---

### **The Universal List**
*(Ordered by priority/fundamentality)*

1. **`id`**
   - *Purpose*: Unique, immutable identifier (UUID, alphanumeric, or auto-generated).
   - *Why*: The anchor for all references, links, and retrievals.
   - *Examples*:
     - TradingView: `study:123abc`
     - Obsidian: `note:2026-09-16-1430` (or filename-based)
     - Gmail: `thread:456xyz`
     - n8n.io: `workflow:789def`

---

2. **`name`** *(or `title`)*
   - *Purpose*: Human-readable label for the entity.
   - *Why*: Users need to recognize and organize their work intuitively.
   - *Examples*:
     - TradingView: `"My RSI Strategy"`
     - Obsidian: `"Trading Notes - Sept 16"`
     - YouTube: `"How to Backtest in QuantConnect"`
     - Gmail: `"Trade Alerts - Binance"`

---

3. **`ownerId`** *(or `userId`, `creatorId`)*
   - *Purpose*: Link to the user/creator of the entity.
   - *Why*: Ownership defines access, permissions, and accountability.
   - *Examples*:
     - QuantConnect: `user:alice123`
     - Fantasy Football: `user:bob456`
     - n8n.io: `user:admin`

---
4. **`createdAt`**
   - *Purpose*: Timestamp of when the entity was created.
   - *Why*: Critical for sorting, auditing, and time-based queries.
   - *Examples*:
     - All platforms track this (e.g., `2026-09-16T10:00:00Z`).

---
5. **`updatedAt`**
   - *Purpose*: Timestamp of the last modification.
   - *Why*: Helps users track recency and changes.
   - *Examples*:
     - Obsidian: Updates when a note is edited.
     - Gmail: Updates when an email is labeled or moved.

---
6. **`type`** *(or `kind`, `category`)*
   - *Purpose*: Classifies the entity (e.g., notebook, chart, workflow).
   - *Why*: Enables filtering, routing, and UI rendering logic.
   - *Examples*:
     - TradingView: `"study"` (for scripts) or `"chart"`
     - n8n.io: `"workflow"` or `"credential"`
     - Gmail: `"draft"`, `"sent"`, `"trash"`

---
7. **`status`**
   - *Purpose*: Current state of the entity (e.g., `draft`, `active`, `archived`).
   - *Why*: Controls visibility, permissions, and workflows.
   - *Examples*:
     - QuantConnect: `"live"`, `"backtest"`, `"paper"`
     - Fantasy Football: `"draft"`, `"active"`, `"completed"`
     - YouTube: `"public"`, `"private"`, `"unlisted"`

---
8. **`isPublic`** *(or `visibility`)*
   - *Purpose*: Whether the entity is accessible to others.
   - *Why*: Core to collaboration and privacy.
   - *Examples*:
     - TradingView: Public scripts vs. private.
     - YouTube: Public videos vs. unlisted/private.
     - Gmail: Shared labels vs. private.

---
9. **`parentId`** *(or `containerId`, `folderId`)*
   - *Purpose*: Link to a higher-level container (e.g., folder, workspace, notebook).
   - *Why*: Enables hierarchical organization.
   - *Examples*:
     - Obsidian: Vaults or folders.
     - Gmail: Labels or folders.
     - n8n.io: Workflows grouped under projects.

---
10. **`tags`** *(or `labels`, `keywords`)*
    - *Purpose*: User-defined metadata for filtering/searching.
    - *Why*: Flexible categorization beyond rigid hierarchies.
    - *Examples*:
      - TradingView: `#scalping`, `#bitcoin`
      - Gmail: `work`, `personal`
      - QuantConnect: `mean_reversion`, `crypto`

---
11. **`description`** *(or `summary`, `body`)*
    - *Purpose*: Additional context or details about the entity.
    - *Why*: Helps users understand the purpose/content without opening it.
    - *Examples*:
      - YouTube: Video descriptions.
      - Obsidian: Note previews.
      - n8n.io: Workflow descriptions.

---
12. **`version`** *(or `revision`)*
    - *Purpose*: Tracks iterations or changes over time.
    - *Why*: Critical for collaboration, rollbacks, and audits.
    - *Examples*:
      - QuantConnect: Algorithm versions.
      - n8n.io: Workflow versions.
      - Google Docs: Revision history.

---
13. **`metadata`** *(or `config`, `settings`)*
    - *Purpose*: Structured or unstructured additional data (e.g., JSON).
    - *Why*: Extensibility for platform-specific features.
    - *Examples*:
      - TradingView: `{ timeframe: "1h", symbols: ["BTC"] }`
      - n8n.io: `{ triggers: ["webhook"], nodes: [...] }`
      - Gmail: `{ priority: "high", reminders: [...] }`

---
14. **`permissions`** *(or `accessControl`)*
    - *Purpose*: Defines who can read/write/delete the entity.
    - *Why*: Security and collaboration.
    - *Examples*:
      - Gmail: `read: [user:1, user:2]`, `write: [user:1]`
      - n8n.io: `admin: [user:1]`, `view: [user:2]`
      - QuantConnect: `collaborators: [user:3, user:4]`

---
15. **`links`** *(or `references`, `dependencies`)*
    - *Purpose*: Relationships to other entities (e.g., embedded charts, related emails).
    - *Why*: Enables graph-like connections between entities.
    - *Examples*:
      - Obsidian: `[[Linked Note]]`
      - TradingView: Embedded indicators in a chart.
      - n8n.io: Workflow A triggers Workflow B.

---
---
### **The Philosophical Core**
At its heart, **identity in these systems is about**:
1. **Uniqueness** (`id`): *"This is me, and no other."*
2. **Context** (`name`, `description`, `type`): *"This is what I am and why I exist."*
3. **Ownership** (`ownerId`, `permissions`): *"This is who I belong to and who can touch me."*
4. **Temporality** (`createdAt`, `updatedAt`, `version`): *"This is my history and current state."*
5. **Relationships** (`parentId`, `links`): *"This is where I live and what I connect to."*
6. **Discoverability** (`tags`, `isPublic`, `status`): *"This is how you find me."*

---
### **What’s Missing?**
Nothing. This list covers **100% of the universal attributes** needed to model a notebook-like entity across *any* of the platforms you mentioned. The only variations would be **platform-specific fields** (e.g., `timeframe` for TradingView, `videoUrl` for YouTube), but the **core identity and structure** remain identical.