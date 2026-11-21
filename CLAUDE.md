# GrappleWiki: notes for Claude

## Two home tables: keep them in sync

The home page has two tables, switched with the **Simplified / Full** toggle:

- `layout` in `wiki.json`: the **full** table (every position).
- `simpleLayout` in `wiki.json`: the **simplified** table (a hand-picked subset of positions).

**Every change must be applied to both tables.** Whenever you add, rename, merge, move, re-order or remove a position, update `layout` and `simpleLayout` together:

- Renamed or merged page id: replace the old id in both lists, and add an entry to `aliases`.
- Deleted position: remove it from both lists.
- New or moved position: put it in the full table; also put it in the simplified table if it is one of the simplified positions or replaces one. Ask the user if it isn't clear whether it belongs in the simplified table.
- Re-ordering or re-grouping (e.g. top/bottom pairs, standing/guard/legs/post guard groups): apply the same order and grouping in both tables wherever the position appears in both.
- Code changes to how the grid is drawn go in `gridTable()` in `app.js`, which builds both tables; never special-case only one of them.

Techniques don't need double entry: both tables are built from the same `pages/techniques/*.md` files.

The **Flow chart** page (`#/flow`, `viewFlow()` in `app.js`) is drawn from `simpleLayout` plus the transitions between those positions, so it updates itself whenever the simplified table or a transition changes. Don't hard-code positions into it.

Both charts (Flow chart and the Core game chart) share one drawing engine in `app.js`: `layoutChart()` hands the positions and arrows to ELK (the Eclipse Layout Kernel, vendored as `vendor/elk.bundled.js`, elkjs 0.9.3, EPL-2.0 licence in `vendor/elk-LICENSE.md`), whose layered algorithm stacks positions from negative at the bottom to positive at the top (each category is an ELK partition, drawn as a band), orders them to keep crossings down, and routes the arrows at right angles between the boxes. The Flow chart passes `merge: true` so arrows into the same position share a trunk; the Core game chart doesn't, so each arrow can carry its transition's name. `flowNodes()` lists the simplified-table positions both charts start from. ELK is asynchronous, so `wireFlow()` and the Generate button fill the charts in after the page is drawn. Fix or improve chart drawing in `layoutChart()`, not in one chart only. ELK layout options for labels (`elk.edgeLabels.*`) only work on each label, not on the graph; and don't turn on `elk.layered.compaction.postCompaction`, it moves positions out of their category bands.

The **Core game** page (`#/core-game`, `viewCoreGame()` / `coreGameChart()` in `app.js`) also lists the positions from `simpleLayout`: each has a Submissions cell and a Transitions cell holding any number of dropdowns (filled from that position's techniques), each with a × to remove it, plus an "+ Add" button (`coreCellHtml()`). The user's picks are saved in `core-game.json` (`{ picks: { positionId: { subs: [id, ...], transitions: [id, ...] } } }`; an empty list means the user cleared it, a missing list means a position with 1–2 options gets them all pre-picked). When a technique or position id is renamed, merged or deleted, update `core-game.json` too, or that pick silently drops out. The generated chart stays on the page until it's generated again: it's drawn from a copy of the picks taken when Generate was clicked (`chartPicks`, kept in the browser's localStorage), and when the dropdowns stop matching that copy the page shows an "Out of date" marker and a ⚠ on the Regenerate button.

After any such change, check that every id in `layout` and `simpleLayout` has a file in `pages/positions/`.

## Project conventions

- Every wiki page is a Markdown file: `pages/positions/`, `pages/techniques/`, `pages/concepts/`. The file name is the page id. The format is in `README.md` and `pagefile.js`.
- Run with `node server.js` (http://localhost:8417). The browser editor saves to the page files through the server.
- Position names follow `[Top|Bottom] [position] ([variation])`, and every top/bottom position names its `counterpart`.
- The grids have two columns: `col: sub` (submissions) and `col: transition` (moves you to another position; `to` must be set). There is **no defense column and no separate defense pages**.
- **Defenses live on the page of the move they stop**, in that technique's `## Defense` section (a paragraph, then numbered steps). When adding a defense, add it to the attacking technique's file; never create a standalone defense page. Every submission should have a Defense section.
- Position pages list "Attacks to defend here" automatically from the `counterpart` position's techniques.
- Every technique has `attire: gi | no-gi | both`: `gi` for moves that need the gi (collar, lapel, sleeve grips), `no-gi` for moves only legal or practical without it (e.g. heel hooks under IBJJF gi rules), `both` otherwise. Set it on every new technique.
- `status` colours the move on the home tables (`SHOW_STATUS_COLOURS` in `app.js` switches the colours off):
  - `complete` (green, "Complete"): the user has reviewed the page and signed it off. Only the user sets this.
  - `review` (orange, "Needs review"): the page meets the standard below but the user hasn't reviewed it yet. Set this when you finish bringing a page up to standard.
  - `draft` (red, "Not finished"): the page doesn't meet the standard yet.

## How to do a move page: the standard

`pages/techniques/paper-cutter-choke.md` is the model page. Bring every technique page up to it, in this order:

1. **Header:** all fields set, including `attire`, and `to` for transitions.
2. **Summary:** one sentence saying what the move is and where it's done from.
3. **`## Key steps`:** 3–6 short numbered steps in the order you do them, one action per step.
4. **`## Defense`:** one sentence, then numbered steps.
5. **`## Images`:** 3–6 photos in step order, one per line as `![N. What this photo shows (credit)](https://...)`. Each caption starts with its step number and matches a key step. The page links to the photos rather than storing copies. Good sources: photos in technique articles, and YouTube's still frames of a tutorial (`https://i.ytimg.com/vi/<videoId>/hqdefault.jpg`, `hq1.jpg`, `hq2.jpg`, `hq3.jpg`). Look at each frame before using it, and only caption what it actually shows.
6. **`## Video`:** one YouTube tutorial URL. Check it's public and embeddable first; members-only videos don't play. The watch page's `"playabilityStatus":{"status":"OK"` and `"playableInEmbed":true` confirm both.
7. **`## Notes`:** credits: the video's title and channel, and the source of every photo, by number, with a link.

When a page meets the standard, set `status: review`, never `complete`.
