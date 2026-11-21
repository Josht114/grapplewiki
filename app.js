(function () {
  "use strict";

  const BASE = window.WIKI;
  const EDITS_KEY = "grapplewiki.edits.v1";
  const CUSTOM_KEY = "grapplewiki.custom.v1";
  const app = document.getElementById("app");

  const COLS = [
    { key: "sub", label: "Subs" },
    { key: "transition", label: "Transitions" },
    { key: "defense", label: "Defense" }
  ];
  const TYPES = ["submission", "takedown", "pass", "sweep", "escape", "transition", "back take", "defense"];
  const STATUS_LABEL = { complete: "Complete", draft: "Draft" };
  const ALIASES = BASE.aliases || {};
  const A = id => (id && ALIASES[id]) || id;

  // ---------- storage ----------
  function load(key) {
    try { return JSON.parse(localStorage.getItem(key)) || {}; } catch (e) { return {}; }
  }
  function save(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); return true; } catch (e) { return false; }
  }
  let edits = load(EDITS_KEY);
  let custom = load(CUSTOM_KEY);
  // move anything saved under an old page id to its new id
  function migrateStored() {
    const fixRefs = r => ["from", "to", "counterpart"].forEach(k => { if (r[k]) r[k] = A(r[k]); });
    Object.keys(edits).forEach(k => { fixRefs(edits[k]); if (ALIASES[k]) { edits[A(k)] = edits[k]; delete edits[k]; } });
    Object.values(custom).forEach(fixRefs);
  }
  migrateStored();

  // ---------- data index ----------
  let pages, positions, techniques, concepts, placements;
  function buildIndex() {
    pages = new Map();
    positions = [];
    techniques = [];
    concepts = [];
    BASE.positions.forEach(p => positions.push(Object.assign({ kind: "position" }, p)));
    BASE.techniques.forEach(t => techniques.push(Object.assign({ kind: "technique" }, t)));
    (BASE.concepts || []).forEach(c => concepts.push(Object.assign({ kind: "concept" }, c)));
    Object.values(custom).forEach(c => (c.kind === "position" ? positions : c.kind === "concept" ? concepts : techniques).push(Object.assign({ custom: true }, c)));
    positions.concat(techniques, concepts).forEach(p => {
      const e = edits[p.id];
      if (e) Object.assign(p, e);
      if (p.kind === "technique" && !STATUS_LABEL[p.status]) p.status = "draft";
      pages.set(p.id, p);
    });
    // where each position appears on the home grid
    placements = {};
    BASE.layout.forEach(sec => sec.groups.forEach(g => g.positions.forEach(pid => {
      (placements[pid] = placements[pid] || []).push({ cat: sec.cat, group: g.group });
    })));
  }
  buildIndex();

  // ---------- helpers ----------
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const href = p => "#/" + ({ position: "p", concept: "c" }[p.kind] || "t") + "/" + p.id;
  const link = (id, cls) => {
    const p = pages.get(id);
    return p ? `<a class="${cls || ""}" href="${href(p)}">${esc(p.name)}</a>` : `<span class="muted">${esc(id)}</span>`;
  };
  const techsFrom = (pid, col) => techniques.filter(t => t.from === pid && (!col || t.col === col));
  const counteredBy = id => techniques.filter(t => (t.counters || []).includes(id));
  const counterNote = t => {
    const list = t.col === "defense" ? (t.counters || []) : counteredBy(t.id).map(d => d.id);
    if (!list.length) return "";
    return ` <span class="muted counter">${t.col === "defense" ? "stops" : "⇄"} ${list.map(id => link(id, "muted")).join(", ")}</span>`;
  };
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
  function viewHome() {
    let rows = "";
    BASE.layout.forEach(sec => {
      // pre-compute rows per position
      const groupBlocks = sec.groups.map(g => {
        const blocks = g.positions.map(pid => {
          const cols = COLS.map(c => techsFrom(pid, c.key));
          const n = Math.max(1, ...cols.map(c => c.length));
          return { pid, cols, n, span: n + 1 };
        });
        return { g, blocks, span: blocks.reduce((a, b) => a + b.span, 0) };
      });
      const catSpan = groupBlocks.reduce((a, b) => a + b.span, 0);
      let firstOfCat = true;
      groupBlocks.forEach(gb => {
        let firstOfGroup = true;
        gb.blocks.forEach(b => {
          const pairStart = !firstOfGroup && b.pid.startsWith("top-") && sec.cat === "neutral";
          rows += `<tr class="pos-row${firstOfGroup ? " group-start" : ""}${firstOfCat ? " cat-start" : ""}${pairStart ? " pair-start" : ""}">`;
          if (firstOfCat) rows += `<th rowspan="${catSpan}" class="cat cat-${sec.cat}"><span>${esc(sec.cat)}</span></th>`;
          if (firstOfGroup) rows += `<th rowspan="${gb.span}" class="grp grp-${slug(gb.g.group)}"><span>${esc(gb.g.group)}</span></th>`;
          rows += `<td colspan="3" class="pos">${link(b.pid)}</td></tr>`;
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

    const counts = {
      pos: positions.length, tech: techniques.length,
      complete: techniques.filter(t => t.status === "complete").length,
      wanted: allWanted().length
    };
    return `
      <section class="hero">
        <h1>GrappleWiki</h1>
        <p>A map of Brazilian jiu-jitsu, organised by position. Every position links to its submissions, transitions and defenses.</p>
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
      <div class="grid-wrap">
        <table class="grid">
          <thead><tr><th class="cat-h"></th><th class="grp-h"></th>
            <th class="h-sub">Subs</th><th class="h-transition">Transitions</th><th class="h-defense">Defense</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
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

  function contentBlock(p) {
    let html = "";
    if (p.summary) html += `<p class="lead">${esc(p.summary)}</p>`;
    else html += `<div class="stub-box">This page is a stub. <a href="#/edit/${p.id}">Add a description</a>.</div>`;
    if (p.steps && p.steps.length) html += `<h2>${p.kind === "technique" ? "Key steps" : "Key points"}</h2><ol class="steps">${p.steps.map(s => `<li>${wikiInline(s)}</li>`).join("")}</ol>`;
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
        ? `<ul>${list.map(t => `<li><span class="dot st-${t.status}"></span>${link(t.id)}${t.to ? ` <span class="muted">→ ${link(t.to, "muted")}</span>` : ""}${counterNote(t)}</li>`).join("")}</ul>`
        : `<p class="muted empty">None yet. <a href="#/new?from=${p.id}&col=${c.key}">Add one</a></p>`}</div>`;
    }).join("");
    const arriving = techniques.filter(t => t.to === p.id);
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
          ${p.custom ? `<span class="badge">custom page</span>` : ""}
        </div>
        ${contentBlock(p)}
        <h2>Techniques from here</h2>
        <div class="cols">${cols}</div>
        ${arriving.length ? `<h2>Ways to get here</h2><ul class="arrive">${arriving.map(t => `<li>${link(t.id)} <span class="muted">from ${link(t.from, "muted")}</span></li>`).join("")}</ul>` : ""}
      </article>`;
  }

  function counterBlock(t) {
    const isDef = t.col === "defense";
    const list = isDef ? (t.counters || []).map(id => pages.get(id)).filter(Boolean) : counteredBy(t.id);
    const items = list.map(x => `<li><span class="dot st-${x.status}"></span>${link(x.id)} <span class="muted">from ${link(x.from, "muted")}</span></li>`).join("");
    if (isDef) return list.length ? `<div class="counterbox"><h3>Stops</h3><ul>${items}</ul></div>` : "";
    return `<div class="counterbox"><h3>Countered by</h3>${list.length ? `<ul>${items}</ul>`
      : `<p class="muted">No counter yet. <a href="#/new?counters=${t.id}">Add one</a></p>`}</div>`;
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
          ${t.custom ? `<span class="badge">custom page</span>` : ""}
        </div>
        <div class="flow">
          <div class="flow-node"><small>From</small>${t.from ? link(t.from) : "—"}</div>
          <div class="flow-arrow" aria-hidden="true">→</div>
          <div class="flow-node"><small>${{ sub: "Finish", defense: "Result" }[t.col] || "To"}</small>${t.to ? link(t.to) : ({ sub: "Tap", defense: "No position change" }[t.col] || "—")}</div>
        </div>
        ${counterBlock(t)}
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
        <div class="meta"><span class="badge">concept</span>${c.custom ? `<span class="badge">custom page</span>` : ""}</div>
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
        ${allWanted().length ? "" : `<div class="stub-box">Every suggested page has been created. Add new suggestions to the <code>wanted</code> list in data.js, or <a href="#/new">create a page</a>.</div>`}
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
    const hits = n ? [...pages.values()].filter(p => (p.name + " " + (p.summary || "") + " " + (p.notes || "")).toLowerCase().includes(n)) : [];
    hits.sort((a, b) => (b.name.toLowerCase().includes(n) - a.name.toLowerCase().includes(n)) || a.name.localeCompare(b.name));
    return `
      <article class="page">
        <h1>Search: “${esc(q)}”</h1>
        ${hits.length ? `<ul class="results">${hits.map(p => `<li>${link(p.id)} <span class="badge">${p.kind === "technique" ? esc(p.type) : p.kind}</span><div class="muted">${esc(p.summary || "")}</div></li>`).join("")}</ul>`
          : `<p>No pages found. <a class="redlink" href="#/new?name=${encodeURIComponent(q)}">Create “${esc(q)}”</a></p>`}
      </article>`;
  }

  // ---------- editor ----------
  const posOptions = (sel, allowNone) =>
    (allowNone ? `<option value="">— none —</option>` : "") +
    positions.slice().sort((a, b) => a.name.localeCompare(b.name))
      .map(p => `<option value="${p.id}"${p.id === sel ? " selected" : ""}>${esc(p.name)}</option>`).join("");

  function viewEditor(p, isNew, preset) {
    preset = preset || {};
    const kind = isNew ? (preset.kind || "technique") : p.kind;
    if (preset.counters) {
      // "Add a counter" link: start a defense on the other side of the attack's position
      const atk = pages.get(preset.counters);
      const fromPos = atk && pages.get(atk.from);
      Object.assign(preset, { col: "defense", counters: [preset.counters],
        name: preset.name || (atk ? atk.name + " defense" : ""),
        from: fromPos ? (fromPos.counterpart || fromPos.id) : "" });
    }
    p = p || { name: preset.name || "", from: preset.from || "", col: preset.col || "transition", status: "draft", side: "top",
               counters: preset.counters || [], type: { sub: "submission", defense: "defense" }[preset.col] || "transition" };
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
          <label class="tech-only"${isTech ? "" : " hidden"}>Stops (for defenses) <small>(ctrl/cmd-click to pick several)</small>
            <select name="counters" multiple size="6">${techniques.filter(t => t.col !== "defense" && t.id !== p.id).sort((a, b) => a.name.localeCompare(b.name))
              .map(t => `<option value="${t.id}"${(p.counters || []).includes(t.id) ? " selected" : ""}>${esc(t.name)}</option>`).join("")}</select></label>
          <div class="row pos-only"${isPos ? "" : " hidden"}>
            <label>Side<select name="side">${["top", "bottom", "neutral"].map(s => `<option${p.side === s ? " selected" : ""}>${s}</option>`).join("")}</select></label>
            <label>Other side<select name="counterpart">${posOptions(p.counterpart, true)}</select></label>
          </div>
          <label>Summary<textarea name="summary" rows="3">${esc(p.summary || "")}</textarea></label>
          <label>Key steps <small>(one per line)</small><textarea name="steps" rows="5">${esc((p.steps || []).join("\n"))}</textarea></label>
          <label>Video URL <small>(YouTube links embed)</small><input name="video" type="url" value="${esc(p.video || "")}"></label>
          <label>Notes <small>(link other pages with [[Page name]])</small><textarea name="notes" rows="6">${esc(p.notes || "")}</textarea></label>
          <div class="formbar">
            <button class="btn primary" type="submit">Save</button>
            <a class="btn" href="${isNew ? "#/" : href(p)}">Cancel</a>
            ${!isNew && (edits[p.id] || p.custom) ? `<button class="btn danger" type="button" id="resetBtn">${p.custom ? "Delete page" : "Revert my edits"}</button>` : ""}
          </div>
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
    form.addEventListener("submit", ev => {
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
        counters: f.get("col") === "defense" ? f.getAll("counters") : [] });
      else if (kind === "position") Object.assign(rec, { side: f.get("side"), counterpart: f.get("counterpart") || null });

      let id;
      if (isNew) {
        id = slug(rec.name) || "page";
        while (pages.has(id)) id += "-2";
        custom[id] = Object.assign({ id, kind }, rec);
        save(CUSTOM_KEY, custom);
      } else {
        id = form.dataset.id;
        if (custom[id]) { Object.assign(custom[id], rec); save(CUSTOM_KEY, custom); }
        else { edits[id] = rec; save(EDITS_KEY, edits); }
      }
      buildIndex();
      location.hash = href(pages.get(id));
    });
    const reset = document.getElementById("resetBtn");
    if (reset) reset.addEventListener("click", () => {
      const id = form.dataset.id;
      const isCustom = !!custom[id];
      if (!confirm(isCustom ? "Delete this page? This can't be undone." : "Revert this page to the original content?")) return;
      if (isCustom) { delete custom[id]; save(CUSTOM_KEY, custom); }
      delete edits[id]; save(EDITS_KEY, edits);
      buildIndex();
      location.hash = isCustom ? "#/" : href(pages.get(id));
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
    else if (parts[0] === "all") { html = viewAll(); title = "All pages · GrappleWiki"; }
    else if (parts[0] === "wanted") { html = viewWanted(); title = "Wanted pages · GrappleWiki"; }
    else if (parts[0] === "search") { html = viewSearch(params.get("q") || ""); title = "Search · GrappleWiki"; }
    else if (parts[0] === "edit" && pages.get(parts[1])) { html = viewEditor(pages.get(parts[1]), false); title = "Edit · GrappleWiki"; }
    else if (parts[0] === "new") {
      html = viewEditor(null, true, { name: params.get("name") || "", from: params.get("from") || "", col: params.get("col") || "", counters: params.get("counters") || "" });
      title = "New page · GrappleWiki";
    }
    if (!html) html = `<article class="page"><h1>Page not found</h1><p><a href="#/">Back to home</a></p></article>`;

    app.innerHTML = html;
    document.title = title;
    wireEditor();
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
  document.getElementById("exportBtn").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify({ edits, custom }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "grapplewiki-edits.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
  document.getElementById("importInput").addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;
    file.text().then(txt => {
      const data = JSON.parse(txt);
      edits = Object.assign(edits, data.edits || {});
      custom = Object.assign(custom, data.custom || {});
      save(EDITS_KEY, edits); save(CUSTOM_KEY, custom);
      buildIndex(); route();
    }).catch(() => alert("That file isn't a valid GrappleWiki export."));
    e.target.value = "";
  });

  route();
})();
