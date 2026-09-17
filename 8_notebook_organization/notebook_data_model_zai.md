Let me first translate "notebook" into each platform's native tongue, because the word differs but the *thing* keeps reappearing:

- **TradingView** → the chart **Layout** (named workspace of charts, drawings, watchlists)
- **Obsidian** → the **Note** (or folder of notes)
- **QuantConnect** → the **Project** (holds algorithms, backtests, research notebooks)
- **Fantasy football** → the **League** (holds teams, matchups, transactions, chat)
- **YouTube** → the **Playlist**
- **Gmail** → the **Label**
- **n8n** → the **Workflow**

Seven products that have never spoken to each other — trading, note-taking, quant research, fantasy sports, video, mail, automation. Now the intersection. This is the list every one of them has, exhaustively:

1. **id** — the immutable anchor. Minted once, never edited, the address everything else points at. (The thing we just settled.)
2. **name** — the human label. Changeable at will, and *never* load-bearing for addressing. Identity and label are separate fields; that separation is the whole trick.
3. **owner** — who it belongs to. In single-player tools this degenerates to a constant (Obsidian's owner is just "you") but it's still modeled — your file permissions *are* the owner field.
4. **createdAt** — when it entered the world. Every platform mints this at creation and never revisits it.
5. **updatedAt** — when it was last touched. The "aliveness" signal every list sorts by.
6. **visibility** — who may see it. Even where the only answer is "me," the question exists — public/unlisted/private on YouTube, private/public on TradingView and QC, file permissions in Obsidian.
7. **its members** — the thing it exists to hold. Notably this never lives *on* the container's row; members point back at it (playlist→videos via the video, label→messages via the message, project→files) or are embedded in its body (markdown text, workflow nodes). Containment by reference or containment by content — one of the two, always.
8. **deletion** — the way out. And almost always two-stage: trash/archive first, hard delete after. Gmail's Trash, Obsidian's trash, n8n's archive.

That's it. Eight fields. Here's the proof, all seven projections side by side:

| # | TradingView | Obsidian | QuantConnect | Fantasy league | YouTube | Gmail | n8n |
|---|---|---|---|---|---|---|---|
| 1 id | layoutId | file path | projectId | leagueId | playlistId | labelId | workflowId |
| 2 name | layout name | filename | project name | league name | title | label name | workflow name |
| 3 owner | your account | you (implicit) | creator + collaborators | commissioner | channel | account | workspace user |
| 4 created | created | file created | created | season start | published | *(hidden)* | created |
| 5 updated | last saved | modified | last modified | last activity | last updated | *(hidden)* | last modified |
| 6 visibility | private / public | file perms | private / public | private / public | private / unlisted / public | account-only | project sharing |
| 7 members | charts, drawings | note body, folder | files, backtests | teams, matchups | ordered videos | messages | nodes, creds |
| 8 deletion | delete | trash | delete | delete at season end | delete | trash | archive / delete |

Now the half that's just as informative — what **failed** the universality test, and which citizen killed it:

- **description** — killed by Obsidian (the note *is* its own description) and TradingView (layouts have none). It shows up on YouTube/QC/n8n only where containers are shown to strangers. It's a capability that arrives with an audience.
- **color / icon / thumbnail** — Gmail labels have colors; nobody else on the container itself. And YouTube's thumbnail is *derived* from the first video, not authored — a rendering concern wearing a column costume.
- **tags** — n8n and Obsidian have them; QC and YouTube don't; and Gmail's labels already *are* tags (same field counting twice). A tagging system bolted onto a thing that already sits inside a container rarely earns its keep — same conclusion we reached with `theme`.
- **status (active/inactive)** — n8n has it *because a workflow runs*. YouTube playlists and Gmail labels don't execute, so they have no status. Status exists when the container executes — a capability, not identity.
- **sortOrder** — only the playlist has it, because there sequence *is* the content. Everywhere else it's derivable.
- **lastOpenedAt** — TradingView effectively has it (recents); most don't store it. Notice: that one was *our* addition, and it's not in the intersection. Which is exactly the right way to read this list:

**The intersection is what a container *is*. Everything beyond it is what your product *believes*.** Our trader notebook is precisely these eight fields — id, name, owner, createdAt, updatedAt, visibility, members, deletion — plus trader-beliefs layered on top: `symbols`, `horizon`, `instructions`, the resume pointers, the embedding. The universal skeleton proves the schema conversation was honest: document + relational fields are the species; everything domain-specific is capability arriving on request, never in advance.

Two footnotes worth savoring:

**Obsidian is the cautionary tale for #1 and #2.** Its identity is the file path — which means name *is* identity, the exact conflation we just ruled out. The consequence is famous: rename a note and every backlink breaks, so the app ships a "update links" patcher to perform surgery after the fact. That's what happens when field 2 is asked to do field 1's job.

**Gmail is the counter-tale for #4 and #5.** Labels expose no timestamps at all in the API — the field is suppressed, not absent. Proof that in single-player tools, universal fields can hide as constants rather than disappear.