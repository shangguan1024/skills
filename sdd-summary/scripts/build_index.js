#!/usr/bin/env node
/**
 * Build the SDD requirement index (aggregate) HTML — catalog style.
 *
 * Reads an inclusion list (domain-map.json) and, per feature, that feature's
 * stats.json + summary.html. Writes a self-contained catalog page grouped by
 * domain; each row links to the feature's standalone summary.html (new tab)
 * and shows AI/human code + efficiency inline.
 *
 * Usage:
 *   node build_index.js --root <repo-root> --map <docs/sdd-index-map.json> [--out <docs/sdd-index.html>]
 *
 * domain-map.json (inclusion list — what the user chose to show):
 *   { "generated": "2026-07-17",
 *     "features": [ {"name":"logger-level-filter","domain":"日志","req":"可配置日志级别过滤","date":"2026-07-10"} ] }
 *
 * Per-feature stats.json (written by the single-page workflow):
 *   { "feature":"...","ai_loc":380,"human_loc":32,"total":412,"efficiency":92,"date":"...","start_sha":"...","generated_at":"..." }
 */
const fs = require("fs");
const path = require("path");
const { parseArgs } = require("util");

const args = parseArgs({
  options: {
    root: { type: "string", default: process.cwd() },
    map: { type: "string" },
    out: { type: "string" },
  },
});

const root = args.values.root;
const mapPath = args.values.map || path.join(root, "docs", "features", "sdd-index-map.json");
const outPath = args.values.out || path.join(root, "docs", "features", "sdd-index.html");

if (!fs.existsSync(mapPath)) {
  console.error(`error: inclusion map not found: ${mapPath}`);
  process.exit(1);
}

const map = JSON.parse(fs.readFileSync(mapPath, "utf8").replace(/^\uFEFF/, ""));
const features = map.features || [];

const docsDir = path.join(root, "docs");

function readJSON(p) {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8").replace(/^\uFEFF/, ""));
  } catch {
    return null;
  }
}

const rows = [];
let missingSummary = 0;
let missingStats = 0;
for (const f of features) {
  const name = f.name;
  const sumPath = path.join(docsDir, "features", name, "summary.html");
  const statsPath = path.join(docsDir, "features", name, "stats.json");
  const hasSummary = fs.existsSync(sumPath);
  const stats = readJSON(statsPath);
  if (!hasSummary) missingSummary++;
  if (!stats) missingStats++;
  rows.push({
    name,
    domain: f.domain || "未分类",
    req: f.req || name,
    date: f.date || (stats && stats.date) || "",
    hasSummary,
    ai: stats ? stats.ai_loc : null,
    human: stats ? stats.human_loc : null,
    eff: stats ? stats.efficiency : null,
  });
}

// Group by domain (preserve first-seen, then alphabetical)
const byDomain = new Map();
for (const r of rows) {
  if (!byDomain.has(r.domain)) byDomain.set(r.domain, []);
  byDomain.get(r.domain).push(r);
}
const domains = [...byDomain.keys()].sort((a, b) => a.localeCompare(b, "zh"));

const dateStr = map.generated || new Date().toISOString().slice(0, 10);
const count = rows.length;

const html = `<!DOCTYPE html>
<html lang="zh">
<head>
<meta charset="utf-8">
<title>SDD 需求汇总</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600&family=Noto+Sans+SC:wght@400;500;600;700&family=Noto+Serif+SC:wght@500;600;700&display=swap');
:root{
  --paper:#F6F3EC; --ink:#1B1C1E; --accent:#0E5E52; --muted:#6B6256;
  --card:#EFE9DB; --rule:#D9D3C4;
  --display:'Fraunces','Source Han Serif SC','思源宋体','Noto Serif SC','Microsoft YaHei UI','Microsoft YaHei',serif;
  --body:'Inter','Source Han Sans SC','思源黑体','Noto Sans SC','Microsoft YaHei UI','Microsoft YaHei','PingFang SC',sans-serif;
  --mono:'JetBrains Mono',Consolas,monospace;
}
*{box-sizing:border-box; margin:0; padding:0;}
html,body{background:#2b2b2b;}
body{font-family:var(--body); color:var(--ink); padding:32px 20px;}
.wrap{max-width:1280px; margin:0 auto;}
.page{background:var(--paper); border-radius:10px; padding:28px 36px 40px; box-shadow:0 24px 70px rgba(0,0,0,.45);}
.head{display:flex; align-items:baseline; justify-content:space-between; border-bottom:1px solid var(--rule); padding-bottom:16px; margin-bottom:22px;}
.head h1{font-family:var(--display); font-weight:700; font-size:30px; color:var(--accent);}
.head .meta{font-family:var(--mono); font-size:13px; color:var(--muted);}
.domain{margin-bottom:26px;}
.domain h2{font-family:var(--display); font-weight:600; font-size:22px; color:var(--accent); margin-bottom:10px; display:flex; align-items:baseline; gap:10px;}
.domain h2 .cnt{font-family:var(--mono); font-size:12px; color:var(--muted); font-weight:500;}
table{width:100%; border-collapse:collapse; background:var(--card); border:1px solid var(--rule); border-radius:6px; overflow:hidden;}
thead th{font-family:var(--mono); font-size:11px; color:var(--muted); text-align:left; padding:9px 14px; background:var(--paper); border-bottom:1px solid var(--rule); letter-spacing:.4px; white-space:nowrap;}
thead th.num,thead th.r{text-align:right;}
tbody td{padding:11px 14px; border-top:1px solid var(--rule); font-size:14px; vertical-align:middle;}
tbody td.name{font-family:var(--display); font-weight:600; color:var(--accent); font-size:15px;}
tbody td.name a{color:inherit; text-decoration:none; display:inline-flex; align-items:center; gap:8px;}
tbody td.name a:hover{text-decoration:underline;}
tbody td.name .chev{color:var(--muted); font-size:11px;}
tbody td.req{color:var(--ink); line-height:1.5;}
tbody td.num{font-family:var(--mono); font-size:14px; text-align:right; white-space:nowrap;}
tbody td.num.ai{color:var(--accent); font-weight:600;}
tbody td.num.human{color:var(--ink);}
tbody td.num.eff{font-family:var(--display); font-weight:700; font-size:17px; color:var(--accent);}
tbody td.num .u{font-family:var(--body); font-size:11px; color:var(--muted); margin-left:3px;}
tbody td.num .dash{color:var(--muted);}
tbody td.date{font-family:var(--mono); font-size:12px; color:var(--muted); white-space:nowrap;}
tbody tr.missing td.name a{color:var(--muted); pointer-events:none;}
tbody tr.missing td.name .miss{font-family:var(--body); font-size:11px; color:var(--muted);}
.foot{margin-top:28px; font-family:var(--mono); font-size:11.5px; color:var(--muted); text-align:center;}
</style>
</head>
<body>
<div class="wrap"><div class="page">
  <div class="head">
    <h1>SDD 需求汇总</h1>
    <div class="meta">${dateStr} · ${count} 个需求${missingSummary ? ` · ${missingSummary} 个缺 summary` : ""}${missingStats ? ` · ${missingStats} 个缺统计` : ""}</div>
  </div>
${domains.map((d) => domainSection(d, byDomain.get(d))).join("\n")}
  <div class="foot">点击需求名打开其 SDD summary(独立页)· 数据来自各 feature 的 stats.json</div>
</div></div>
</body>
</html>`;

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, html, "utf8");
console.log(
  `wrote ${outPath} (${count} features, ${domains.length} domains` +
    `${missingSummary ? `, ${missingSummary} missing summary` : ""}` +
    `${missingStats ? `, ${missingStats} missing stats` : ""})`,
);

function domainSection(domain, feats) {
  return `  <section class="domain">
    <h2>${esc(domain)} <span class="cnt">${feats.length} 个需求</span></h2>
    <table>
      <thead><tr><th>需求</th><th>需求规格描述</th><th class="num">AI 代码</th><th class="num">人工代码</th><th class="num r">提效</th><th>日期</th></tr></thead>
      <tbody>
${feats.map(rowHtml).join("\n")}
      </tbody>
    </table>
  </section>`;
}

function rowHtml(r) {
  const cls = r.hasSummary ? "" : " missing";
  const href = `${encodeURIComponent(r.name)}/summary.html`;
  const miss = r.hasSummary ? "" : ` <span class="miss">· summary 缺失</span>`;
  const ai = r.ai != null ? `${esc(r.ai)}<span class="u">行</span>` : `<span class="dash">—</span>`;
  const human = r.human != null ? `${esc(r.human)}<span class="u">行</span>` : `<span class="dash">—</span>`;
  const eff = r.eff != null ? `${esc(r.eff)}<span class="u">%</span>` : `<span class="dash">—</span>`;
  return `        <tr class="${cls.trim()}">
          <td class="name"><a href="${href}" target="_blank" rel="noopener"><span class="chev">▶</span>${esc(r.name)}</a>${miss}</td>
          <td class="req">${esc(r.req)}</td>
          <td class="num ai">${ai}</td>
          <td class="num human">${human}</td>
          <td class="num eff">${eff}</td>
          <td class="date">${esc(r.date)}</td>
        </tr>`;
}

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
