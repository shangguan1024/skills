# Placeholder Map — sdd-summary

Authoritative list of the `{{...}}` placeholders in `templates/summary.html` (matrix layout v2). The SKILL.md workflow fills each from the source below. Unfilled → `—` (em dash) so the layout never breaks.

## Summary of blocks

The page is a **phase × dimension matrix** (7 phase columns P0–P6 × 4 dimension rows) plus a header, a requirement line, and a bottom summary bar. There is no timeline block and no separate hero/card blocks — those were dropped in v2.

| # | Token | Block | Source | Who fills |
|---|---|---|---|---|
| 1 | `{{FEATURE}}` | Header | `.sdd/state.json` `featureName` | AI |
| 2 | `{{DATE}}` | Header | today (YYYY-MM-DD) | AI |
| 3 | `{{REQ_SUMMARY}}` | 需求规格描述 | `docs/features/<feature>/findings.md` — one-line requirement summary | AI |
| 4 | `{{P0_STATE}}` … `{{P6_STATE}}` | Phase column coloring (header + that column's 4 cells) | `done` / `current` / `future` — see state rule below | AI |
| 5 | `{{P0_SKILL}}` … `{{P6_SKILL}}` | skill 行 主技能 | `.sdd/workflow_config.json` `phases[n].skills`, joined with `\n` (one per line; usually one) | AI |
| 6 | `{{P0_ADD}}` … `{{P6_ADD}}` | skill 行 附加技能 | `phases[n].additional_skills`, each prefixed `+ ` and joined with `\n` (one per line, e.g. `+ rust-best-practices`); empty string `""` if none (the `.add` span auto-hides when empty) | AI |
| 7 | `{{P0_OUT}}` … `{{P6_OUT}}` | 输出产物 行 | phase artifact (see per-phase artifact map below); multiple files joined with ` · ` | AI |
| 8 | `{{P0_HUMAN}}` … `{{P6_HUMAN}}` | 人工 行 | memory timeline + `gateApprovals[n]`: human-involvement label (e.g. 需求澄清/设计评审/代码走查), else `—`. **Multiple items → one per line, numbered** `1. ...` `2. ...` (joined with `\n`; rendered via the cell's `white-space:pre-line`) | AI drafts, user confirms |
| 9 | `{{P0_ISSUE}}` … `{{P6_ISSUE}}` | 问题 行 | memory nodes (issues / workarounds / `user_notes_summary`) in phase n, else `—`. **Multiple issues → one per line, numbered** `1. ...` `2. ...` (joined with `\n`; rendered via the cell's `white-space:pre-line`) | AI drafts, user confirms |
| 10 | `{{EFFICIENCY}}` | 总结栏 高亮% | AI code share = `round(AI_LOC / (AI_LOC + HUMAN_LOC) * 100)` (from `count_loc.py`) | AI (computed) |
| 11 | `{{AI_LOC}}` | 总结栏 代码量 | `scripts/count_loc.py` → `ai_loc` | AI (script) |
| 12 | `{{HUMAN_LOC}}` | 总结栏 代码量 | `scripts/count_loc.py` → `human_loc` | AI (script) |
| 13 | `{{OUTCOME_DETAIL}}` | 总结栏 文字 | efficiency tips prose (drafted from memory/timestamps + the AI/human split) | AI drafts, user confirms |

**Token count:** 3 (header/req) + 7 (state) + 7 (skill) + 7 (add) + 7 (out) + 7 (human) + 7 (issue) + 4 (summary) = 49.

---

## Phase-state rule (`{{Pn_STATE}}`)

Each phase column gets **one** state string applied to the header cell AND all 4 data cells of that column (the token is reused across the column). Fill with exactly one of:

- `done` — phase n < `currentPhase` (completed)
- `current` — phase n == `currentPhase` (in progress)
- `future` — phase n > `currentPhase` (not started)

Exception: if `gateApprovals` shows every phase 0..6 approved (workflow fully complete), set all phases to `done`.

CSS maps: `done` → solid teal header + faint teal column tint; `current` → teal-outlined header; `future` → muted/hollow.

## Per-phase output artifact (`{{Pn_OUT}}`)

| Phase | Artifact | Fallback |
|---|---|---|
| 0 | `findings.md` (Phase 0 requirement) | `—` |
| 1 | `design.md` (modules) | `—` |
| 2 | `task_plan.md` (tasks/files) | `—` |
| 3 | module files from `task_plan.md` | `—` |
| 4 | test results (test command output, e.g. `24 tests ✓`) | `—` |
| 5 | review notes (Phase 5) | `—` |
| 6 | persisted memory (Phase 6) | `—` |

## AI vs human code (`{{AI_LOC}}`, `{{HUMAN_LOC}}`, `{{EFFICIENCY}}`)

Run `scripts/count_loc.py` and read its JSON:

```
python scripts/count_loc.py --repo <repo> --start <phase0-checkpoint-sha>
```

- A commit is **AI** if its message matches the agent marker (default regex `Co-Authored-By:\s*Agent`, case-insensitive). Otherwise **human**.
  - ⚠️ The default matches the literal trailer `Co-Authored-By: Agent`. If your convention uses a different name (e.g. `Claude`, `Copilot`), pass `--agent-regex 'Co-Authored-By:\s*(Claude|Agent)'`.
- Lines = insertions from `git log --no-merges --numstat` over `<start>..HEAD`.
- `--start` = the Phase-0 checkpoint SHA from `.sdd/checkpoint.json`; if absent, count the whole repo (`HEAD`).
- `{{EFFICIENCY}}` = `round(ai_loc / (ai_loc + human_loc) * 100)`. If `total == 0` → `{{EFFICIENCY}}` = `—`, and both LOC = `—`.

After computing, **persist** these to `docs/features/<feature>/stats.json` (UTF-8, no BOM) so the aggregate index can render them per-row without re-running git:

```json
{ "feature":"logger-level-filter", "start_sha":"<phase0-sha>",
  "ai_loc":380, "human_loc":32, "total":412, "efficiency":92,
  "date":"2026-07-17", "generated_at":"2026-07-17T10:30:00Z" }
```

`docs/features/sdd-index.html` (built by `scripts/build_index.js`) reads this file per included feature for the `AI 代码` / `人工代码` / `提效%` columns; a missing `stats.json` shows `—`.

## Tokens dropped in v2 (no longer in the template)

`{{EFFICIENCY}}` (old hero, time-based) was redefined as AI-code-share above. The following are **removed entirely** — do not fill them:

`{{BASELINE_DAYS}}`, `{{ACTUAL_DAYS}}`, `{{LOC}}`, `{{TEST_RESULT}}`, `{{WORKFLOW}}`, `{{PHASE_TABLE}}`, `{{REQ_LIST}}`, `{{ISSUE_LIST}}`, `{{HUMAN_PHASES}}`, `{{HUMAN_COST}}`, `{{AI_EVAL}}`, `{{Pn_SKILL/OUT}}` additional-skill sub-tokens (additional skills are now joined into `{{Pn_SKILL}}`).

## UTF-8 / Windows note

The template, the per-feature `summary.html` output, and `count_loc.py` output are all UTF-8. Generate the filled summary via a UTF-8-safe path — prefer a small Node script (`fs.readFileSync(p,'utf8')` / `fs.writeFileSync(p, out,'utf8')`, values as UTF-8 JS literals); in PowerShell use `-Encoding UTF8` for read+write and keep non-ASCII values out of the command line. See SKILL.md step 7.
