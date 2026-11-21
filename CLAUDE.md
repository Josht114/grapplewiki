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

Both charts (Flow chart and the Core game chart) share one drawing engine in `app.js`: `flowGrid()` puts positions on whole rows and columns, and `routeChart()` routes every arrow along the free lanes between rows and columns, so no arrow runs behind a position or on top of another arrow. Fix or improve chart drawing there, not in one chart only.

The **Core game** page (`#/core-game`, `viewCoreGame()` / `coreGameChart()` in `app.js`) also lists the positions from `simpleLayout`: each gets two sub and two transition dropdowns filled from that position's techniques. The user's picks are saved in `core-game.json` (`{ picks: { positionId: { subs: [id, id], transitions: [id, id] } } }`). When a technique or position id is renamed, merged or deleted, update `core-game.json` too, or that pick silently drops out.

After any such change, check that every id in `layout` and `simpleLayout` has a file in `pages/positions/`.

## Project conventions

- Every wiki page is a Markdown file: `pages/positions/`, `pages/techniques/`, `pages/concepts/`. The file name is the page id. The format is in `README.md` and `pagefile.js`.
- Run with `node server.js` (http://localhost:8417). The browser editor saves to the page files through the server.
- Position names follow `[Top|Bottom] [position] ([variation])`, and every top/bottom position names its `counterpart`.
- The grids have two columns: `col: sub` (submissions) and `col: transition` (moves you to another position; `to` must be set). There is **no defense column and no separate defense pages**.
- **Defenses live on the page of the move they stop**, in that technique's `## Defense` section (a paragraph, then numbered steps). When adding a defense, add it to the attacking technique's file; never create a standalone defense page. Every submission should have a Defense section.
- Position pages list "Attacks to defend here" automatically from the `counterpart` position's techniques.
- `status` is `complete` or `draft`. The colours for them are switched off (`SHOW_STATUS_COLOURS` in `app.js`).
