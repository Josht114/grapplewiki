(function () {
  "use strict";

  let BASE; // loaded from the server: { positions, techniques, concepts, layout, aliases, wanted }
  const OLD_EDITS_KEY = "grapplewiki.edits.v1";   // from before pages were files
  const OLD_CUSTOM_KEY = "grapplewiki.custom.v1";
  const app = document.getElementById("app");
  const KIND_DIR = { position: "positions", technique: "techniques", concept: "concepts" };

  const COLS = [
    { key: "sub", label: "Subs" },
    { key: "transition", label: "Transitions" }
  ];
  const TYPES = ["submission", "takedown", "pass", "sweep", "escape", "transition", "back take"];
  const STATUS_LABEL = { complete: "Complete", draft: "Draft" };
  // Set to true to colour techniques green (Complete) / yellow (Draft) again.
  const SHOW_STATUS_COLOURS = false;
  document.body.classList.toggle("status-colours", SHOW_STATUS_COLOURS);
  let ALIASES = {};
  const A = id => (id && ALIASES[id]) || id;

  // ---------- server ----------
  async function apiCall(method, url, body) {
    const res = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : {},
      body: body ? JSON.stringify(body) : undefined
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Server returned ${res.status}`);
    return data;
  }
  async function loadWiki() {
    BASE = await apiCall("GET", "/api/wiki");
    ALIASES = BASE.aliases || {};
    BASE.wanted = BASE.wanted || [];
    buildIndex();
  }
  // replace / add / remove one page in BASE without reloading everything
  function storePage(kind, page, removeId) {
    const list = BASE[KIND_DIR[kind]];
    const i = list.findIndex(p => p.id === (removeId || page.id));
    if (removeId) { if (i >= 0) list.splice(i, 1); }
    else if (i >= 0) list[i] = page; else list.push(page);
    buildIndex();
  }

  // ---------- data index ----------
  let pages, positions, techniques, concepts, placements;
  const byOrder = (a, b) => ((a.order ?? 1e9) - (b.order ?? 1e9)) || a.name.localeCompare(b.name);
  function buildIndex() {
    pages = new Map();
    positions = BASE.positions.map(p => Object.assign({ kind: "position" }, p));
    techniques = BASE.techniques.map(t => Object.assign({ kind: "technique" }, t)).sort(byOrder);
    concepts = BASE.concepts.map(c => Object.assign({ kind: "concept" }, c)).sort(byOrder);
    positions.concat(techniques, concepts).forEach(p => {
      if (p.kind === "technique" && !STATUS_LABEL[p.status]) p.status = "draft";
      p.name = p.name || p.id;
      pages.set(p.id, p);
    });
    // where each position appears on the home grid
    placements = {};
    BASE.layout.concat(BASE.simpleLayout || []).forEach(sec => sec.groups.forEach(g => g.positions.forEach(pid => {
      (placements[pid] = placements[pid] || []).push({ cat: sec.cat, group: g.group });
    })));
  }

  // ---------- helpers ----------
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const href = p => "#/" + ({ position: "p", concept: "c" }[p.kind] || "t") + "/" + p.id;
  const link = (id, cls) => {
    const p = pages.get(id);
    return p ? `<a class="${cls || ""}" href="${href(p)}">${esc(p.name)}</a>` : `<span class="muted">${esc(id)}</span>`;
  };
  const techsFrom = (pid, col) => techniques.filter(t => t.from === pid && (!col || t.col === col));
  const findByName = name => {
    const n = name.trim().toLowerCase();
    for (const p of pages.values()) if (p.name.toLowerCase() === n || p.id === slug(n)) return p;
    return null;
  };
  const allWanted = () => BASE.wanted.flatMap(s => s.items).filter(n => !findByName(n));

  // [[Page name]] -> link (red link to create if missing). Input is already escaped.
  function wikiInline(raw) {
    return esc(raw).replace(/\[\[([^\]]+)\]\]/g, (m, name) => {
      const plain = name.replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"');
      const p = findByName(plain);
      return p ? `<a href="${href(p)}">${name}</a>` : `<a class="redlink" href="#/new?name=${encodeURIComponent(plain)}">${name}</a>`;
    });
  }
  function wikiText(raw) {
    return wikiInline(raw).split(/\n{2,}/).map(par => `<p>${par.replace(/\n/g, "<br>")}</p>`).join("");
  }
  function safeUrl(u) {
    try { const x = new URL(u); return /^https?:$/.test(x.protocol) ? x.href : null; } catch (e) { return null; }
  }
  function youtubeId(u) {
    const m = String(u || "").match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/);
    return m ? m[1] : null;
  }

  // ---------- views ----------
  // Both home tables (full and simplified) are built here from the same technique data,
  // so only the list of positions differs between them.
  function gridTable(layout) {
    let rows = "";
    layout.forEach(sec => {
      const groupBlocks = sec.groups.filter(g => g.positions.length).map(g => {
        const blocks = g.positions.filter(pid => pages.has(pid)).map(pid => {
          const cols = COLS.map(c => techsFrom(pid, c.key));
          const n = Math.max(1, ...cols.map(c => c.length));
          return { pid, cols, n, span: n + 1 };
        });
        return { g, blocks, span: blocks.reduce((a, b) => a + b.span, 0) };
      }).filter(gb => gb.blocks.length);
      const catSpan = groupBlocks.reduce((a, b) => a + b.span, 0);
      let firstOfCat = true;
      groupBlocks.forEach(gb => {
        let firstOfGroup = true;
        gb.blocks.forEach(b => {
          const pairStart = !firstOfGroup && b.pid.startsWith("top-") && sec.cat === "neutral";
          rows += `<tr class="pos-row${firstOfGroup ? " group-start" : ""}${firstOfCat ? " cat-start" : ""}${pairStart ? " pair-start" : ""}">`;
          if (firstOfCat) rows += `<th rowspan="${catSpan}" class="cat cat-${sec.cat}"><span>${esc(sec.cat)}</span></th>`;
          if (firstOfGroup) rows += `<th rowspan="${gb.span}" class="grp grp-${slug(gb.g.group)}"><span>${esc(gb.g.group)}</span></th>`;
          rows += `<td colspan="${COLS.length}" class="pos">${link(b.pid)}</td></tr>`;
          firstOfCat = false; firstOfGroup = false;
          for (let i = 0; i < b.n; i++) {
            rows += "<tr>";
            b.cols.forEach(col => {
              const t = col[i];
              rows += t ? `<td class="tech st-${t.status}">${link(t.id)}</td>` : `<td class="tech"></td>`;
            });
            rows += "</tr>";
          }
        });
      });
    });
    return `
        <table class="grid">
          <thead><tr><th class="cat-h"></th><th class="grp-h"></th>
            <th class="h-sub">Subs</th><th class="h-transition">Transitions</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>`;
  }

  const VIEW_KEY = "grapplewiki.homeView";
  function homeView() {
    try { return localStorage.getItem(VIEW_KEY) === "full" ? "full" : "simple"; } catch (e) { return "simple"; }
  }
  function setHomeView(v) {
    try { localStorage.setItem(VIEW_KEY, v); } catch (e) { /* not saved; still switches */ }
    document.querySelectorAll("[data-grid]").forEach(el => { el.hidden = el.dataset.grid !== v; });
    document.querySelectorAll(".viewtoggle button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.view === v)));
  }

  function viewHome() {
    const view = homeView();
    const counts = {
      pos: positions.length, tech: techniques.length,
      complete: techniques.filter(t => t.status === "complete").length,
      wanted: allWanted().length
    };
    return `
      <section class="hero">
        <h1>GrappleWiki</h1>
        <p>A map of Brazilian jiu-jitsu, organised by position. Every position links to its submissions and transitions, and every technique page shows how to defend it.</p>
        <div class="stats">
          <span><b>${counts.pos}</b> positions</span>
          <span><b>${counts.tech}</b> techniques</span>
          <span><b>${counts.complete}</b> complete</span>
          <a href="#/wanted"><b>${counts.wanted}</b> wanted pages</a>
        </div>
      </section>
      <div class="legend">
        <span><i class="sw st-complete"></i>Complete</span>
        <span><i class="sw st-draft"></i>Draft</span>
      </div>
      <div class="viewtoggle" role="group" aria-label="Table view">
        <button type="button" data-view="simple" aria-pressed="${view === "simple"}">Simplified</button>
        <button type="button" data-view="full" aria-pressed="${view === "full"}">Full</button>
      </div>
      <div class="grid-wrap" data-grid="simple"${view === "simple" ? "" : " hidden"}>${gridTable(BASE.simpleLayout || [])}</div>
      <div class="grid-wrap" data-grid="full"${view === "full" ? "" : " hidden"}>${gridTable(BASE.layout)}</div>
      <section class="concepts">
        <h2>Concepts</h2>
        <div class="chips">${concepts.map(c => link(c.id, "chip")).join("")}</div>
      </section>`;
  }

  function breadcrumbs(p) {
    const pid = p.kind === "position" ? p.id : p.from;
    const pl = (placements[pid] || [])[0];
    const parts = [`<a href="#/">Home</a>`];
    if (p.kind === "concept") parts.push(`<span>Concepts</span>`);
    if (pl) parts.push(`<span class="pill cat-${pl.cat}">${esc(pl.cat)}</span>`, `<span class="pill grp-${slug(pl.group)}">${esc(pl.group)}</span>`);
    if (p.kind === "technique" && p.from) parts.push(link(p.from));
    return `<div class="crumbs">${parts.join('<span class="sep">›</span>')}</div>`;
  }

  // How to stop this technique: lives on the technique's own page
  function defenseBlock(t) {
    const steps = t.defenseSteps || [];
    if (!t.defense && !steps.length) {
      return `<h2>Defense</h2><p class="muted">No defense written yet. <a href="#/edit/${t.id}">Add one</a>.</p>`;
    }
    return `<h2>Defense</h2><div class="defense">${t.defense ? wikiText(t.defense) : ""}${steps.length
      ? `<ol class="steps">${steps.map(x => `<li>${wikiInline(x)}</li>`).join("")}</ol>` : ""}</div>`;
  }

  function contentBlock(p) {
    let html = "";
    if (p.summary) html += `<p class="lead">${esc(p.summary)}</p>`;
    else html += `<div class="stub-box">This page is a stub. <a href="#/edit/${p.id}">Add a description</a>.</div>`;
    if (p.steps && p.steps.length) html += `<h2>${p.kind === "technique" ? "Key steps" : "Key points"}</h2><ol class="steps">${p.steps.map(s => `<li>${wikiInline(s)}</li>`).join("")}</ol>`;
    if (p.kind === "technique") html += defenseBlock(p);
    const yt = youtubeId(p.video);
    if (yt) html += `<h2>Video</h2><div class="video"><iframe src="https://www.youtube-nocookie.com/embed/${yt}" title="Video" allowfullscreen loading="lazy"></iframe></div>`;
    else if (safeUrl(p.video)) html += `<h2>Video</h2><p><a href="${esc(safeUrl(p.video))}" target="_blank" rel="noopener">${esc(p.video)}</a></p>`;
    if (p.notes) html += `<h2>Notes</h2><div class="notes">${wikiText(p.notes)}</div>`;
    return html;
  }

  function viewPosition(p) {
    const cols = COLS.map(c => {
      const list = techsFrom(p.id, c.key);
      return `<div class="colcard col-${c.key}"><h3>${c.label}</h3>${list.length
        ? `<ul>${list.map(t => `<li><span class="dot st-${t.status}"></span>${link(t.id)}${t.to ? ` <span class="muted">→ ${link(t.to, "muted")}</span>` : ""}</li>`).join("")}</ul>`
        : `<p class="muted empty">None yet. <a href="#/new?from=${p.id}&col=${c.key}">Add one</a></p>`}</div>`;
    }).join("");
    const arriving = techniques.filter(t => t.to === p.id);
    // the opponent's attacks from the other side of this position; each page has its own Defense section
    const threats = p.counterpart ? techsFrom(p.counterpart) : [];
    return `
      ${breadcrumbs(p)}
      <article class="page">
        <div class="titlebar">
          <h1>${esc(p.name)}</h1>
          <div class="actions"><a class="btn" href="#/edit/${p.id}">Edit</a></div>
        </div>
        <div class="meta">
          <span class="badge side-${p.side}">${esc(p.side)}</span>
          ${p.counterpart ? `<span>Other side: ${link(p.counterpart)}</span>` : ""}
        </div>
        ${contentBlock(p)}
        <h2>Techniques from here</h2>
        <div class="cols">${cols}</div>
        ${threats.length ? `<h2>Attacks to defend here</h2>
          <p class="muted">What the opponent can do from ${link(p.counterpart, "muted")}. Each page includes its defense.</p>
          <ul class="arrive">${threats.map(t => `<li>${link(t.id)} <span class="muted">${t.col === "sub" ? "submission" : "→ " + (t.to ? link(t.to, "muted") : "")}</span></li>`).join("")}</ul>` : ""}
        ${arriving.length ? `<h2>Ways to get here</h2><ul class="arrive">${arriving.map(t => `<li>${link(t.id)} <span class="muted">from ${link(t.from, "muted")}</span></li>`).join("")}</ul>` : ""}
      </article>`;
  }

  function viewTechnique(t) {
    const siblings = techsFrom(t.from).filter(x => x.id !== t.id);
    return `
      ${breadcrumbs(t)}
      <article class="page">
        <div class="titlebar">
          <h1>${esc(t.name)}</h1>
          <div class="actions"><a class="btn" href="#/edit/${t.id}">Edit</a></div>
        </div>
        <div class="meta">
          <span class="badge">${esc(t.type || t.col)}</span>
          <span class="badge st-${t.status}">${STATUS_LABEL[t.status]}</span>
        </div>
        <div class="flow">
          <div class="flow-node"><small>From</small>${t.from ? link(t.from) : "—"}</div>
          <div class="flow-arrow" aria-hidden="true">→</div>
          <div class="flow-node"><small>${t.col === "sub" ? "Finish" : "To"}</small>${t.to ? link(t.to) : (t.col === "sub" ? "Tap" : "—")}</div>
        </div>
        ${contentBlock(t)}
        ${siblings.length ? `<h2>Also from ${link(t.from)}</h2><ul class="arrive">${siblings.map(s => `<li><span class="dot st-${s.status}"></span>${link(s.id)}</li>`).join("")}</ul>` : ""}
      </article>`;
  }

  function viewConcept(c) {
    return `
      ${breadcrumbs(c)}
      <article class="page">
        <div class="titlebar">
          <h1>${esc(c.name)}</h1>
          <div class="actions"><a class="btn" href="#/edit/${c.id}">Edit</a></div>
        </div>
        <div class="meta"><span class="badge">concept</span></div>
        ${contentBlock(c)}
      </article>`;
  }

  function viewAll() {
    const byName = (a, b) => a.name.localeCompare(b.name);
    const typeGroups = {};
    techniques.forEach(t => (typeGroups[t.type || "other"] = typeGroups[t.type || "other"] || []).push(t));
    return `
      <article class="page">
        <h1>All pages</h1>
        <h2>Positions (${positions.length})</h2>
        <ul class="multicol">${positions.slice().sort(byName).map(p => `<li>${link(p.id)}</li>`).join("")}</ul>
        <h2>Concepts (${concepts.length})</h2>
        <ul class="multicol">${concepts.slice().sort(byName).map(p => `<li>${link(p.id)}</li>`).join("")}</ul>
        ${Object.keys(typeGroups).sort().map(k => `
          <h2>${esc(k[0].toUpperCase() + k.slice(1))}s (${typeGroups[k].length})</h2>
          <ul class="multicol">${typeGroups[k].sort(byName).map(t => `<li><span class="dot st-${t.status}"></span>${link(t.id)}</li>`).join("")}</ul>`).join("")}
      </article>`;
  }

  function viewWanted() {
    return `
      <article class="page">
        <h1>Wanted pages</h1>
        <p class="lead">Suggested pages that don't exist yet. Click a red link to create it.</p>
        ${allWanted().length ? "" : `<div class="stub-box">Every suggested page has been created. Add new suggestions to the <code>wanted</code> list in wiki.json, or <a href="#/new">create a page</a>.</div>`}
        ${BASE.wanted.filter(s => s.items.length).map(s => {
          const items = s.items.map(n => {
            const p = findByName(n);
            return p ? `<li>${link(p.id)} <span class="muted">✓ created</span></li>`
                     : `<li><a class="redlink" href="#/new?name=${encodeURIComponent(n)}">${esc(n)}</a></li>`;
          });
          return `<h2>${esc(s.section)}</h2><ul class="multicol">${items.join("")}</ul>`;
        }).join("")}
      </article>`;
  }

  function viewSearch(q) {
    const n = q.trim().toLowerCase();
    const hits = n ? [...pages.values()].filter(p => (p.name + " " + (p.summary || "") + " " + (p.notes || "") + " " + (p.defense || "")).toLowerCase().includes(n)) : [];
    hits.sort((a, b) => (b.name.toLowerCase().includes(n) - a.name.toLowerCase().includes(n)) || a.name.localeCompare(b.name));
    return `
      <article class="page">
        <h1>Search: “${esc(q)}”</h1>
        ${hits.length ? `<ul class="results">${hits.map(p => `<li>${link(p.id)} <span class="badge">${p.kind === "technique" ? esc(p.type) : p.kind}</span><div class="muted">${esc(p.summary || "")}</div></li>`).join("")}</ul>`
          : `<p>No pages found. <a class="redlink" href="#/new?name=${encodeURIComponent(q)}">Create “${esc(q)}”</a></p>`}
      </article>`;
  }

  // ---------- flow chart (built from the simplified table) ----------
  // Nodes = positions in BASE.simpleLayout. Arrows = transitions between two of those positions.
  // Rows: positive on top, the neutral guard pairs in the middle (top player above bottom player),
  // negative at the bottom, each bottom position directly under its top counterpart.
  const FLOW = { colW: 196, rowH: 116, nodeW: 164, nodeH: 50, left: 34, top: 24 };

  function flowLayout() {
    const L = BASE.simpleLayout || [];
    const sec = cat => L.find(s => s.cat === cat) || { groups: [] };
    const ids = (s, pred) => s.groups.filter(pred).flatMap(g => g.positions).filter(id => pages.has(id));
    const isStanding = g => g.group === "standing";
    const nodes = new Map();
    const put = (id, cat, col, row) => { if (!nodes.has(id)) nodes.set(id, { id, cat, col, row }); };

    // standing positions take the left-most columns of their row
    const standing = { positive: ids(sec("positive"), isStanding), neutral: ids(sec("neutral"), isStanding), negative: ids(sec("negative"), isStanding) };
    const S = Math.max(standing.positive.length, standing.neutral.length, standing.negative.length);

    standing.positive.forEach((id, i) => put(id, "positive", i, 0));
    ids(sec("positive"), g => !isStanding(g)).forEach((id, i) => put(id, "positive", S + i, 0));

    standing.negative.forEach((id, i) => put(id, "negative", i, 3));
    let free = S;
    const usedNeg = new Set();
    ids(sec("negative"), g => !isStanding(g)).forEach(id => {
      const cp = pages.get(id).counterpart;
      let col = cp && nodes.has(cp) ? nodes.get(cp).col : null;
      if (col === null || usedNeg.has(col)) { while (usedNeg.has(free)) free++; col = free++; }
      usedNeg.add(col);
      put(id, "negative", col, 3);
    });

    const maxCol = Math.max(S, ...[...nodes.values()].map(n => n.col));
    standing.neutral.forEach((id, i) => put(id, "neutral", i, 1.5));

    // guard pairs: top player on row 1, bottom player on row 2, spread across the columns
    const guard = ids(sec("neutral"), g => !isStanding(g));
    const tops = guard.filter(id => !id.startsWith("bottom-"));
    const pairs = tops.map(id => [id, guard.find(b => b.startsWith("bottom-") && pages.get(b).counterpart === id)]);
    guard.filter(id => id.startsWith("bottom-") && !pairs.some(p => p[1] === id)).forEach(id => pairs.push([null, id]));
    const span = Math.max(0, maxCol - S);
    pairs.forEach(([t, b], i) => {
      const col = pairs.length > 1 ? S + (i * span) / (pairs.length - 1) : S + span / 2;
      if (t) put(t, "neutral", col, 1);
      if (b) put(b, "neutral", col, 2);
    });

    const rowY = r => FLOW.top + r * FLOW.rowH + (r >= 1 ? 26 : 0) + (r >= 3 ? 26 : 0);
    nodes.forEach(n => { n.x = FLOW.left + n.col * FLOW.colW + FLOW.colW / 2; n.y = rowY(n.row) + FLOW.nodeH / 2; });
    const width = FLOW.left + (maxCol + 1) * FLOW.colW + 10;
    const height = rowY(3) + FLOW.nodeH + FLOW.top;
    const bands = [
      { cat: "positive", y1: rowY(0) - 16, y2: rowY(0) + FLOW.nodeH + 16 },
      { cat: "neutral", y1: rowY(1) - 16, y2: rowY(2) + FLOW.nodeH + 16 },
      { cat: "negative", y1: rowY(3) - 16, y2: rowY(3) + FLOW.nodeH + 16 }
    ];

    // one arrow per (from, to) pair; several transitions on the same route share it
    const edgeMap = new Map();
    techniques.filter(t => t.col === "transition" && nodes.has(t.from) && nodes.has(t.to) && t.from !== t.to).forEach(t => {
      const k = t.from + ">" + t.to;
      if (!edgeMap.has(k)) edgeMap.set(k, { from: t.from, to: t.to, techs: [] });
      edgeMap.get(k).techs.push(t);
    });
    return { nodes, edges: [...edgeMap.values()], width, height, bands };
  }

  // point where the line from a node's centre towards (tx, ty) leaves the node's box
  function boxExit(n, tx, ty, pad) {
    const dx = tx - n.x, dy = ty - n.y;
    const hw = FLOW.nodeW / 2 + pad, hh = FLOW.nodeH / 2 + pad;
    const s = Math.min(dx ? hw / Math.abs(dx) : Infinity, dy ? hh / Math.abs(dy) : Infinity);
    return [n.x + dx * s, n.y + dy * s];
  }

  function wrapLabel(name) {
    if (name.length <= 20) return [name];
    const paren = name.indexOf(" (");
    if (paren > 0) return [name.slice(0, paren), name.slice(paren + 1)];
    const mid = name.lastIndexOf(" ", Math.ceil(name.length / 2) + 3);
    return mid > 0 ? [name.slice(0, mid), name.slice(mid + 1)] : [name];
  }

  function viewFlow() {
    const { nodes, edges, width, height, bands } = flowLayout();
    const edgeSvg = edges.map(e => {
      const a = nodes.get(e.from), b = nodes.get(e.to);
      const [sx, sy] = boxExit(a, b.x, b.y, 2);
      const [ex, ey] = boxExit(b, a.x, a.y, 6);
      const dx = ex - sx, dy = ey - sy, len = Math.hypot(dx, dy) || 1;
      const bend = Math.min(40, 14 + len * 0.06); // bend to the right of travel, so A→B and B→A don't overlap
      const cx = (sx + ex) / 2 - (dy / len) * bend, cy = (sy + ey) / 2 + (dx / len) * bend;
      const lx = 0.25 * sx + 0.5 * cx + 0.25 * ex, ly = 0.25 * sy + 0.5 * cy + 0.25 * ey;
      const names = e.techs.map(t => t.name).join(", ");
      return `<g class="flow-edge" data-from="${e.from}" data-to="${e.to}">
        <title>${esc(pages.get(e.from).name)} → ${esc(pages.get(e.to).name)}: ${esc(names)}</title>
        <path d="M${sx.toFixed(1)},${sy.toFixed(1)} Q${cx.toFixed(1)},${cy.toFixed(1)} ${ex.toFixed(1)},${ey.toFixed(1)}" marker-end="url(#flow-arrow)"/>
        ${e.techs.length > 1 ? `<circle cx="${lx.toFixed(1)}" cy="${ly.toFixed(1)}" r="9"/><text x="${lx.toFixed(1)}" y="${(ly + 4).toFixed(1)}">${e.techs.length}</text>` : ""}
      </g>`;
    }).join("");
    const nodeSvg = [...nodes.values()].map(n => {
      const p = pages.get(n.id);
      const lines = wrapLabel(p.name);
      const subs = techsFrom(n.id, "sub").length;
      return `<g class="flow-node cat-${n.cat}" data-id="${n.id}" tabindex="0" role="button" aria-label="${esc(p.name)}: ${subs} submissions">
        <rect x="${n.x - FLOW.nodeW / 2}" y="${n.y - FLOW.nodeH / 2}" width="${FLOW.nodeW}" height="${FLOW.nodeH}" rx="10"/>
        <text x="${n.x}" y="${n.y + (lines.length > 1 ? -3 : 4)}">${lines.map((l, i) => `<tspan x="${n.x}" dy="${i ? 14 : 0}">${esc(l)}</tspan>`).join("")}</text>
        ${subs ? `<g class="flow-badge"><circle cx="${n.x + FLOW.nodeW / 2 - 4}" cy="${n.y - FLOW.nodeH / 2 + 4}" r="10"/><text x="${n.x + FLOW.nodeW / 2 - 4}" y="${n.y - FLOW.nodeH / 2 + 8}">${subs}</text></g>` : ""}
      </g>`;
    }).join("");
    const bandSvg = bands.map(b => `<rect class="flow-band band-${b.cat}" x="0" y="${b.y1}" width="${width}" height="${b.y2 - b.y1}" rx="12"/>
      <text class="flow-band-label" transform="translate(18 ${(b.y1 + b.y2) / 2}) rotate(-90)">${b.cat}</text>`).join("");
    const offChart = techniques.filter(t => t.col === "transition" && nodes.has(t.from) && t.to && !nodes.has(t.to)).length;

    return `
      <article class="page flow-page">
        <h1>Flow chart</h1>
        <p class="lead">The positions in the simplified table, joined by the transitions between them. Click a position to see its submissions.</p>
        <p class="muted flow-key">Arrows are transitions; a number on an arrow means several transitions share that route (hover to see them). The number on a position is how many submissions it has.${offChart ? ` ${offChart} transitions lead to positions outside the simplified table, so they're listed in the side panel instead.` : ""}</p>
        <div class="flow-layout">
          <div class="flow-scroll">
            <svg id="flow" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="group" aria-label="Flow chart of positions and transitions">
              <defs><marker id="flow-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
              ${bandSvg}<g class="flow-edges">${edgeSvg}</g>${nodeSvg}
            </svg>
          </div>
          <aside class="flow-panel" id="flowPanel" aria-live="polite"><p class="muted">Click a position to see its submissions.</p></aside>
        </div>
      </article>`;
  }

  function flowPanelHtml(id) {
    const p = pages.get(id);
    const subs = techsFrom(id, "sub");
    const trans = techsFrom(id, "transition");
    const onChart = new Set([...document.querySelectorAll("#flow .flow-node")].map(n => n.dataset.id));
    return `
      <h2>${link(id)}</h2>
      <h3>Submissions (${subs.length})</h3>
      ${subs.length ? `<ul>${subs.map(t => `<li>${link(t.id)}</li>`).join("")}</ul>` : `<p class="muted">None yet. <a href="#/new?from=${id}&col=sub">Add one</a></p>`}
      <h3>Transitions (${trans.length})</h3>
      ${trans.length ? `<ul>${trans.map(t => `<li>${link(t.id)} <span class="muted">→ ${t.to ? link(t.to, "muted") : "?"}${t.to && !onChart.has(t.to) ? " (not on chart)" : ""}</span></li>`).join("")}</ul>` : `<p class="muted">None yet.</p>`}`;
  }

  function wireFlow(selected) {
    const svg = document.getElementById("flow");
    if (!svg) return;
    const panel = document.getElementById("flowPanel");
    const select = id => {
      if (!pages.has(id)) return;
      svg.classList.add("has-selection");
      svg.querySelectorAll(".flow-node").forEach(n => n.classList.toggle("selected", n.dataset.id === id));
      svg.querySelectorAll(".flow-edge").forEach(e => {
        e.classList.toggle("out", e.dataset.from === id);
        e.classList.toggle("in", e.dataset.to === id);
      });
      panel.innerHTML = flowPanelHtml(id);
      history.replaceState(null, "", "#/flow?node=" + encodeURIComponent(id));
    };
    svg.querySelectorAll(".flow-node").forEach(n => {
      n.addEventListener("click", () => select(n.dataset.id));
      n.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(n.dataset.id); } });
    });
    if (selected) select(selected);
  }

  // ---------- core game ----------
  // Every position in the simplified table gets 2 sub and 2 transition dropdowns.
  // Picks are saved to core-game.json; "Generate flowchart" draws the game from them.
  let corePicks = {};
  const PICK_KEY = { sub: "subs", transition: "transitions" };
  const simpleIds = () => (BASE.simpleLayout || []).flatMap(s => s.groups.flatMap(g => g.positions)).filter(id => pages.has(id));
  const validPick = (pid, kind, id) => { const t = pages.get(id); return t && t.kind === "technique" && t.from === pid && t.col === kind ? t : null; };
  const picksFor = (pid, kind) => [...new Set(((corePicks[pid] || {})[PICK_KEY[kind]] || []).filter(Boolean))].map(id => validPick(pid, kind, id)).filter(Boolean);
  const hasPicks = () => simpleIds().some(pid => picksFor(pid, "sub").length || picksFor(pid, "transition").length);

  function viewCoreGame() {
    corePicks = JSON.parse(JSON.stringify((BASE.coreGame && BASE.coreGame.picks) || {}));
    const dropdown = (pid, kind, i) => {
      const opts = techsFrom(pid, kind);
      const label = `${pages.get(pid).name}: ${kind === "sub" ? "Sub" : "Transition"} ${i + 1}`;
      if (!opts.length) return `<select disabled aria-label="${esc(label)}"><option>None yet</option></select>`;
      const cur = ((corePicks[pid] || {})[PICK_KEY[kind]] || [])[i] || "";
      return `<select data-pos="${pid}" data-kind="${kind}" data-i="${i}" aria-label="${esc(label)}">
        <option value="">—</option>${opts.map(t => `<option value="${t.id}"${t.id === cur ? " selected" : ""}>${esc(t.name)}${t.col === "transition" && t.to ? " → " + esc((pages.get(t.to) || { name: t.to }).name) : ""}</option>`).join("")}
      </select>`;
    };
    const rows = (BASE.simpleLayout || []).map(sec => {
      const ids = sec.groups.flatMap(g => g.positions).filter(id => pages.has(id));
      if (!ids.length) return "";
      return `<tr class="cg-band"><th colspan="5" class="cat-${sec.cat}">${esc(sec.cat)}</th></tr>` + ids.map(pid => `
        <tr>
          <th scope="row">${link(pid)}</th>
          <td>${dropdown(pid, "sub", 0)}</td><td>${dropdown(pid, "sub", 1)}</td>
          <td>${dropdown(pid, "transition", 0)}</td><td>${dropdown(pid, "transition", 1)}</td>
        </tr>`).join("");
    }).join("");
    return `
      <article class="page cg-page">
        <h1>Core game</h1>
        <p class="lead">Build your game: pick up to two submissions and two transitions from each position, then generate a flowchart of it.</p>
        <div class="cg-scroll">
          <table class="cg-table">
            <thead><tr><th>Position</th><th class="h-sub">Sub 1</th><th class="h-sub">Sub 2</th><th class="h-transition">Transition 1</th><th class="h-transition">Transition 2</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        <div class="formbar cg-actions">
          <button type="button" class="btn primary" id="cgGenerate">Generate flowchart</button>
          <button type="button" class="btn" id="cgClear">Clear all</button>
          <span class="muted" id="cgStatus" role="status"></span>
        </div>
        <div id="cgChart"></div>
      </article>`;
  }

  // draw the built game: chosen positions, chosen transitions as labelled arrows, chosen subs inside each position
  function coreGameChart() {
    const base = flowLayout();
    const nodes = new Map(), edges = [];
    const addNode = id => {
      if (nodes.has(id)) return;
      const b = base.nodes.get(id);
      nodes.set(id, b ? Object.assign({}, b) : { id, off: true });
    };
    simpleIds().forEach(pid => {
      const subs = picksFor(pid, "sub"), trans = picksFor(pid, "transition");
      if (!subs.length && !trans.length) return;
      addNode(pid);
      nodes.get(pid).subs = subs;
      trans.forEach(t => { if (t.to && pages.has(t.to)) { addNode(t.to); edges.push({ from: pid, to: t.to, tech: t }); } });
    });
    // positions outside the simplified table go in an extra column on the right, in their band
    const maxCol = Math.max(0, ...[...base.nodes.values()].map(n => n.col));
    const rowOf = id => ({ positive: 0, negative: 3 }[((placements[id] || [])[0] || {}).cat] ?? 1.5);
    let extra = 0;
    const rowY = r => FLOW.top + r * FLOW.rowH + (r >= 1 ? 26 : 0) + (r >= 3 ? 26 : 0);
    nodes.forEach(n => {
      if (!n.off) return;
      n.col = maxCol + 1 + Math.floor(extra++ / 3);
      n.row = rowOf(n.id);
      n.x = FLOW.left + n.col * FLOW.colW + FLOW.colW / 2;
      n.y = rowY(n.row) + FLOW.nodeH / 2;
    });
    nodes.forEach(n => { n.subs = n.subs || []; n.h = FLOW.nodeH + n.subs.length * 15; });
    const width = Math.max(base.width, FLOW.left + (Math.max(...[...nodes.values()].map(n => n.col)) + 1) * FLOW.colW + 10);
    const height = base.height + 30 + 24; // 24px headroom for labels lifted above the top row

    const exit = (n, tx, ty, pad) => {
      const dx = tx - n.x, dy = ty - n.y, hw = FLOW.nodeW / 2 + pad, hh = n.h / 2 + pad;
      const s = Math.min(dx ? hw / Math.abs(dx) : Infinity, dy ? hh / Math.abs(dy) : Infinity);
      return [n.x + dx * s, n.y + dy * s];
    };
    const pairCount = {};
    const edgeSvg = edges.map(e => {
      const a = nodes.get(e.from), b = nodes.get(e.to);
      const k = e.from + ">" + e.to, idx = (pairCount[k] = (pairCount[k] || 0) + 1) - 1;
      const [sx, sy] = exit(a, b.x, b.y, 2), [ex, ey] = exit(b, a.x, a.y, 6);
      const dx = ex - sx, dy = ey - sy, len = Math.hypot(dx, dy) || 1;
      const bend = Math.min(40, 14 + len * 0.06) + idx * 26;
      const cx = (sx + ex) / 2 - (dy / len) * bend, cy = (sy + ey) / 2 + (dx / len) * bend;
      let lx = 0.25 * sx + 0.5 * cx + 0.25 * ex, ly = 0.25 * sy + 0.5 * cy + 0.25 * ey;
      const w = e.tech.name.length * 6 + 12;
      // arrow too short for its label: lift the label above both boxes
      if (len < w + 16) ly = Math.min(a.y - a.h / 2, b.y - b.h / 2) - 14 - idx * 20;
      return `<g class="cg-edge"><title>${esc(e.tech.name)}</title>
        <path d="M${sx.toFixed(1)},${sy.toFixed(1)} Q${cx.toFixed(1)},${cy.toFixed(1)} ${ex.toFixed(1)},${ey.toFixed(1)}" marker-end="url(#cg-arrow)"/>
        <a href="${href(e.tech)}"><rect x="${(lx - w / 2).toFixed(1)}" y="${(ly - 9).toFixed(1)}" width="${w}" height="18" rx="9"/>
        <text x="${lx.toFixed(1)}" y="${(ly + 4).toFixed(1)}">${esc(e.tech.name)}</text></a>
      </g>`;
    }).join("");
    const nodeSvg = [...nodes.values()].map(n => {
      const p = pages.get(n.id), lines = wrapLabel(p.name), top = n.y - n.h / 2;
      const cat = ((placements[n.id] || [])[0] || {}).cat || "neutral";
      return `<g class="flow-node cg-node cat-${cat}${n.off ? " off" : ""}">
        <a href="${href(p)}"><rect x="${n.x - FLOW.nodeW / 2}" y="${top}" width="${FLOW.nodeW}" height="${n.h}" rx="10"/>
        <text x="${n.x}" y="${top + (lines.length > 1 ? 19 : 29)}">${lines.map((l, i) => `<tspan x="${n.x}" dy="${i ? 14 : 0}">${esc(l)}</tspan>`).join("")}</text></a>
        ${n.subs.map((t, i) => `<a href="${href(t)}"><text class="cg-sub" x="${n.x}" y="${top + FLOW.nodeH + i * 15 + 2}">⊗ ${esc(t.name)}</text></a>`).join("")}
      </g>`;
    }).join("");
    const bandSvg = base.bands.map(b => `<rect class="flow-band" x="0" y="${b.y1}" width="${width}" height="${b.y2 - b.y1 + (b.cat === "negative" ? 30 : 0)}" rx="12"/>
      <text class="flow-band-label" transform="translate(18 ${(b.y1 + b.y2) / 2}) rotate(-90)">${b.cat}</text>`).join("");
    const subCount = [...nodes.values()].reduce((a, n) => a + n.subs.length, 0);
    return `
      <h2>Your game</h2>
      <p class="muted flow-key">${nodes.size} positions, ${edges.length} transitions, ${subCount} submissions. Arrows are your transitions; ⊗ marks a submission. Click anything to open its page.${[...nodes.values()].some(n => n.off) ? " Positions on the far right aren't in the simplified table." : ""}</p>
      <div class="flow-scroll">
        <svg id="cgSvg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="Flowchart of your core game">
          <defs><marker id="cg-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
          <g transform="translate(0 24)">${bandSvg}<g>${edgeSvg}</g>${nodeSvg}</g>
        </svg>
      </div>`;
  }

  function wireCoreGame() {
    const page = document.querySelector(".cg-page");
    if (!page) return;
    const status = document.getElementById("cgStatus");
    const genBtn = document.getElementById("cgGenerate");
    const refreshBtn = () => { genBtn.disabled = !hasPicks(); };
    let timer;
    const save = () => {
      clearTimeout(timer);
      status.textContent = "Saving…";
      timer = setTimeout(async () => {
        try {
          const res = await apiCall("PUT", "/api/core-game", { picks: corePicks });
          BASE.coreGame = { picks: res.picks };
          status.textContent = "Saved to core-game.json";
        } catch (e) { status.textContent = "Couldn't save: " + e.message; }
      }, 300);
    };
    page.querySelectorAll("select[data-pos]").forEach(sel => sel.addEventListener("change", () => {
      const { pos, kind, i } = sel.dataset;
      const pick = corePicks[pos] = corePicks[pos] || { subs: [], transitions: [] };
      const list = pick[PICK_KEY[kind]] = pick[PICK_KEY[kind]] || [];
      list[Number(i)] = sel.value || null;
      refreshBtn();
      save();
    }));
    genBtn.addEventListener("click", () => {
      const box = document.getElementById("cgChart");
      box.innerHTML = coreGameChart();
      box.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    document.getElementById("cgClear").addEventListener("click", () => {
      if (!hasPicks() || !confirm("Clear every pick in your core game?")) return;
      corePicks = {};
      page.querySelectorAll("select[data-pos]").forEach(sel => { sel.value = ""; });
      document.getElementById("cgChart").innerHTML = "";
      refreshBtn();
      save();
    });
    refreshBtn();
  }

  // ---------- editor ----------
  const posOptions = (sel, allowNone) =>
    (allowNone ? `<option value="">— none —</option>` : "") +
    positions.slice().sort((a, b) => a.name.localeCompare(b.name))
      .map(p => `<option value="${p.id}"${p.id === sel ? " selected" : ""}>${esc(p.name)}</option>`).join("");

  // Where a position sits in one of the two home grids ("layout" = full, "simpleLayout" = simplified)
  const LAYOUT_GROUPS = {
    layout: () => BASE.layout,
    simpleLayout: () => mergeGroups(BASE.layout, BASE.simpleLayout || [])
  };
  // the simplified grid may add a group (e.g. "standing") the full grid has in a different place, so offer both sets
  function mergeGroups(a, b) {
    const out = JSON.parse(JSON.stringify(b));
    a.forEach(sec => {
      let t = out.find(x => x.cat === sec.cat);
      if (!t) { t = { cat: sec.cat, groups: [] }; out.push(t); }
      sec.groups.forEach(g => { if (!t.groups.some(x => x.group === g.group)) t.groups.push({ group: g.group, positions: [] }); });
    });
    return out;
  }
  function placementIn(key, id) {
    for (const sec of BASE[key] || []) for (const g of sec.groups) if (g.positions.includes(id)) return sec.cat + "/" + g.group;
    return "";
  }
  function placementOptions(key, id) {
    const cur = id ? placementIn(key, id) : "";
    let html = `<option value="">— not on this grid —</option>`;
    LAYOUT_GROUPS[key]().forEach(sec => sec.groups.forEach(g => {
      const v = sec.cat + "/" + g.group;
      html += `<option value="${esc(v)}"${v === cur ? " selected" : ""}>${esc(sec.cat + " › " + g.group)}</option>`;
    }));
    return html;
  }
  async function savePlacements(id, values) {
    const body = {};
    for (const [key, value] of Object.entries(values)) {
      if (value === placementIn(key, id)) continue;
      const layout = JSON.parse(JSON.stringify(BASE[key] || []));
      layout.forEach(sec => sec.groups.forEach(g => { g.positions = g.positions.filter(x => x !== id); }));
      if (value) {
        const [cat, group] = value.split("/");
        let sec = layout.find(x => x.cat === cat);
        if (!sec) { sec = { cat, groups: [] }; layout.push(sec); }
        let g = sec.groups.find(x => x.group === group);
        if (!g) { g = { group, positions: [] }; sec.groups.push(g); }
        g.positions.push(id);
      }
      body[key] = layout;
    }
    if (!Object.keys(body).length) return;
    Object.assign(BASE, await apiCall("PUT", "/api/layout", body));
    buildIndex();
  }

  function viewEditor(p, isNew, preset) {
    preset = preset || {};
    const kind = isNew ? (preset.kind || "technique") : p.kind;
    p = p || { name: preset.name || "", from: preset.from || "", col: preset.col || "transition", status: "draft", side: "top",
               type: preset.col === "sub" ? "submission" : "transition" };
    const isTech = kind === "technique";
    const isPos = kind === "position";
    return `
      <article class="page">
        <h1>${isNew ? "Create page" : "Editing: " + esc(p.name)}</h1>
        <form id="editForm" class="editor" data-new="${isNew ? 1 : 0}" data-id="${isNew ? "" : p.id}">
          ${isNew ? `<label>Page type
            <select name="kind" id="kindSel">
              <option value="technique"${isTech ? " selected" : ""}>Technique</option>
              <option value="position"${isPos ? " selected" : ""}>Position</option>
              <option value="concept"${kind === "concept" ? " selected" : ""}>Concept</option>
            </select></label>` : ""}
          <label>Name<input name="name" required value="${esc(p.name)}"></label>
          <div class="row tech-only"${isTech ? "" : " hidden"}>
            <label>From position<select name="from">${posOptions(p.from, true)}</select></label>
            <label>To position<select name="to">${posOptions(p.to, true)}</select></label>
          </div>
          <div class="row tech-only"${isTech ? "" : " hidden"}>
            <label>Home column<select name="col">${COLS.map(c => `<option value="${c.key}"${p.col === c.key ? " selected" : ""}>${c.label}</option>`).join("")}</select></label>
            <label>Type<select name="type">${TYPES.map(t => `<option${p.type === t ? " selected" : ""}>${t}</option>`).join("")}</select></label>
            <label>Status<select name="status">${Object.keys(STATUS_LABEL).map(s => `<option value="${s}"${p.status === s ? " selected" : ""}>${STATUS_LABEL[s]}</option>`).join("")}</select></label>
          </div>
          <div class="row pos-only"${isPos ? "" : " hidden"}>
            <label>Side<select name="side">${["top", "bottom", "neutral"].map(s => `<option${p.side === s ? " selected" : ""}>${s}</option>`).join("")}</select></label>
            <label>Other side<select name="counterpart">${posOptions(p.counterpart, true)}</select></label>
            <label>Full grid<select name="placement">${placementOptions("layout", isNew ? "" : p.id)}</select></label>
            <label>Simplified grid<select name="simplePlacement">${placementOptions("simpleLayout", isNew ? "" : p.id)}</select></label>
          </div>
          <label>Summary<textarea name="summary" rows="3">${esc(p.summary || "")}</textarea></label>
          <label>Key steps <small>(one per line)</small><textarea name="steps" rows="5">${esc((p.steps || []).join("\n"))}</textarea></label>
          <label class="tech-only"${isTech ? "" : " hidden"}>Defense <small>(how to stop this move)</small><textarea name="defense" rows="3">${esc(p.defense || "")}</textarea></label>
          <label class="tech-only"${isTech ? "" : " hidden"}>Defense steps <small>(one per line)</small><textarea name="defenseSteps" rows="4">${esc((p.defenseSteps || []).join("\n"))}</textarea></label>
          <label>Video URL <small>(YouTube links embed)</small><input name="video" type="url" value="${esc(p.video || "")}"></label>
          <label>Notes <small>(link other pages with [[Page name]])</small><textarea name="notes" rows="6">${esc(p.notes || "")}</textarea></label>
          <p class="form-error" id="formError" role="alert" hidden></p>
          <div class="formbar">
            <button class="btn primary" type="submit">Save</button>
            <a class="btn" href="${isNew ? "#/" : href(p)}">Cancel</a>
            ${isNew ? "" : `<button class="btn danger" type="button" id="deleteBtn">Delete page</button>`}
          </div>
          <p class="muted filehint">${isNew ? "Saving creates a new file in" : "Saves to"} <code>pages/${KIND_DIR[kind]}/${isNew ? "&lt;name&gt;" : esc(p.id)}.md</code></p>
        </form>
      </article>`;
  }

  function wireEditor() {
    const form = document.getElementById("editForm");
    if (!form) return;
    const kindSel = document.getElementById("kindSel");
    if (kindSel) kindSel.addEventListener("change", () => {
      const tech = kindSel.value === "technique";
      form.querySelectorAll(".tech-only").forEach(el => (el.hidden = !tech));
      form.querySelectorAll(".pos-only").forEach(el => (el.hidden = kindSel.value !== "position"));
    });
    const errBox = document.getElementById("formError");
    const showError = msg => { errBox.textContent = msg; errBox.hidden = false; };
    form.addEventListener("submit", async ev => {
      ev.preventDefault();
      const f = new FormData(form);
      const isNew = form.dataset.new === "1";
      const kind = isNew ? f.get("kind") : pages.get(form.dataset.id).kind;
      const rec = {
        name: f.get("name").trim(),
        summary: f.get("summary").trim(),
        steps: f.get("steps").split("\n").map(s => s.trim()).filter(Boolean),
        video: f.get("video").trim(),
        notes: f.get("notes").trim()
      };
      if (kind === "technique") Object.assign(rec, { from: f.get("from") || null, to: f.get("to") || null, col: f.get("col"), type: f.get("type"), status: f.get("status"),
        defense: f.get("defense").trim(), defenseSteps: f.get("defenseSteps").split("\n").map(s => s.trim()).filter(Boolean) });
      else if (kind === "position") Object.assign(rec, { side: f.get("side"), counterpart: f.get("counterpart") || null });
      if (!isNew && pages.get(form.dataset.id).order !== undefined) rec.order = pages.get(form.dataset.id).order;

      const btn = form.querySelector("button[type=submit]");
      btn.disabled = true; btn.textContent = "Saving…";
      try {
        const saved = isNew
          ? await apiCall("POST", `/api/pages/${kind}`, rec)
          : await apiCall("PUT", `/api/pages/${kind}/${form.dataset.id}`, rec);
        storePage(kind, saved);
        if (kind === "position") await savePlacements(saved.id, { layout: f.get("placement") || "", simpleLayout: f.get("simplePlacement") || "" });
        location.hash = href(pages.get(saved.id));
      } catch (e) {
        showError("Couldn't save: " + e.message);
        btn.disabled = false; btn.textContent = "Save";
      }
    });
    const del = document.getElementById("deleteBtn");
    if (del) del.addEventListener("click", async () => {
      const p = pages.get(form.dataset.id);
      const refs = techniques.filter(t => t.from === p.id || t.to === p.id).length;
      const warn = refs ? `\n\n${refs} other page(s) refer to it and will show a broken link.` : "";
      if (!confirm(`Delete "${p.name}"? This removes pages/${KIND_DIR[p.kind]}/${p.id}.md.${warn}`)) return;
      try {
        await apiCall("DELETE", `/api/pages/${p.kind}/${p.id}`);
        if (p.kind === "position") BASE.layout.concat(BASE.simpleLayout || []).forEach(sec => sec.groups.forEach(g => { g.positions = g.positions.filter(x => x !== p.id); }));
        storePage(p.kind, null, p.id);
        location.hash = "#/";
      } catch (e) { showError("Couldn't delete: " + e.message); }
    });
  }

  // ---------- router ----------
  function route() {
    const [path, query] = (location.hash.slice(1) || "/").split("?");
    const params = new URLSearchParams(query || "");
    const parts = path.split("/").filter(Boolean).map(decodeURIComponent);
    if (parts[1] && ALIASES[parts[1]]) { location.replace("#/" + parts[0] + "/" + ALIASES[parts[1]]); return; }
    let html, title = "GrappleWiki";

    if (parts.length === 0) html = viewHome();
    else if (parts[0] === "p" || parts[0] === "t" || parts[0] === "c") {
      const p = pages.get(parts[1]);
      if (p) { html = p.kind === "position" ? viewPosition(p) : p.kind === "concept" ? viewConcept(p) : viewTechnique(p); title = p.name + " · GrappleWiki"; }
    }
    else if (parts[0] === "core-game") { html = viewCoreGame(); title = "Core game · GrappleWiki"; }
    else if (parts[0] === "flow") { html = viewFlow(); title = "Flow chart · GrappleWiki"; }
    else if (parts[0] === "all") { html = viewAll(); title = "All pages · GrappleWiki"; }
    else if (parts[0] === "wanted") { html = viewWanted(); title = "Wanted pages · GrappleWiki"; }
    else if (parts[0] === "search") { html = viewSearch(params.get("q") || ""); title = "Search · GrappleWiki"; }
    else if (parts[0] === "edit" && pages.get(parts[1])) { html = viewEditor(pages.get(parts[1]), false); title = "Edit · GrappleWiki"; }
    else if (parts[0] === "new") {
      html = viewEditor(null, true, { name: params.get("name") || "", from: params.get("from") || "", col: params.get("col") || "" });
      title = "New page · GrappleWiki";
    }
    if (!html) html = `<article class="page"><h1>Page not found</h1><p><a href="#/">Back to home</a></p></article>`;

    app.innerHTML = html;
    document.title = title;
    wireEditor();
    app.classList.toggle("wide", parts[0] === "flow" || parts[0] === "core-game");
    if (parts[0] === "flow") wireFlow(params.get("node"));
    if (parts[0] === "core-game") wireCoreGame();
    document.querySelectorAll(".viewtoggle button").forEach(b => b.addEventListener("click", () => setHomeView(b.dataset.view)));
    document.querySelectorAll(".nav a").forEach(a => a.classList.toggle("active", a.getAttribute("href") === "#/" + (parts[0] || "")));
    window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", route);

  // ---------- search / import / export ----------
  document.getElementById("searchForm").addEventListener("submit", e => {
    e.preventDefault();
    const q = document.getElementById("searchInput").value.trim();
    if (!q) return;
    const exact = findByName(q);
    location.hash = exact ? href(exact) : "#/search?q=" + encodeURIComponent(q);
  });
  // ---------- edits saved in this browser before pages became files ----------
  function oldBrowserEdits() {
    const get = k => { try { return JSON.parse(localStorage.getItem(k)) || {}; } catch (e) { return {}; } };
    return { edits: get(OLD_EDITS_KEY), custom: get(OLD_CUSTOM_KEY) };
  }
  function showOldEditsBanner() {
    const old = oldBrowserEdits();
    const n = Object.keys(old.edits).length + Object.keys(old.custom).length;
    if (!n) return;
    const bar = document.createElement("div");
    bar.className = "banner";
    bar.innerHTML = `This browser has ${n} edit(s) from before pages were saved as files. <button class="btn" type="button">Save them to files</button>`;
    document.body.insertBefore(bar, app);
    bar.querySelector("button").addEventListener("click", async () => {
      const fix = r => { ["from", "to", "counterpart"].forEach(k => { if (r[k]) r[k] = A(r[k]); }); return r; };
      try {
        for (const [oldId, rec] of Object.entries(old.edits)) {
          const p = pages.get(A(oldId));
          if (p) storePage(p.kind, await apiCall("PUT", `/api/pages/${p.kind}/${p.id}`, Object.assign({}, p, fix(rec))));
        }
        for (const rec of Object.values(old.custom)) {
          const kind = rec.kind || "technique";
          storePage(kind, await apiCall("POST", `/api/pages/${kind}`, fix(rec)));
        }
        localStorage.removeItem(OLD_EDITS_KEY); localStorage.removeItem(OLD_CUSTOM_KEY);
        bar.textContent = "Saved. Your earlier browser edits are now in the page files.";
        route();
      } catch (e) { alert("Couldn't save: " + e.message); }
    });
  }

  // ---------- start ----------
  loadWiki().then(() => { showOldEditsBanner(); route(); }).catch(err => {
    app.innerHTML = `<article class="page"><h1>Can't reach the wiki server</h1>
      <p>GrappleWiki saves pages as files, so it needs its small local server. In the project folder run:</p>
      <pre><code>node server.js</code></pre>
      <p>then open <a href="http://localhost:8417">http://localhost:8417</a>.</p>
      <p class="muted">${esc(err.message)}</p></article>`;
  });
})();
