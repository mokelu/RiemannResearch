Here's the exhaustive list, drawn from what all seven of those platforms actually do — not what a database textbook says. I've tiered it so you can see what's truly universal versus what most systems carry.

## The irreducible core — every one of them has these

**1. ID**
The immutable handle. Immutable is the whole point. TradingView layout IDs, YouTube video IDs, Gmail thread IDs, n8n workflow IDs, Obsidian's file path (which acts as the ID in a vault). It never changes even when everything else does.

**2. Name**
The human label. "My BTC Strategy." A YouTube video has a title, a Gmail label has a name, an n8n workflow has a name, a TradingView layout has a name. There is no system where the user creates something and cannot name it. Even Obsidian defaults to "Untitled."

**3. Owner**
Who it belongs to. Gmail → account. YouTube → channel. TradingView → user. n8n → workspace/user. Fantasy football → manager. Even Obsidian, which is local-first, has the vault owner implicitly. Nothing user-created is ownerless.

**4. createdAt**
When it came into being. Universal. Gmail, YouTube, Obsidian, n8n, TradingView — every single one timestamps creation.

**5. updatedAt**
When it last changed. Universal in the same set. YouTube tracks last edit, Gmail tracks thread update, n8n tracks workflow save, TradingView tracks script revision.

**6. Kind / Type**
What *kind* of thing this is. This is the one most people forget, and it's in every single platform. YouTube has video / short / playlist / channel. Gmail has thread / label / draft / message. n8n has workflow / execution / credential. TradingView has chart / script / idea / alert. Obsidian has note / canvas / folder. QuantConnect has project / file / backtest. Fantasy football has league / team / lineup / player. The moment a system hosts more than one thing, it needs a discriminator.

**7. Status**
Lifecycle state. Gmail has draft / sent / archived / trashed. YouTube has draft / processing / published / unlisted. n8n has active / inactive / error. TradingView has draft / published. QuantConnect has queued / running / completed / failed. Obsidian's closest analogue is file state (modified / synced). Every system has some notion of where the object is in its lifecycle.

## The next ring — most of them carry these

**8. Visibility / Access**
Who can see it. Private / public / unlisted / shared. YouTube, TradingView, Gmail (shared labels), n8n (team workspaces), fantasy football (public vs private league). Obsidian is the exception — everything is local — but the moment you add sync or publish, visibility appears.

**9. Parent / Container**
What holds it. YouTube: video → playlist → channel. Gmail: message → thread → label. n8n: workflow → project → workspace. Obsidian: note → folder → vault. Fantasy football: player → team → league. Nothing in these systems is truly rootless; there's always a containment tree, even if it's shallow.

**10. Ordering / Position**
Where it sits among siblings. YouTube playlist position, Gmail label order, Obsidian folder order, fantasy football lineup slot. Any container with children needs a way to say "this one comes before that one."

**11. Content / Payload**
The actual thing. The workflow definition, the video file, the email body, the note markdown, the chart spec. Even if it's a pointer to storage, the object references its body.

**12. Version / Revision**
History. YouTube edit history, Gmail draft revisions, n8n workflow versions, QuantConnect backtest versions, Obsidian file history, TradingView script versions. Every platform eventually grows a version log, even if only to support undo.

## The outer ring — common, but not strictly universal

**13. Description**
Free-text longer than the name. YouTube has description. Gmail has none (the body is the description). n8n has notes. TradingView ideas have descriptions. Not universal, but present in most.

**14. Tags / Labels**
Cross-cutting organization. YouTube tags, Gmail labels, Obsidian tags, TradingView symbols/timeframe tags, n8n tags. Fantasy football is the odd one — it uses positions instead. Universal in spirit if not in name.

**15. Pinned / Starred / Favorited**
The user's way of saying "this one matters more." Gmail star, YouTube "save to Watch Later," n8n favorite, Obsidian starred notes, TradingView favorites. Every platform with a list eventually grows a pin.

**16. DeletedAt**
Soft delete. Gmail Trash, YouTube removed-but-recoverable, n8n deleted workflows restorable. Only Obsidian lacks it cleanly, because the filesystem is the source of truth. But any server-backed system adds it.

**17. LastActivityAt / LastAccessedAt**
The field that powers "sort by recent." Gmail thread recency, YouTube watch history, n8n last run, TradingView last opened. Different from `updatedAt` — this one changes when something *happens around* the object, not just to it.

## The one-sentence summary of the whole list

Every user-created object in every one of those platforms answers the same seven questions — *who are you* (ID), *what are you called* (name), *whose are you* (owner), *when did you appear* (createdAt), *when did you last change* (updatedAt), *what kind of thing are you* (kind), *what state are you in* (status) — and then layers on five more as it matures: *who can see you* (visibility), *what holds you* (parent), *where do you sit* (ordering), *what's inside you* (content), *how have you changed* (version).

The first seven are non-negotiable. If your `notebook` table has those seven, you're structurally in the same family as Gmail, YouTube, Obsidian, and n8n. The next five are how you know you're building a real product and not a demo.