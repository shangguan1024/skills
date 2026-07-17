---
name: sdd-summary
description: Generate a single-page (1920×1080) HTML summary of a completed SDD-Workflow run. Use when the user says "生成 sdd 总结", "总结页", or "sdd summary", or after sdd_complete. Reads SDD artifacts, fills templates/summary.html placeholders, asks the user for subjective fields, and writes docs/features/<feature>/summary.html.
---

# SDD Workflow Summary

Generate a one-page PPT-sized (1920×1080, 16:9) HTML summary of a completed SDD-Workflow feature run, in the "Quiet ledger" frontend-design style.

## When to use
- User says "生成 sdd 总结" / "总结页" / "sdd summary"
- After `sdd_complete` (workflow finished)

## What it produces
`docs/features/<feature>/summary.html` — a self-contained, single 1920×1080 page covering 6 blocks: AR/ISSUE 需求, 开发工作流, per-phase skills+outputs, 人工参与+耗时, AI辅助效果评估, 代码/测试/效率. The phase timeline (Layout B) is the signature.

## Files in this skill
- `templates/summary.html` — the fixed 1920×1080 layout with `{{PLACEHOLDER}}` tokens
- `reference/placeholder-map.md` — authoritative placeholder ↔ data-source table

## Workflow (follow exactly)
1. Read `.sdd/state.json`. If missing → tell the user to run `sdd_init`/`sdd_start` first and STOP. Do not crash.
2. Read all SDD artifacts (skip any missing for the current phase gracefully):
   - `.sdd/state.json` (`featureName`, `currentPhase`, `gateApprovals`)
   - `.sdd/checkpoint.json` (git SHA per phase)
   - `.sdd/workflow_config.json` (`skills` / `additional_skills` per phase)
   - `docs/features/<feature>/findings.md` (Phase 0 requirements)
   - `docs/features/<feature>/design.md` (Phase 1 modules)
   - `docs/features/<feature>/task_plan.md` (Phase 2 tasks/files)
   - memory nodes via `sdd_memory_timeline` / `sdd_memory_details` (decisions, skill history)
   - `git log` / `git diff --stat` (code volume)
   - test command output (correctness)
3. Open `reference/placeholder-map.md`. For every placeholder marked "AI", extract the value from the matching artifact.
4. Draft the subjective placeholders (`{{HUMAN_PHASES}}`, `{{HUMAN_COST}}`, `{{AI_EVAL}}`, `{{OUTCOME_DETAIL}}`) from memory/timestamps and propose them to the user.
5. Ask the user for the hero headline numbers: `{{EFFICIENCY}}` (%), `{{BASELINE_DAYS}}`, `{{ACTUAL_DAYS}}` (person-days). Confirm the drafted 4/5/6 blocks.
6. For each timeline node `{{Pn_STATE}}` (n=0..6): set `"done"` if phase n ≤ currentPhase (or approved in gateApprovals), else empty string `""`.
7. Read `templates/summary.html`. Replace every `{{...}}` token with its value. Any token you cannot fill → replace with `—` (em dash) so the layout never breaks. **⚠️ UTF-8 generation (critical on Windows):** the template's static text and many values are non-ASCII (CJK, `·`, `→`, `—`). On Windows the default console codepage is often GBK (936), under which `Get-Content -Raw` (no `-Encoding`) and non-ASCII literals passed on the command line get mis-decoded → mojibake in the output. Generate via a **UTF-8-safe path**: prefer a small Node script (Node reads/writes UTF-8 natively) — read the template with `fs.readFileSync(p,'utf8')`, keep the values as JS string literals in the script source (the script file itself is UTF-8), substitute, and write with `fs.writeFileSync(p, out, 'utf8')`. If you must use PowerShell: read with `Get-Content -Raw -Encoding UTF8`, write with `Set-Content -Encoding UTF8`, and keep non-ASCII values OUT of the command line (load them from a UTF-8 file instead).
8. Write the filled HTML to `docs/features/<feature>/summary.html`.
9. Tell the user the path and suggest opening at 1920×1080 (or printing to PDF for a slide).

## Robustness rules
- Never leave a raw `{{...}}` in the output — unfilled → `—`.
- Not a git repo → `{{LOC}}` = "N/A".
- Missing per-phase artifact → that node's `{{Pn_OUT}}` = "—"; the block keeps `—` fallbacks.
- Output HTML is fully self-contained: inline CSS + Google Fonts `@import`, no local assets, no build, no JS.
- **UTF-8 / encoding (Windows critical):** on a GBK (936) codepage, plain `Get-Content -Raw` and command-line non-ASCII literals corrupt CJK and symbols (`·`, `→`, `—`) into mojibake. Always generate via a UTF-8-safe path — prefer a Node script (`fs.readFileSync(p,'utf8')` / `fs.writeFileSync(p, out,'utf8')`, values as UTF-8 JS literals); in PowerShell use `-Encoding UTF8` for read+write and keep non-ASCII values out of the command line. The output file itself must be UTF-8; the browser reads it via `<meta charset="utf-8">`.

## Notes
- The aesthetic (Quiet ledger) and layout (B) are baked into the template — do not restyle per run.
- `{{Pn_STATE}}` tokens implement the spec's "completed/current phases filled teal; future hollow" rule via pure string replacement.
