# GrappleWiki

A wiki-style map of Brazilian jiu-jitsu techniques, organised by position.

The home page is a grid of positions grouped by **positive / neutral / negative** and **standing / guard / legs / post guard**. Each position lists its **subs**, **transitions** and **defenses**, and every page links to its counterpart on the other side.

## Running it

It's a static site with no build step. Serve the folder with any static server:

```sh
python -m http.server 8417
```

Then open <http://localhost:8417>.

## Files

| File | What it holds |
| --- | --- |
| `data.js` | All content: positions, techniques, concepts, home grid layout, old-id aliases, wanted pages |
| `app.js` | Routing, page views, editor, search |
| `styles.css` | Styling (light and dark) |
| `index.html` | Page shell |

## Conventions

- **Naming:** `[Top|Bottom] [position] ([variation])`, e.g. *Top closed guard (kneeling)*.
- **Transitions** move you from one position to another.
- **Defenses** stop an opponent's submission or transition without changing position. A defense lists the attacks it stops in `counters`.
- **Status:** `complete` (green) or `draft` (yellow).
- Link pages in notes with `[[Page name]]`.

Edits made in the browser are saved to that browser's local storage. Use **Export edits** to back them up.
