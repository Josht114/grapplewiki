// Reads and writes GrappleWiki page files.
//
// A page file is Markdown with a small header ("front matter"):
//
//   ---
//   name: Kimura
//   from: top-side-control
//   col: sub
//   type: submission
//   attire: both         (techniques only: gi, no-gi or both)
//   status: draft
//   ---
//   One-paragraph summary.
//
//   ## Key steps
//
//   1. First step.
//   2. Second step.
//
//   ## Detailed breakdown  (techniques only: a longer how-to)
//
//   ### A sub-heading
//   - A detail.
//   Plain lines are paragraphs.
//
//   ## Defense            (techniques only: how to stop this move)
//
//   How the defender stops it.
//
//   1. First defense step.
//
//   ## Images
//
//   ![Caption](https://example.com/photo.jpg)   (one per line)
//
//   ## Video
//
//   https://youtube.com/...
//
//   ## Notes
//
//   Free text. Link other pages with [[Page name]].

"use strict";

const KINDS = { position: "positions", technique: "techniques", concept: "concepts" };
const HEADER_FIELDS = {
  position: ["name", "side", "counterpart"],
  technique: ["name", "from", "to", "col", "type", "attire", "status", "order"],
  concept: ["name", "order"]
};
const BODY_FIELDS = ["summary", "steps", "breakdown", "defense", "defenseSteps", "images", "video", "notes"];
const numbered = l => /^\s*(?:\d+[.)]|[-*])\s+/.test(l);
const stripNumber = l => l.replace(/^\s*(?:\d+[.)]|[-*])\s+/, "").trim();
const ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function parseValue(v) {
  if (v === "" || v === "null" || v === "~") return null;
  if (v.startsWith("[") && v.endsWith("]")) return v.slice(1, -1).split(",").map(s => s.trim()).filter(Boolean);
  if (v.startsWith('"') && v.endsWith('"')) { try { return JSON.parse(v); } catch (e) { return v.slice(1, -1); } }
  if (/^-?\d+$/.test(v)) return Number(v);
  return v;
}

function formatValue(v) {
  if (Array.isArray(v)) return "[" + v.join(", ") + "]";
  if (typeof v === "number") return String(v);
  const s = String(v);
  const risky = /^[\s"'[\]{}#&*!|>%@`-]|: | #|\s$|\n/.test(s) || /^(null|~|-?\d+)$/.test(s);
  return risky ? JSON.stringify(s) : s;
}

function parsePage(text) {
  text = String(text).replace(/^﻿/, "").replace(/\r\n/g, "\n");
  const page = {};
  let body = text;
  const m = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (m) {
    body = m[2];
    m[1].split("\n").forEach(line => {
      const i = line.indexOf(":");
      if (i < 1 || line.trim().startsWith("#")) return;
      page[line.slice(0, i).trim()] = parseValue(line.slice(i + 1).trim());
    });
  }
  const parts = body.split(/^## +(.+)$/m); // [intro, heading1, content1, heading2, content2, ...]
  const summary = parts[0].trim();
  if (summary) page.summary = summary;
  const extra = [];
  for (let i = 1; i < parts.length; i += 2) {
    const heading = parts[i].trim();
    const content = (parts[i + 1] || "").trim();
    const h = heading.toLowerCase();
    if (h === "key steps" || h === "key points" || h === "steps") {
      page.steps = content.split("\n").map(l => l.replace(/^\s*(?:\d+[.)]|[-*])\s+/, "").trim()).filter(Boolean);
    } else if (h === "detailed breakdown" || h === "breakdown") {
      page.breakdown = content;
    } else if (h === "images") {
      page.images = content.split("\n").map(l => l.trim()).filter(Boolean);
    } else if (h === "video") {
      page.video = content;
    } else if (h === "defense" || h === "defence") {
      // paragraph(s) describing the defense, then an optional numbered list of steps
      const lines = content.split("\n");
      page.defense = lines.filter(l => !numbered(l)).join("\n").trim();
      page.defenseSteps = lines.filter(numbered).map(stripNumber).filter(Boolean);
    } else if (h === "notes") {
      page.notes = content;
    } else if (content || heading) {
      extra.push("## " + heading + (content ? "\n\n" + content : "")); // keep unknown sections
    }
  }
  if (extra.length) page.notes = [page.notes, ...extra].filter(Boolean).join("\n\n");
  return page;
}

function serializePage(kind, page) {
  const fields = HEADER_FIELDS[kind] || ["name"];
  const others = Object.keys(page).filter(k => !fields.includes(k) && !BODY_FIELDS.includes(k) && k !== "id" && k !== "kind");
  const header = fields.concat(others)
    .filter(k => page[k] !== undefined && page[k] !== null && page[k] !== "" && !(Array.isArray(page[k]) && !page[k].length))
    .map(k => `${k}: ${formatValue(page[k])}`);
  let out = "---\n" + header.join("\n") + "\n---\n";
  if (page.summary) out += page.summary.trim() + "\n";
  if (page.steps && page.steps.length) {
    out += `\n## ${kind === "technique" ? "Key steps" : "Key points"}\n\n` + page.steps.map((s, i) => `${i + 1}. ${s}`).join("\n") + "\n";
  }
  if (page.breakdown) out += "\n## Detailed breakdown\n\n" + page.breakdown.trim() + "\n";
  if (page.defense || (page.defenseSteps && page.defenseSteps.length)) {
    out += "\n## Defense\n\n";
    if (page.defense) out += page.defense.trim() + "\n";
    if (page.defenseSteps && page.defenseSteps.length) out += (page.defense ? "\n" : "") + page.defenseSteps.map((s, i) => `${i + 1}. ${s}`).join("\n") + "\n";
  }
  if (page.images && page.images.length) out += "\n## Images\n\n" + page.images.join("\n") + "\n";
  if (page.video) out +="\n## Video\n\n" + page.video.trim() + "\n";
  if (page.notes) out += "\n## Notes\n\n" + page.notes.trim() + "\n";
  return out;
}

module.exports = { KINDS, HEADER_FIELDS, BODY_FIELDS, ID_RE, parsePage, serializePage };
