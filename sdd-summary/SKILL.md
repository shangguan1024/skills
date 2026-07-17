---
name: sdd-summary
description: Generate a single-page (1920×1080) HTML summary of a completed SDD-Workflow run, and an aggregate requirement index that merges multiple SDD summaries grouped by domain. Use when the user says "生成 sdd 总结" / "总结页" / "sdd summary" (single page) OR "生成 sdd 汇总" / "需求汇总" / "sdd index" (aggregate), or after sdd_complete. Use this whenever the user wants to summarize or roll up SDD work — even if they don't say "summary" explicitly.
---

# SDD Workflow Summary

Produce HTML summaries of SDD-Workflow runs in the "Quiet ledger" aesthetic. Two deliverables:

1. **Single page** — `docs/features/<feature>/summary.html`: a 1920×1080 matrix (phases × dimensions) + summary bar.
2. **Aggregate index** — `docs/features/sdd-index.html`: a domain-grouped, click-to-expand index of all single-page summaries.

## When to use
- "生成 sdd 总结" / "总结页" / "sdd summary" → **single page** (also after `sdd_complete`).
- "生成 sdd 汇总" / "需求汇总" / "sdd index" → **aggregate index**.

## Files in this skill
- `templates/summary.html` — the fixed 1920×1080 matrix layout with `{{PLACEHOLDER}}` tokens.
- `reference/placeholder-map.md` — authoritative placeholder ↔ data-source table (42 tokens).
- `scripts/count_loc.py` — AI-vs-human code split from git history (commits whose message matches `Co-Authored-By:\s*Agent` = AI).
- `scripts/build_index.js` — aggregate index generator (catalog grouped by domain; rows link to each feature's standalone summary.html and show AI/human LOC + efficiency read from per-feature `stats.json`).

---

## Single-page workflow

1. Read `.sdd/state.json`. If missing → tell the user to run `sdd_init`/`sdd_start` first and STOP. Do not crash.
2. Read SDD artifacts (skip missing ones gracefully):
   - `.sdd/state.json` — `featureName`, `currentPhase`, `gateApprovals`
   - `.sdd/checkpoint.json` — git SHA per phase (Phase-0 SHA = code-count `--start`)
   - `.sdd/workflow_config.json` — `skills` / `additional_skills` per phase
   - `docs/features/<feature>/findings.md` (Phase 0 → `{{REQ_SUMMARY}}`)
   - `docs/features/<feature>/design.md` (Phase 1)
   - `docs/features/<feature>/task_plan.md` (Phase 2 → module files for `{{P3_OUT}}`)
   - memory nodes via `sdd_memory_timeline` / `sdd_memory_details` (decisions, issues, human involvement)
   - test command output (correctness → `{{P4_OUT}}`)
3. Run the code split:
   ```
   python scripts/count_loc.py --repo <repo> [--start <phase0-sha>]
   ```
   Read `ai_loc`, `human_loc`. `{{EFFICIENCY}}` = `round(ai_loc / (ai_loc + human_loc) * 100)`. If `total == 0` → `{{EFFICIENCY}}`, `{{AI_LOC}}`, `{{HUMAN_LOC}}` all = `—`. Default agent marker is the literal trailer `Co-Authored-By: Agent`; if the project's convention differs (e.g. `Claude`), pass `--agent-regex`. Also persist these to `docs/features/<feature>/stats.json` (UTF-8, no BOM) so the aggregate index can show them per-row: `{feature, start_sha, ai_loc, human_loc, total, efficiency, date, generated_at}`.
4. Open `reference/placeholder-map.md` and fill every token from its source. Per phase (n = 0..6):
   - `{{Pn_STATE}}` = `done` if n < currentPhase; `current` if n == currentPhase; `future` if n > currentPhase. If all of `gateApprovals[0..6]` are approved → all `done`.
   - `{{Pn_SKILL}}` = `workflow_config` phases[n] `skills` (primary), joined with a newline — **one skill per line** (usually one).
   - `{{Pn_ADD}}` = phases[n] `additional_skills`, each prefixed `+ ` and joined with a newline (one per line, e.g. `+ rust-best-practices`); empty string `""` if none — the template's `.add` span auto-hides when empty, and primaries vs additionals are visually distinct (bold mono vs small muted).
   - `{{Pn_OUT}}` = that phase's artifact (findings.md / design.md / task_plan.md / module files / test results / review notes / persisted memory); multiple files joined ` · `; missing → `—`.
   - `{{Pn_HUMAN}}` / `{{Pn_ISSUE}}` = draft from memory + `gateApprovals[n]` (human involvement / issues·workarounds in that phase); none → `—`.
5. Draft the subjective cells (`{{Pn_HUMAN}}`, `{{Pn_ISSUE}}`, `{{OUTCOME_DETAIL}}`) from memory/timestamps and propose them to the user; confirm before writing.
6. Read `templates/summary.html`. Replace every `{{...}}` token with its value. Any token you cannot fill → `—` so the layout never breaks.
7. Write the filled HTML to `docs/features/<feature>/summary.html`.
8. Tell the user the path; suggest viewing at 1920×1080 (or printing to PDF for a slide).
9. Ask the user: "是否将本次 summary 纳入 `docs/features/sdd-index.html`?" 
   - If **yes** → propose this feature's **domain** (drafted from `findings.md`); let the user confirm/adjust. Then **add or update** this feature's entry in the persistent inclusion list `docs/features/sdd-index-map.json` (schema `{name, domain, req, date}`; `date` = this summary's `{{DATE}}`). Re-run `node scripts/build_index.js --root <repo>` (defaults to `--map docs/features/sdd-index-map.json --out docs/features/sdd-index.html`). It reads each included feature's `stats.json` for the AI/human/efficiency columns and links each row to that feature's `summary.html`. Tell the user the index was updated.
   - If **no** → stop. The standalone `summary.html` (+ `stats.json`) is still saved.

## Aggregate-index workflow

Use this for a bulk refresh / re-selection of the catalog (the per-summary run already offers incremental updates via step 9 above). The inclusion list `docs/features/sdd-index-map.json` is **persistent** — it accumulates across runs.

1. Scan `docs/features/*/summary.html`. If none exist → tell the user to generate single-page summaries first and STOP.
2. For each feature dir, read its `findings.md` → draft a **domain** label + a one-line **req** summary. (The AI/human/efficiency numbers come from each feature's `stats.json`, read at build time — no need to capture them here.)
3. Present the proposed `feature → domain` table to the user and ask them to confirm/adjust (rename a domain, merge two, move a feature, **drop** a feature from the index). Only proceed once confirmed. This is the "choose which requirements to display" gate.
4. Write/update the persistent inclusion list `docs/features/sdd-index-map.json` (UTF-8, no BOM):
   ```json
   { "generated": "2026-07-17",
     "features": [ {"name":"logger-level-filter","domain":"日志","req":"可配置日志级别过滤","date":"2026-07-10"} ] }
   ```
   `date` = that feature's last commit date (or its summary's `{{DATE}}`).
5. Run:
   ```
   node scripts/build_index.js --root <repo>            # defaults: --map docs/features/sdd-index-map.json --out docs/features/sdd-index.html
   ```
   Each row links to the feature's standalone `docs/features/<name>/summary.html` (new tab) and shows `AI 代码` / `人工代码` / `提效%` from that feature's `stats.json` (missing → `—`).
6. Tell the user the path. The catalog page is self-contained (inline CSS); it links to the sibling per-feature `summary.html` files, so open via `file://` or serve the folder with `python -m http.server`.

## Robustness rules
- Never leave a raw `{{...}}` in any output — unfilled → `—`.
- Not a git repo / no commits → `{{AI_LOC}}`, `{{HUMAN_LOC}}`, `{{EFFICIENCY}}` = `—`.
- Missing per-phase artifact → that cell = `—`; the matrix keeps `—` fallbacks.
- Single-page output is fully self-contained: inline CSS + Google Fonts `@import`, no local assets, no JS.
- **UTF-8 / encoding (Windows critical):** on a GBK (936) codepage, plain `Get-Content -Raw` and command-line non-ASCII literals corrupt CJK and symbols (`·`, `→`, `—`) into mojibake. Always generate via a UTF-8-safe path — prefer a Node script (`fs.readFileSync(p,'utf8')` / `fs.writeFileSync(p, out,'utf8')`, values as UTF-8 JS literals); in PowerShell use `-Encoding UTF8` for read+write and keep non-ASCII values out of the command line. The output file itself must be UTF-8; the browser reads it via `<meta charset="utf-8">`.

## Notes
- The aesthetic (Quiet ledger) and the matrix layout are baked into the template — do not restyle per run.
- `{{Pn_STATE}}` implements the "completed phases filled teal; current outlined; future hollow" rule via pure string replacement, reused across each phase column's header + 4 cells.
- Fonts: Fraunces (Latin display) + Source Han / Noto Serif SC (CJK display); Inter + Source Han Sans / Noto Sans SC (CJK body). The fallback chain deliberately avoids SimSun (宋体) so Windows-without-web-fonts still looks clean.
