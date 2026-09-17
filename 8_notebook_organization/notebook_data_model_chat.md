Yes. Looking across TradingView, Obsidian, QuantConnect, fantasy football apps, YouTube, Gmail, and n8n, the common structure is clearer when we stop thinking about their specific product names and ask:

“What does any persistent user-created container need to exist as a thing in the system?”

TradingView layouts have a name and persistent saved configuration; QuantConnect projects have descriptions, files, results, settings and ownership/access; YouTube playlists have title, description, visibility and ordering; Gmail uses labels and organization state; n8n has workflows/projects with ownership and sharing/access; Obsidian organizes persistent notes within a vault. ([TradingView][1])

So the exhaustive common list I would start from is:

1. ID
   The immutable identity of the thing.

3. Name
   What the user calls it.

4. Description
   What the thing is about.

5. Created at
   When it came into existence.

===== ABOVE is IDENTITY

2. Owner
   Who this thing belongs to.

6. Updated at
   When it was last changed.

7. Deleted / archived state
   Whether it still exists as an active thing.



8. Visibility
   Whether it is private, shared, or public.

9. Permissions / access
   Who else can view, edit, run, or manage it.

10. Children / contents
    The things contained inside it.

11. Ordering / layout
    How those contents are arranged or presented.

12. Labels / tags
    Additional ways to classify or find it.

13. Status
    Its current lifecycle state, where the application needs one.

14. Metadata
    Additional application-defined information that doesn't justify becoming a first-class field.

15. Activity / history
    What has happened to it over time, where the application needs persistent history.

The first six are the strongest universal core:

```text
ID
Owner
Name
Description
CreatedAt
UpdatedAt
```

Then the next layer is about the thing's relationship to the world:

```text
Deleted/Archived
Visibility
Permissions
Contents
Ordering
Labels
Status
Metadata
History
```

And this is important for what you're building: not every one of those necessarily belongs as a literal column on the `notebook` table. Some are properties of the notebook itself, while others are separate relationships or records.

That distinction is probably the next thing worth working through.

[1]: https://www.tradingview.com/support/solutions/43000746975-tradingview-layouts-a-quick-guide/?utm_source=chatgpt.com "TradingView layouts: a quick guide — TradingView"
