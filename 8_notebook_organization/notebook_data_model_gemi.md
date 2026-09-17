If all these platforms—TradingView, Obsidian, QuantConnect, Fantasy Football, YouTube, Gmail, and n8n.io—were to implement the concept of a **Notebook** (a workspace container that holds active context, execution state, and child artifacts), their core domain models would align on the exact same structural capabilities.

Beyond the immutable **ID**, every one of these platforms would require the following core attributes in their container definition:

---

1. **ID**
The simple, immutable identifier (UUID, record ID, or hash) that anchors the record’s existence across graph relations and persistence layers.
2. **Title / Name**
The human-readable label identifying the workspace (e.g., TradingView chart layout name, Obsidian vault file name, Gmail thread subject, n8n workflow name).
3. **Owner Reference (Ownership)**
The direct relational pointer to the actor (User ID, Team ID, or Account ID) who created, owns, or holds administrative authority over the workspace.
4. **Creation Timestamp (`createdAt`)**
The immutable temporal anchor marking exactly when the container was instantiated.
5. **Last Modified Timestamp (`updatedAt`)**
The mutable temporal indicator tracking state changes, edits, or activity within the container.
6. **State / Lifecycle Status**
The operational status of the container (e.g., `draft` vs `published` on YouTube, `active` vs `inactive` in n8n, `active` vs `archived` in Gmail/Obsidian).
7. **Containment Pointer / Manifest**
The underlying reference list or edge mapping that tracks which sub-artifacts belong inside this container (e.g., TradingView indicators/drawings, QuantConnect strategy scripts, n8n nodes, Gmail message threads).
8. **Active State / Layout Configuration**
The UI/runtime snapshot indicating what the user was looking at or executing when they last left (e.g., open file tab in Obsidian, selected view in Fantasy Football, active viewport in TradingView).
9. **Visibility / Access Scope**
The permission boundaries governing who can view or execute the container (e.g., `private`, `shared`, `public` across YouTube videos, Gmail threads, or QuantConnect algorithms).
10. **Contextual Metadata / Tags**
Key-value pairs or tags used to categorize, filter, or index the container within the broader platform ecosystem.
11. **Soft-Delete Flag / Archival State**
A boolean or timestamp allowing the container to be hidden or retired without breaking historical references, logs, or dependent execution streams.
12. **Vector / Semantic Embedding (Modern AI Context)**
A mathematical vector representation of the workspace summary, allowing AI assistants across all these systems to perform instant similarity searches over past research, emails, scripts, or workflows.