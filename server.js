// GrappleWiki local server.
// Serves the wiki and saves edits made in the browser to the page files in ./pages.
// Usage:  node server.js        (then open http://localhost:8417)
"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");
const { KINDS, HEADER_FIELDS, ID_RE, parsePage, serializePage } = require("./pagefile");

const ROOT = __dirname;
const PAGES_DIR = path.join(ROOT, "pages");
const WIKI_FILE = path.join(ROOT, "wiki.json");
const CORE_GAME_FILE = path.join(ROOT, "core-game.json"); // the game built on the Core game page
const PORT = Number(process.env.PORT) || 8417;
const HOST = process.env.HOST || "127.0.0.1"; // only reachable from this computer
const STATIC = {
  "/": ["index.html", "text/html; charset=utf-8"],
  "/index.html": ["index.html", "text/html; charset=utf-8"],
  "/app.js": ["app.js", "text/javascript; charset=utf-8"],
  "/styles.css": ["styles.css", "text/css; charset=utf-8"]
};
const MAX_BODY = 512 * 1024;
const LAYOUT_KEYS = ["layout", "simpleLayout"]; // full and simplified home grids

// ---------- files ----------
const kindDir = kind => path.join(PAGES_DIR, KINDS[kind]);
const pageFile = (kind, id) => path.join(kindDir(kind), id + ".md");

function writeFileAtomic(file, text) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = file + ".tmp";
  fs.writeFileSync(tmp, text, "utf8");
  fs.renameSync(tmp, file);
}

function readCoreGame() {
  try { return JSON.parse(fs.readFileSync(CORE_GAME_FILE, "utf8")); }
  catch (e) { return { picks: {} }; }
}

function readWikiJson() {
  try { return JSON.parse(fs.readFileSync(WIKI_FILE, "utf8")); }
  catch (e) { return { layout: [], aliases: {}, wanted: [] }; }
}
function writeWikiJson(data) { writeFileAtomic(WIKI_FILE, JSON.stringify(data, null, 2) + "\n"); }

function readAllPages() {
  const out = { positions: [], techniques: [], concepts: [] };
  for (const [kind, dir] of Object.entries(KINDS)) {
    let files = [];
    try { files = fs.readdirSync(kindDir(kind)); } catch (e) { continue; }
    files.filter(f => f.endsWith(".md")).sort().forEach(f => {
      const id = f.slice(0, -3);
      if (!ID_RE.test(id)) return;
      try {
        out[dir].push(Object.assign(parsePage(fs.readFileSync(path.join(kindDir(kind), f), "utf8")), { id }));
      } catch (e) {
        console.warn(`Skipping ${dir}/${f}: ${e.message}`);
      }
    });
  }
  return out;
}

function findPage(id) {
  for (const kind of Object.keys(KINDS)) if (fs.existsSync(pageFile(kind, id))) return kind;
  return null;
}

// Keep only known fields with sane types.
function clean(kind, input) {
  const str = v => (typeof v === "string" ? v.trim() : v == null ? "" : String(v).trim());
  const idOrNull = v => (typeof v === "string" && ID_RE.test(v) ? v : null);
  const page = {
    name: str(input.name).replace(/\s+/g, " ").slice(0, 200),
    summary: str(input.summary),
    steps: Array.isArray(input.steps) ? input.steps.map(s => str(s).replace(/\s*\n\s*/g, " ")).filter(Boolean) : [],
    video: str(input.video).split(/\s/)[0],
    notes: str(input.notes)
  };
  if (kind === "position") {
    page.side = ["top", "bottom", "neutral"].includes(input.side) ? input.side : "neutral";
    page.counterpart = idOrNull(input.counterpart);
  }
  if (kind === "technique") {
    page.from = idOrNull(input.from);
    page.to = idOrNull(input.to);
    page.col = input.col === "sub" ? "sub" : "transition";
    page.type = str(input.type).toLowerCase().slice(0, 40) || null;
    page.status = input.status === "complete" ? "complete" : "draft";
    // how to stop this move: a paragraph plus optional steps, shown on this page
    page.defense = str(input.defense);
    page.defenseSteps = Array.isArray(input.defenseSteps) ? input.defenseSteps.map(s => str(s).replace(/\s*\n\s*/g, " ")).filter(Boolean) : [];
  }
  if (kind !== "position" && Number.isFinite(Number(input.order)) && input.order !== null && input.order !== "") page.order = Math.round(Number(input.order));
  if (!page.name) throw new HttpError(400, "A page needs a name.");
  return page;
}

function slugify(s) {
  return String(s).toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || "page";
}

function nextOrder(kind) {
  if (kind === "position") return undefined;
  const list = readAllPages()[KINDS[kind]];
  return list.reduce((m, p) => Math.max(m, Number(p.order) || 0), 0) + 10;
}

// ---------- http helpers ----------
class HttpError extends Error { constructor(status, msg) { super(msg); this.status = status; } }

function send(res, status, body, type) {
  const isJson = typeof body !== "string" && !Buffer.isBuffer(body);
  res.writeHead(status, {
    "Content-Type": isJson ? "application/json; charset=utf-8" : type,
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff"
  });
  res.end(isJson ? JSON.stringify(body) : body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on("data", c => {
      size += c.length;
      if (size > MAX_BODY) { reject(new HttpError(413, "Request too large.")); req.destroy(); return; }
      chunks.push(c);
    });
    req.on("end", () => {
      try { resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : {}); }
      catch (e) { reject(new HttpError(400, "Invalid JSON.")); }
    });
    req.on("error", reject);
  });
}

// Writes must come from the wiki page itself, not from another website.
function checkOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return;
  const host = req.headers.host;
  if (origin !== `http://${host}`) throw new HttpError(403, "Cross-origin request refused.");
}

// ---------- api ----------
async function api(req, res, parts) {
  // GET /api/wiki  -> everything the app needs
  if (req.method === "GET" && parts[0] === "wiki" && parts.length === 1) {
    return send(res, 200, Object.assign(readAllPages(), readWikiJson(), { coreGame: readCoreGame() }));
  }

  // PUT /api/core-game  -> save the Core game picks: { picks: { positionId: { subs: [id, id], transitions: [id, id] } } }
  if (req.method === "PUT" && parts[0] === "core-game" && parts.length === 1) {
    checkOrigin(req);
    const body = await readBody(req);
    if (!body.picks || typeof body.picks !== "object") throw new HttpError(400, "Send picks as an object.");
    const ids = list => (Array.isArray(list) ? list.slice(0, 2).map(v => (typeof v === "string" && ID_RE.test(v) ? v : null)) : []);
    const picks = {};
    for (const [pos, pick] of Object.entries(body.picks)) {
      if (!ID_RE.test(pos) || !pick) continue;
      const subs = ids(pick.subs), transitions = ids(pick.transitions);
      if (subs.some(Boolean) || transitions.some(Boolean)) picks[pos] = { subs, transitions };
    }
    writeFileAtomic(CORE_GAME_FILE, JSON.stringify({ picks }, null, 2) + "\n");
    return send(res, 200, { picks });
  }

  if (req.method !== "GET") checkOrigin(req);

  // PUT /api/layout  -> update the full grid ("layout") and/or the simplified grid ("simpleLayout")
  if (req.method === "PUT" && parts[0] === "layout" && parts.length === 1) {
    const body = await readBody(req);
    const keys = LAYOUT_KEYS.filter(k => body[k] !== undefined);
    if (!keys.length || keys.some(k => !Array.isArray(body[k]))) throw new HttpError(400, "Send layout and/or simpleLayout as arrays.");
    const wiki = readWikiJson();
    const out = {};
    keys.forEach(k => {
      out[k] = wiki[k] = body[k].map(s => ({
        cat: String(s.cat), groups: (s.groups || []).map(g => ({
          group: String(g.group), positions: (g.positions || []).filter(id => ID_RE.test(id))
        }))
      }));
    });
    writeWikiJson(wiki);
    return send(res, 200, out);
  }

  if (parts[0] !== "pages") throw new HttpError(404, "Not found.");
  const kind = parts[1];
  if (!KINDS[kind]) throw new HttpError(400, "Unknown page type.");

  // POST /api/pages/:kind  -> create
  if (req.method === "POST" && parts.length === 2) {
    const page = clean(kind, await readBody(req));
    let id = slugify(page.name), n = 2;
    while (findPage(id)) id = `${slugify(page.name)}-${n++}`;
    if (kind !== "position" && page.order === undefined) page.order = nextOrder(kind);
    writeFileAtomic(pageFile(kind, id), serializePage(kind, page));
    console.log(`created ${KINDS[kind]}/${id}.md`);
    return send(res, 201, Object.assign(page, { id }));
  }

  const id = parts[2];
  if (parts.length !== 3 || !ID_RE.test(id)) throw new HttpError(400, "Bad page id.");
  const file = pageFile(kind, id);
  if (!fs.existsSync(file)) throw new HttpError(404, "No such page.");

  // PUT /api/pages/:kind/:id  -> save
  if (req.method === "PUT") {
    const existing = parsePage(fs.readFileSync(file, "utf8"));
    const page = clean(kind, await readBody(req));
    if (kind !== "position" && page.order === undefined && existing.order !== undefined) page.order = existing.order;
    writeFileAtomic(file, serializePage(kind, page));
    console.log(`saved ${KINDS[kind]}/${id}.md`);
    return send(res, 200, Object.assign(page, { id }));
  }

  // DELETE /api/pages/:kind/:id
  if (req.method === "DELETE") {
    fs.unlinkSync(file);
    if (kind === "position") {
      const wiki = readWikiJson();
      LAYOUT_KEYS.forEach(k => (wiki[k] || []).forEach(s => s.groups.forEach(g => { g.positions = g.positions.filter(p => p !== id); })));
      writeWikiJson(wiki);
    }
    console.log(`deleted ${KINDS[kind]}/${id}.md`);
    return send(res, 200, { deleted: id });
  }

  throw new HttpError(405, "Method not allowed.");
}

// ---------- server ----------
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    if (url.pathname.startsWith("/api/")) {
      const parts = url.pathname.slice(5).split("/").filter(Boolean).map(decodeURIComponent);
      return await api(req, res, parts);
    }
    const entry = STATIC[url.pathname];
    if (!entry || (req.method !== "GET" && req.method !== "HEAD")) throw new HttpError(404, "Not found.");
    return send(res, 200, fs.readFileSync(path.join(ROOT, entry[0])), entry[1]);
  } catch (e) {
    const status = e.status || 500;
    if (status === 500) console.error(e);
    if (!res.headersSent) send(res, status, { error: status === 500 ? "Server error." : e.message });
  }
});

if (require.main === module) {
  server.listen(PORT, HOST, () => {
    console.log(`GrappleWiki running at http://localhost:${PORT}`);
    console.log(`Pages are read from and saved to ${PAGES_DIR}`);
  });
}

module.exports = { server, readAllPages };
