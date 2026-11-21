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
  // Page file values: complete (green), review (orange: done, not reviewed yet), draft (red: not finished).
  const STATUS_LABEL = { complete: "Complete", review: "Needs review", draft: "Not finished" };
  // Whether a technique works in the gi, no-gi or both. Missing means both.
  const ATTIRE_LABEL = { both: "Gi & no-gi", gi: "Gi only", "no-gi": "No-gi only" };
  const attireOf = t => (ATTIRE_LABEL[t.attire] ? t.attire : "both");
  const attireTag = t => attireOf(t) === "both" ? "" : ` <span class="attire attire-${attireOf(t)}" title="${ATTIRE_LABEL[attireOf(t)]}">${attireOf(t) === "gi" ? "Gi" : "No-gi"}</span>`;
  // Colours techniques green / orange / red by status on the home tables. Set to false to hide.
  const SHOW_STATUS_COLOURS = true;
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
  // Image lines look like "![Caption](https://...)"; a bare URL also works.
  function imageList(lines) {
    return (lines || []).map(l => {
      const m = String(l).match(/^!\[([^\]]*)\]\((\S+?)\)$/);
      const src = safeUrl(m ? m[2] : String(l).trim());
      return src ? { src, caption: m ? m[1].trim() : "" } : null;
    }).filter(Boolean);
  }
  function youtubeId(u) {
    const m = String(u || "").match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/);
    return m ? m[1] : null;
  }

  // ---------- views ----------
  // Both home tables (full and simplified) are built here from the same technique data,
  // so only the list of positions differs between them.
  function gridTable(layout, inGame) {
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
              rows += t ? `<td class="tech st-${t.status}${inGame.has(t.id) ? " in-game" : ""}"${inGame.has(t.id) ? ` title="In your core game"` : ""}>${link(t.id)}${attireTag(t)}</td>` : `<td class="tech"></td>`;
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

  const CORE_MARK_KEY = "grapplewiki.markCoreGame";
  const markCore = () => { try { return localStorage.getItem(CORE_MARK_KEY) !== "off"; } catch (e) { return true; } };
  function setMarkCore(on) {
    try { localStorage.setItem(CORE_MARK_KEY, on ? "on" : "off"); } catch (e) { /* not saved; still switches */ }
    document.querySelectorAll(".grid-wrap").forEach(el => el.classList.toggle("mark-core", on));
  }

  function viewHome() {
    const view = homeView();
    const inGame = coreGameIds(), mark = markCore();
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
        <span><i class="sw st-review"></i>Needs review</span>
        <span><i class="sw st-draft"></i>Not finished</span>
      </div>
      <div class="viewtoggle" role="group" aria-label="Table view">
        <button type="button" data-view="simple" aria-pressed="${view === "simple"}">Simplified</button>
        <button type="button" data-view="full" aria-pressed="${view === "full"}">Full</button>
      </div>
      <label class="core-mark"><input type="checkbox" id="markCore"${mark ? " checked" : ""}> Highlight my <a href="#/core-game">core game</a> <span class="core-mark-sw" aria-hidden="true">★</span> <span class="muted">(${inGame.size} ${inGame.size === 1 ? "move" : "moves"})</span></label>
      <div class="grid-wrap${mark ? " mark-core" : ""}" data-grid="simple"${view === "simple" ? "" : " hidden"}>${gridTable(BASE.simpleLayout || [], inGame)}</div>
      <div class="grid-wrap${mark ? " mark-core" : ""}" data-grid="full"${view === "full" ? "" : " hidden"}>${gridTable(BASE.layout, inGame)}</div>
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
    const imgs = imageList(p.images);
    if (imgs.length) html += `<h2>Images</h2><div class="gallery">${imgs.map(im => `<figure><a href="${esc(im.src)}" target="_blank" rel="noopener"><img src="${esc(im.src)}" alt="${esc(im.caption || p.name)}" loading="lazy" referrerpolicy="no-referrer"></a>${im.caption ? `<figcaption>${wikiInline(im.caption)}</figcaption>` : ""}</figure>`).join("")}</div>`;
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
          <span class="badge attire-${attireOf(t)}">${ATTIRE_LABEL[attireOf(t)]}</span>
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
          <ul class="multicol">${typeGroups[k].sort(byName).map(t => `<li><span class="dot st-${t.status}"></span>${link(t.id)}${attireTag(t)}</li>`).join("")}</ul>`).join("")}
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

  // ---------- chart drawing (Flow chart + Core game) ----------
  // Both charts are laid out by ELK, the Eclipse Layout Kernel (vendor/elk.bundled.js), with its "layered" algorithm.
  // Positions climb from negative at the bottom, through neutral, to positive at the top: each category is an ELK
  // partition, so it gets its own horizontal band, and inside it better positions sit higher. Inside the bands ELK picks the order of the positions to keep arrows short
  // and crossings few, and routes every arrow at right angles between the boxes, never behind one.
  const FLOW = { nodeW: 168, nodeH: 50, labelH: 18 };
  const CAT_ORDER = ["negative", "neutral", "positive"];
  let elk = null;

  // the positions of the simplified table, in table order (that order is ELK's tie-breaker, so pairs stay close)
  function flowNodes() {
    const nodes = new Map();
    (BASE.simpleLayout || []).forEach(sec => sec.groups.forEach(g => g.positions.forEach(id => {
      if (pages.has(id) && !nodes.has(id)) nodes.set(id, { id, cat: sec.cat });
    })));
    return nodes;
  }

  // one arrow per (from, to) pair; several transitions on the same route share it
  function flowEdges(nodes) {
    const edgeMap = new Map();
    techniques.filter(t => t.col === "transition" && nodes.has(t.from) && nodes.has(t.to) && t.from !== t.to).forEach(t => {
      const k = t.from + ">" + t.to;
      if (!edgeMap.has(k)) edgeMap.set(k, { from: t.from, to: t.to, techs: [] });
      edgeMap.get(k).techs.push(t);
    });
    return [...edgeMap.values()];
  }

  // Lay out a chart. nodes: Map id -> { id, cat, h? }; edges: [{ from, to, labelW? }] (labelW reserves room for a label).
  // opts.merge: arrows into (or out of) the same position join into one trunk, which keeps a busy chart tidy.
  // Sets x, y (centre), left, top, bottom and h on each node, and resolves to
  // { routes: [{ e, points: [[x, y], ...], label: [x, y] }], width, height, bands }.
  async function layoutChart(nodes, edges, opts) {
    opts = opts || {};
    if (!window.ELK) throw new Error("the chart library (vendor/elk.bundled.js) didn't load");
    elk = elk || new window.ELK();
    const all = [...nodes.values()];
    all.forEach(n => { n.h = n.h || FLOW.nodeH; });
    const graph = {
      id: "root",
      layoutOptions: {
        "elk.algorithm": "layered",
        "elk.direction": "UP",
        "elk.edgeRouting": "ORTHOGONAL",
        "elk.partitioning.activate": "true",
        "elk.padding": "[top=20,left=44,bottom=20,right=24]",
        "elk.spacing.nodeNode": "24",
        "elk.layered.spacing.nodeNodeBetweenLayers": "40",
        "elk.spacing.edgeNode": "16",
        "elk.spacing.edgeEdge": "8",
        "elk.layered.spacing.edgeNodeBetweenLayers": "14",
        "elk.layered.spacing.edgeEdgeBetweenLayers": "8",
        "elk.layered.thoroughness": "20",
        "elk.layered.nodePlacement.strategy": "NETWORK_SIMPLEX",
        "elk.layered.considerModelOrder.strategy": "PREFER_NODES",
        "elk.layered.mergeEdges": String(!!opts.merge)
      },
      children: all.map(n => ({
        id: n.id, width: FLOW.nodeW, height: n.h,
        layoutOptions: { "elk.partitioning.partition": String(Math.max(0, CAT_ORDER.indexOf(n.cat))) }
      })),
      edges: edges.map((e, i) => ({
        id: "e" + i, sources: [e.from], targets: [e.to],
        labels: e.labelW ? [{ id: "l" + i, text: " ", width: e.labelW, height: FLOW.labelH,
          layoutOptions: { "elk.edgeLabels.placement": "CENTER", "elk.edgeLabels.inline": "true" } }] : []
      }))
    };
    const out = await elk.layout(graph);

    const placed = new Map(out.children.map(c => [c.id, c]));
    all.forEach(n => {
      const c = placed.get(n.id);
      n.left = c.x; n.top = c.y; n.x = c.x + FLOW.nodeW / 2; n.y = c.y + n.h / 2; n.bottom = c.y + n.h;
    });

    const routes = out.edges.map((oe, i) => {
      const s = oe.sections[0];
      const points = [s.startPoint, ...(s.bendPoints || []), s.endPoint].map(p => [p.x, p.y]);
      // pull the end back a little so the arrowhead's tip touches the box instead of overlapping it
      const [px, py] = points[points.length - 2], end = points[points.length - 1];
      const len = Math.hypot(end[0] - px, end[1] - py) || 1, back = Math.min(3, len / 2);
      end[0] -= ((end[0] - px) / len) * back; end[1] -= ((end[1] - py) / len) * back;
      const l = (oe.labels || [])[0];
      let label;
      if (l) label = [l.x + l.width / 2, l.y + l.height / 2];
      else { // middle of the longest straight run
        let best = 0;
        for (let k = 1; k < points.length; k++) {
          const [ax, ay] = points[k - 1], [bx, by] = points[k], d = Math.hypot(bx - ax, by - ay);
          if (d > best) { best = d; label = [(ax + bx) / 2, (ay + by) / 2]; }
        }
      }
      return { e: edges[i], points, label };
    });

    // background bands: one per category (positive on top), split halfway across the space between categories
    const width = out.width, height = out.height;
    const spans = CAT_ORDER.slice().reverse().map(cat => {
      const ns = all.filter(n => (n.cat || "neutral") === cat);
      return ns.length ? { cat, lo: Math.min(...ns.map(n => n.top)), hi: Math.max(...ns.map(n => n.bottom)) } : null;
    }).filter(Boolean);
    const bands = spans.map((s, i) => ({
      cat: s.cat,
      y1: i === 0 ? 4 : (spans[i - 1].hi + s.lo) / 2,
      y2: i === spans.length - 1 ? height - 4 : (s.hi + spans[i + 1].lo) / 2
    }));
    return { routes, width, height, bands };
  }

  // SVG path through the points, with rounded corners
  function roundedPath(pts, radius) {
    let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
    for (let i = 1; i < pts.length - 1; i++) {
      const [px, py] = pts[i - 1], [cx, cy] = pts[i], [nx, ny] = pts[i + 1];
      const r = Math.min(radius, Math.hypot(cx - px, cy - py) / 2, Math.hypot(nx - cx, ny - cy) / 2);
      if (r < 0.5) { d += ` L${cx.toFixed(1)},${cy.toFixed(1)}`; continue; }
      const ax = cx - Math.sign(cx - px) * r, ay = cy - Math.sign(cy - py) * r;
      const bx = cx + Math.sign(nx - cx) * r, by = cy + Math.sign(ny - cy) * r;
      d += ` L${ax.toFixed(1)},${ay.toFixed(1)} Q${cx.toFixed(1)},${cy.toFixed(1)} ${bx.toFixed(1)},${by.toFixed(1)}`;
    }
    const [lx, ly] = pts[pts.length - 1];
    return d + ` L${lx.toFixed(1)},${ly.toFixed(1)}`;
  }

  function bandsSvg(bands, width) {
    return bands.map(b => `<rect class="flow-band band-${b.cat}" x="4" y="${b.y1.toFixed(1)}" width="${(width - 8).toFixed(1)}" height="${(b.y2 - b.y1).toFixed(1)}" rx="12"/>
      <text class="flow-band-label" transform="translate(22 ${((b.y1 + b.y2) / 2).toFixed(1)}) rotate(-90)">${b.cat}</text>`).join("");
  }

  const fitText = (s, max) => (s.length <= max ? s : s.slice(0, max - 1).trimEnd() + "…");

  function wrapLabel(name) {
    if (name.length <= 20) return [name];
    const paren = name.indexOf(" (");
    if (paren > 0) return [name.slice(0, paren), name.slice(paren + 1)];
    const mid = name.lastIndexOf(" ", Math.ceil(name.length / 2) + 3);
    return mid > 0 ? [name.slice(0, mid), name.slice(mid + 1)] : [name];
  }

  // The page is drawn straight away; the chart itself is laid out by ELK, which is asynchronous, so wireFlow() fills it in.
  function viewFlow() {
    const nodes = flowNodes();
    const offChart = techniques.filter(t => t.col === "transition" && nodes.has(t.from) && t.to && !nodes.has(t.to)).length;
    return `
      <article class="page flow-page">
        <h1>Flow chart</h1>
        <p class="lead">The positions in the simplified table, joined by the transitions between them. Click a position to see its submissions.</p>
        <p class="muted flow-key">Positions climb from negative at the bottom, through neutral, to positive at the top, so most arrows point up: towards a better position. Arrows are transitions; arrows heading to the same position join up before they arrive. Hover a position to pick out its arrows: gold ones leave it, blue ones lead into it. Click it to list its submissions and transitions. The number on a position is how many submissions it has.${offChart ? ` ${offChart} ${offChart === 1 ? "transition leads" : "transitions lead"} to positions outside the simplified table, so ${offChart === 1 ? "it's" : "they're"} listed in the side panel instead.` : ""}</p>
        <div class="flow-layout">
          <div class="flow-scroll" id="flowBox"><p class="muted flow-wait">Drawing the chart…</p></div>
          <aside class="flow-panel" id="flowPanel" aria-live="polite"><p class="muted">Click a position to see its submissions.</p></aside>
        </div>
      </article>`;
  }

  async function flowChartSvg() {
    const nodes = flowNodes();
    const edges = flowEdges(nodes);
    const { routes, width, height, bands } = await layoutChart(nodes, edges, { merge: true });
    // arrows share trunks, so an arrow on its own can't say which transitions it carries: the side panel lists them
    const edgeSvg = routes.map(r => `<g class="flow-edge" data-from="${r.e.from}" data-to="${r.e.to}">
        <path class="line" d="${roundedPath(r.points, 6)}" marker-end="url(#flow-arrow)"/>
      </g>`).join("");
    const nodeSvg = [...nodes.values()].map(n => {
      const p = pages.get(n.id);
      const lines = wrapLabel(p.name);
      const subs = techsFrom(n.id, "sub").length;
      return `<g class="flow-node cat-${n.cat}" data-id="${n.id}" tabindex="0" role="button" aria-label="${esc(p.name)}: ${subs} submissions">
        <rect x="${n.left}" y="${n.top}" width="${FLOW.nodeW}" height="${n.h}" rx="10"/>
        <text x="${n.x}" y="${n.y + (lines.length > 1 ? -3 : 4)}">${lines.map((l, i) => `<tspan x="${n.x}" dy="${i ? 14 : 0}">${esc(l)}</tspan>`).join("")}</text>
        ${subs ? `<g class="flow-badge"><circle cx="${n.left + FLOW.nodeW - 4}" cy="${n.top + 4}" r="10"/><text x="${n.left + FLOW.nodeW - 4}" y="${n.top + 8}">${subs}</text></g>` : ""}
      </g>`;
    }).join("");
    return `<svg id="flow" viewBox="0 0 ${width.toFixed(0)} ${height.toFixed(0)}" width="${width.toFixed(0)}" height="${height.toFixed(0)}" role="group" aria-label="Flow chart of positions and transitions">
        <defs>${["flow-arrow", "flow-arrow-out", "flow-arrow-in"].map(m => `<marker id="${m}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker>`).join("")}</defs>
        ${bandsSvg(bands, width)}<g class="flow-edges">${edgeSvg}</g>${nodeSvg}
      </svg>`;
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

  async function wireFlow(selected) {
    const box = document.getElementById("flowBox");
    if (!box) return;
    try {
      const svgHtml = await flowChartSvg();
      if (!box.isConnected) return; // moved to another page while the chart was being laid out
      box.innerHTML = svgHtml;
    } catch (e) {
      if (box.isConnected) box.innerHTML = `<p class="muted flow-wait">Couldn't draw the chart: ${esc(e.message)}</p>`;
      return;
    }
    const svg = document.getElementById("flow");
    const panel = document.getElementById("flowPanel");
    let current = null; // the clicked position; hovering shows another one's arrows until the mouse leaves
    // gold arrows leave the position ("out"), blue arrows lead into it ("in"); id null clears the highlight
    const mark = id => {
      svg.classList.toggle("has-selection", !!id);
      svg.querySelectorAll(".flow-edge").forEach(e => {
        const isOut = !!id && e.dataset.from === id, isIn = !!id && e.dataset.to === id && !isOut;
        e.classList.toggle("out", isOut);
        e.classList.toggle("in", isIn);
        e.querySelector("path.line").setAttribute("marker-end", `url(#${isOut ? "flow-arrow-out" : isIn ? "flow-arrow-in" : "flow-arrow"})`);
        if (isOut || isIn) e.parentNode.appendChild(e); // draw picked-out arrows over the shared trunks
      });
    };
    const select = id => {
      if (!pages.has(id)) return;
      current = id;
      mark(id);
      svg.querySelectorAll(".flow-node").forEach(n => n.classList.toggle("selected", n.dataset.id === id));
      panel.innerHTML = flowPanelHtml(id);
      history.replaceState(null, "", "#/flow?node=" + encodeURIComponent(id));
    };
    svg.querySelectorAll(".flow-node").forEach(n => {
      n.addEventListener("click", () => select(n.dataset.id));
      n.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(n.dataset.id); } });
      n.addEventListener("mouseenter", () => mark(n.dataset.id));
      n.addEventListener("mouseleave", () => mark(current));
      n.addEventListener("focus", () => mark(n.dataset.id));
      n.addEventListener("blur", () => mark(current));
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
  const picksFor = (pid, kind, picks = corePicks) => [...new Set(((picks[pid] || {})[PICK_KEY[kind]] || []).filter(Boolean))].map(id => validPick(pid, kind, id)).filter(Boolean);
  // the game a set of picks makes, as text, so two sets of picks can be compared
  const gameKey = picks => JSON.stringify(simpleIds().map(pid => ["sub", "transition"].map(kind => picksFor(pid, kind, picks).map(t => t.id))));

  // The generated chart stays on the page until it's generated again: it's drawn from a copy of the picks made
  // when Generate was clicked (kept in this browser, so it survives a reload), not from the live dropdowns.
  // When the dropdowns no longer match that copy, the chart is marked out of date.
  const CHART_KEY = "grapplewiki-core-chart";
  let chartPicks = (() => { try { return JSON.parse(localStorage.getItem(CHART_KEY)); } catch (e) { return null; } })();
  let chartHtml = null; // the drawn chart for chartPicks, so coming back to the page doesn't lay it out again
  const chartStale = () => !!chartPicks && gameKey(chartPicks) !== gameKey(corePicks);
  // how many moves the picks hold: { subs, transitions } (a move picked in both dropdowns of a pair counts once)
  const pickCount = (picks = corePicks) => simpleIds().reduce((c, pid) => {
    c.subs += picksFor(pid, "sub", picks).length; c.transitions += picksFor(pid, "transition", picks).length; return c;
  }, { subs: 0, transitions: 0 });
  const pickCountText = () => {
    const { subs, transitions } = pickCount(), n = (k, w) => `${k} ${w}${k === 1 ? "" : "s"}`;
    return `<strong>${n(subs + transitions, "move")}</strong> in your game: ${n(subs, "submission")} and ${n(transitions, "transition")}.`;
  };
  const hasPicks = () => simpleIds().some(pid => picksFor(pid, "sub").length || picksFor(pid, "transition").length);

  // Unsaved picks survive moving around the wiki; they're only reloaded from the file when nothing is unsaved.
  let coreDirty = false;
  window.addEventListener("beforeunload", e => { if (coreDirty) { e.preventDefault(); e.returnValue = ""; } });

  // A position with only 1 or 2 options for a dropdown pair starts with them filled in,
  // unless the saved game already says something for that pair (including an explicit clear).
  function prefillCorePicks(picks = corePicks) {
    let filled = false;
    simpleIds().forEach(pid => ["sub", "transition"].forEach(kind => {
      const key = PICK_KEY[kind];
      if (picks[pid] && Array.isArray(picks[pid][key])) return;
      const opts = techsFrom(pid, kind);
      if (!opts.length || opts.length > 2) return;
      picks[pid] = picks[pid] || {};
      picks[pid][key] = [opts[0].id, opts[1] ? opts[1].id : null];
      filled = true;
    }));
    return filled;
  }

  // The ids of every move in the current core game, as the Core game page would show it:
  // the unsaved picks if there are any, otherwise the saved game (with the same pre-filled dropdowns).
  function coreGameIds() {
    let picks = corePicks;
    if (!coreDirty) {
      picks = JSON.parse(JSON.stringify((BASE.coreGame && BASE.coreGame.picks) || {}));
      prefillCorePicks(picks);
    }
    const ids = new Set();
    simpleIds().forEach(pid => ["sub", "transition"].forEach(kind => picksFor(pid, kind, picks).forEach(t => ids.add(t.id))));
    return ids;
  }

  function viewCoreGame() {
    if (!coreDirty) {
      corePicks = JSON.parse(JSON.stringify((BASE.coreGame && BASE.coreGame.picks) || {}));
      if (prefillCorePicks()) coreDirty = true;
    }
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
        <p class="cg-count" id="cgCount" aria-live="polite">${pickCountText()}</p>
        <div class="cg-scroll">
          <table class="cg-table">
            <thead><tr><th>Position</th><th class="h-sub">Sub 1</th><th class="h-sub">Sub 2</th><th class="h-transition">Transition 1</th><th class="h-transition">Transition 2</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        <div class="formbar cg-actions">
          <button type="button" class="btn primary" id="cgGenerate">Generate flowchart</button>
          <button type="button" class="btn" id="cgSave">Save game</button>
          <button type="button" class="btn" id="cgClear">Clear all</button>
          <span class="muted" id="cgStatus" role="status"></span>
        </div>
        <div id="cgChart"></div>
      </article>`;
  }

  // draw the built game: chosen positions, chosen transitions as labelled arrows, chosen subs inside each position.
  // Laid out by the same engine as the Flow chart page (layoutChart). Positions outside the simplified table are dashed.
  async function coreGameChart(picks) {
    const simple = flowNodes();
    const nodes = new Map(), edges = [];
    const addNode = id => {
      if (nodes.has(id)) return;
      const g = simple.get(id);
      nodes.set(id, g ? Object.assign({}, g) : { id, off: true, cat: ((placements[id] || [])[0] || {}).cat || "neutral" });
    };
    simpleIds().forEach(pid => {
      const subs = picksFor(pid, "sub", picks), trans = picksFor(pid, "transition", picks);
      if (!subs.length && !trans.length) return;
      addNode(pid);
      nodes.get(pid).subs = subs;
      trans.forEach(t => {
        if (t.to && pages.has(t.to) && t.to !== pid) { addNode(t.to); edges.push({ from: pid, to: t.to, tech: t, labelW: t.name.length * 6 + 14 }); }
      });
    });
    if (!nodes.size) return `<p class="muted">Pick some submissions or transitions first.</p>`;
    nodes.forEach(n => { n.subs = n.subs || []; n.h = FLOW.nodeH + n.subs.length * 15; });

    const { routes, width, height, bands } = await layoutChart(nodes, edges);
    const edgeSvg = routes.map(r => {
      const t = r.e.tech, [lx, ly] = r.label, w = r.e.labelW;
      return `<g class="cg-edge" data-from="${r.e.from}" data-to="${r.e.to}"><title>${esc(t.name)}</title>
        <path d="${roundedPath(r.points, 8)}" marker-end="url(#cg-arrow)"/>
        <a href="${href(t)}"><rect x="${(lx - w / 2).toFixed(1)}" y="${(ly - 9).toFixed(1)}" width="${w}" height="18" rx="9"/>
        <text x="${lx.toFixed(1)}" y="${(ly + 4).toFixed(1)}">${esc(t.name)}</text></a>
      </g>`;
    }).join("");
    const nodeSvg = [...nodes.values()].map(n => {
      const p = pages.get(n.id), lines = wrapLabel(p.name), top = n.top;
      return `<g class="flow-node cg-node cat-${n.cat}${n.off ? " off" : ""}" data-id="${n.id}">
        <a href="${href(p)}"><rect x="${n.x - FLOW.nodeW / 2}" y="${top}" width="${FLOW.nodeW}" height="${n.h}" rx="10"/>
        <text x="${n.x}" y="${top + (lines.length > 1 ? 19 : 29)}">${lines.map((l, i) => `<tspan x="${n.x}" dy="${i ? 14 : 0}">${esc(l)}</tspan>`).join("")}</text></a>
        ${n.subs.map((t, i) => `<a href="${href(t)}"><title>${esc(t.name)}</title><text class="cg-sub" x="${n.x}" y="${top + FLOW.nodeH + i * 15 + 2}">⊗ ${esc(fitText(t.name, 24))}</text></a>`).join("")}
      </g>`;
    }).join("");
    const subCount = [...nodes.values()].reduce((a, n) => a + n.subs.length, 0);
    return `
      <h2>Your game <span class="cg-stale" id="cgStale" hidden title="Your picks have changed since this chart was drawn">⚠ Out of date</span></h2>
      <p class="cg-stale-note" id="cgStaleNote" hidden>You've changed your picks since this chart was drawn. Click <strong>Regenerate flowchart</strong> to update it.</p>
      <p class="muted flow-key">${nodes.size} positions, ${edges.length} transitions, ${subCount} submissions. Arrows are your transitions; ⊗ marks a submission. Hover a position to pick out its arrows: gold ones leave it, blue ones lead into it. Click anything to open its page.${[...nodes.values()].some(n => n.off) ? " Dashed positions aren't in the simplified table." : ""}</p>
      <div class="flow-scroll">
        <svg id="cgSvg" viewBox="0 0 ${width.toFixed(0)} ${height.toFixed(0)}" width="${width.toFixed(0)}" height="${height.toFixed(0)}" role="img" aria-label="Flowchart of your core game">
          <defs><marker id="cg-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker>
            <marker id="cg-arrow-in" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
          ${bandsSvg(bands, width)}<g>${edgeSvg}</g>${nodeSvg}
        </svg>
      </div>`;
  }

  function wireCoreGame() {
    const page = document.querySelector(".cg-page");
    if (!page) return;
    const status = document.getElementById("cgStatus");
    const genBtn = document.getElementById("cgGenerate");
    const saveBtn = document.getElementById("cgSave");
    const saved = !!(BASE.coreGame && BASE.coreGame.saved);
    const refresh = () => {
      const stale = chartStale();
      document.getElementById("cgCount").innerHTML = pickCountText();
      genBtn.disabled = !hasPicks() && !stale;
      genBtn.textContent = chartPicks ? "Regenerate flowchart" : "Generate flowchart";
      genBtn.classList.toggle("needs-update", stale);
      genBtn.title = stale ? "Your picks have changed since the chart was drawn" : "";
      saveBtn.disabled = !coreDirty;
      saveBtn.classList.toggle("primary", coreDirty);
      genBtn.classList.toggle("primary", !chartPicks || stale || !coreDirty);
      document.querySelectorAll("#cgStale, #cgStaleNote").forEach(el => { el.hidden = !stale; });
      status.textContent = coreDirty ? (saved ? "Unsaved changes" : "Not saved yet") : (saved ? "Saved to core-game.json" : "");
    };
    const setDirty = () => { coreDirty = true; refresh(); };
    saveBtn.addEventListener("click", async () => {
      saveBtn.disabled = true;
      status.textContent = "Saving…";
      try {
        const res = await apiCall("PUT", "/api/core-game", { picks: corePicks });
        BASE.coreGame = { picks: res.picks, saved: true };
        coreDirty = false;
        status.textContent = "Saved to core-game.json";
        saveBtn.classList.remove("primary");
        genBtn.classList.add("primary");
      } catch (e) {
        status.textContent = "Couldn't save: " + e.message;
        saveBtn.disabled = false;
      }
    });
    page.querySelectorAll("select[data-pos]").forEach(sel => sel.addEventListener("change", () => {
      const { pos, kind, i } = sel.dataset;
      const pick = corePicks[pos] = corePicks[pos] || {};
      const list = pick[PICK_KEY[kind]] = pick[PICK_KEY[kind]] || [null, null];
      list[Number(i)] = sel.value || null;
      setDirty();
    }));
    const box = document.getElementById("cgChart");
    // draw the chart for chartPicks into the page (from the cache when it's already been laid out)
    const showChart = async () => {
      if (!chartPicks) { box.innerHTML = ""; return; }
      if (!chartHtml) {
        box.innerHTML = `<p class="muted">Drawing your game…</p>`;
        try { chartHtml = await coreGameChart(chartPicks); }
        catch (e) { if (box.isConnected) box.innerHTML = `<p class="muted">Couldn't draw the chart: ${esc(e.message)}</p>`; return; }
      }
      if (!box.isConnected) return; // moved to another page meanwhile
      box.innerHTML = chartHtml;
      refresh();
      const svg = document.getElementById("cgSvg");
      if (svg) svg.querySelectorAll(".cg-node").forEach(n => {
        const id = n.dataset.id;
        // arrows leaving the hovered position stay gold ("out"); arrows coming into it turn blue ("in")
        n.addEventListener("mouseenter", () => {
          svg.classList.add("has-focus");
          svg.querySelectorAll(".cg-edge").forEach(e => {
            const isIn = e.dataset.to === id, isOut = e.dataset.from === id;
            e.classList.toggle("focus", isIn || isOut);
            e.classList.toggle("in", isIn && !isOut);
            e.classList.toggle("out", isOut);
            e.querySelector("path").setAttribute("marker-end", `url(#${isIn && !isOut ? "cg-arrow-in" : "cg-arrow"})`);
          });
        });
        n.addEventListener("mouseleave", () => {
          svg.classList.remove("has-focus");
          svg.querySelectorAll(".cg-edge").forEach(e => {
            e.classList.remove("in", "out");
            e.querySelector("path").setAttribute("marker-end", "url(#cg-arrow)");
          });
        });
      });
    };
    genBtn.addEventListener("click", async () => {
      chartPicks = JSON.parse(JSON.stringify(corePicks));
      chartHtml = null;
      try { localStorage.setItem(CHART_KEY, JSON.stringify(chartPicks)); } catch (e) { /* kept for this visit only */ }
      refresh();
      await showChart();
      box.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    document.getElementById("cgClear").addEventListener("click", () => {
      if (!hasPicks() || !confirm("Clear every pick in your core game? (Nothing changes in the file until you click Save game.)")) return;
      // explicit empties, so cleared dropdowns don't get pre-filled again
      corePicks = {};
      simpleIds().forEach(pid => { corePicks[pid] = { subs: [null, null], transitions: [null, null] }; });
      page.querySelectorAll("select[data-pos]").forEach(sel => { sel.value = ""; });
      setDirty(); // the chart stays, marked out of date, until it's generated again
    });
    refresh();
    showChart();
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
            <label>Gi / no-gi<select name="attire">${Object.keys(ATTIRE_LABEL).map(s => `<option value="${s}"${attireOf(p) === s ? " selected" : ""}>${ATTIRE_LABEL[s]}</option>`).join("")}</select></label>
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
          <label>Images <small>(one per line: ![Caption](https://image-url))</small><textarea name="images" rows="3">${esc((p.images || []).join("\n"))}</textarea></label>
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
        images: f.get("images").split("\n").map(s => s.trim()).filter(Boolean),
        video: f.get("video").trim(),
        notes: f.get("notes").trim()
      };
      if (kind === "technique") Object.assign(rec, { from: f.get("from") || null, to: f.get("to") || null, col: f.get("col"), type: f.get("type"), attire: f.get("attire"), status: f.get("status"),
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
    const markBox = document.getElementById("markCore");
    if (markBox) markBox.addEventListener("change", () => setMarkCore(markBox.checked));
    document.querySelectorAll(".nav a").forEach(a => a.classList.toggle("active", a.getAttribute("href") === "#/" + (parts[0] || "")));
    window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", route);

  // ---------- image viewer ----------
  // Clicking a page image opens it large; arrows (buttons or keys) step through that page's images.
  const viewer = document.createElement("dialog");
  viewer.className = "lightbox";
  viewer.setAttribute("aria-label", "Image viewer");
  viewer.innerHTML = `
    <button type="button" class="lb-close" aria-label="Close">×</button>
    <button type="button" class="lb-nav lb-prev" aria-label="Previous image">‹</button>
    <figure><img alt=""><figcaption></figcaption></figure>
    <button type="button" class="lb-nav lb-next" aria-label="Next image">›</button>
    <div class="lb-count" aria-live="polite"></div>`;
  document.body.appendChild(viewer);
  let lbItems = [], lbIndex = 0;
  function lbShow(i) {
    lbIndex = (i + lbItems.length) % lbItems.length;
    const it = lbItems[lbIndex];
    const img = viewer.querySelector("img");
    img.src = it.src; img.alt = it.alt;
    viewer.querySelector("figcaption").innerHTML = it.caption;
    viewer.querySelector(".lb-count").textContent = lbItems.length > 1 ? `${lbIndex + 1} / ${lbItems.length}` : "";
    viewer.querySelectorAll(".lb-nav").forEach(b => (b.hidden = lbItems.length < 2));
  }
  document.addEventListener("click", e => {
    const a = e.target.closest(".gallery a");
    if (!a) return;
    e.preventDefault();
    const figs = [...a.closest(".gallery").querySelectorAll("figure")];
    lbItems = figs.map(f => ({ src: f.querySelector("img").src, alt: f.querySelector("img").alt, caption: f.querySelector("figcaption") ? f.querySelector("figcaption").innerHTML : "" }));
    lbShow(figs.indexOf(a.closest("figure")));
    viewer.showModal();
  });
  viewer.querySelector(".lb-prev").addEventListener("click", () => lbShow(lbIndex - 1));
  viewer.querySelector(".lb-next").addEventListener("click", () => lbShow(lbIndex + 1));
  viewer.querySelector(".lb-close").addEventListener("click", () => viewer.close());
  viewer.addEventListener("click", e => { if (e.target === viewer) viewer.close(); }); // click the backdrop
  viewer.addEventListener("keydown", e => {
    if (e.key === "ArrowLeft") { e.preventDefault(); lbShow(lbIndex - 1); }
    else if (e.key === "ArrowRight") { e.preventDefault(); lbShow(lbIndex + 1); }
  });
  window.addEventListener("hashchange", () => viewer.open && viewer.close());

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
