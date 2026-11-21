# GrappleWiki

A wiki-style map of Brazilian jiu-jitsu techniques, organised by position.

The home page is a grid of positions grouped by **positive / neutral / negative** and **standing / guard / legs / post guard**. Each position lists its **subs** and **transitions**, and every technique page includes how to **defend** it. Every position links to its counterpart on the other side.

Every wiki page is its own Markdown file in `pages/`. Edits made in the browser are written straight back to those files, so they show up in git like any other change.

## Running it

Needs [Node.js](https://nodejs.org) 18 or newer. There is nothing to install.

```sh
node server.js
```

Then open <http://localhost:8417>. The server only listens on your own computer.

## Files

| Path | What it holds |
| --- | --- |
| `pages/positions/*.md` | One file per position |
| `pages/techniques/*.md` | One file per technique (subs and transitions), including its defense |
| `pages/concepts/*.md` | One file per concept page |
| `wiki.json` | Home grid layout, redirects for renamed pages, wanted pages |
| `core-game.json` | Your picks on the Core game page (2 subs and 2 transitions per position) |
| `server.js` | Local server: serves the wiki and saves edits to `pages/` |
| `pagefile.js` | Reads and writes the page file format |
| `app.js`, `styles.css`, `index.html` | The wiki in the browser |

The file name is the page's id and its URL, e.g. `pages/techniques/kimura.md` is `#/t/kimura`.

## Page file format

```markdown
---
name: Kimura
from: top-side-control
col: sub
type: submission
status: draft
order: 50
---
One-paragraph summary.

## Key steps

1. First step.
2. Second step.

## Defense

How the opponent stops this move.

1. First defense step.

## Video

https://www.youtube.com/watch?v=...

## Notes

Free text. Link other pages with [[Page name]].
```

Header fields:

- **Positions:** `name`, `side` (`top` / `bottom` / `neutral`), `counterpart` (id of the same position from the other side).
- **Techniques:** `name`, `from`, `to`, `col`, `type`, `status`, `order`.
  - `col` is `sub` or `transition` (moves you to another position).
  - How to stop the move goes in its `## Defense` section, not a separate page.
  - `status` is `complete` (green) or `draft` (yellow).
  - `order` sets the order within a column on the home grid.
- **Concepts:** `name`, `order`.

You can edit the files by hand too. Reload the browser to see the changes.

## Conventions

- **Naming:** `[Top|Bottom] [position] ([variation])`, e.g. *Top closed guard (kneeling)*.
- To put a position on the home grid, pick a **Home grid** group in its editor (or add its id to `layout` in `wiki.json`).
