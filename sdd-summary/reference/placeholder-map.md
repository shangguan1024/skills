# Placeholder Map — sdd-summary

Authoritative list of the 36 `{{...}}` placeholders in `templates/summary.html`. The SKILL.md workflow fills each from the source below. Unfilled → `—`.

| # | Token | Block | Source | Who fills |
|---|---|---|---|---|
| 1 | `{{FEATURE}}` | Header | `.sdd/state.json` `featureName` | AI |
| 2 | `{{DATE}}` | Header | today (YYYY-MM-DD) | AI |
| 3 | `{{P0_SKILL}}` | Timeline | `.sdd/workflow_config.json` phase 0 `skills` | AI |
| 4 | `{{P0_STATE}}` | Timeline | `"done"` if phase 0 ≤ currentPhase else `""` | AI |
| 5 | `{{P0_OUT}}` | Timeline | `findings.md` (Phase 0 artifact name) | AI |
| 6 | `{{P1_SKILL}}` | Timeline | workflow_config phase 1 `skills` | AI |
| 7 | `{{P1_STATE}}` | Timeline | phase 1 ≤ currentPhase ? `"done"` : `""` | AI |
| 8 | `{{P1_OUT}}` | Timeline | `design.md` | AI |
| 9 | `{{P2_SKILL}}` | Timeline | workflow_config phase 2 `skills` | AI |
| 10 | `{{P2_STATE}}` | Timeline | phase 2 ≤ currentPhase ? `"done"` : `""` | AI |
| 11 | `{{P2_OUT}}` | Timeline | `task_plan.md` | AI |
| 12 | `{{P3_SKILL}}` | Timeline | workflow_config phase 3 `skills` | AI |
| 13 | `{{P3_STATE}}` | Timeline | phase 3 ≤ currentPhase ? `"done"` : `""` | AI |
| 14 | `{{P3_OUT}}` | Timeline | module files (from task_plan) | AI |
| 15 | `{{P4_SKILL}}` | Timeline | workflow_config phase 4 `skills` | AI |
| 16 | `{{P4_STATE}}` | Timeline | phase 4 ≤ currentPhase ? `"done"` : `""` | AI |
| 17 | `{{P4_OUT}}` | Timeline | test results | AI |
| 18 | `{{P5_SKILL}}` | Timeline | workflow_config phase 5 `skills` | AI |
| 19 | `{{P5_STATE}}` | Timeline | phase 5 ≤ currentPhase ? `"done"` : `""` | AI |
| 20 | `{{P5_OUT}}` | Timeline | review notes | AI |
| 21 | `{{P6_SKILL}}` | Timeline | workflow_config phase 6 `skills` | AI |
| 22 | `{{P6_STATE}}` | Timeline | phase 6 ≤ currentPhase ? `"done"` : `""` | AI |
| 23 | `{{P6_OUT}}` | Timeline | persisted memory | AI |
| 24 | `{{REQ_LIST}}` | 1 AR/ISSUE | `findings.md` Requirement Specifications | AI |
| 25 | `{{ISSUE_LIST}}` | 1 AR/ISSUE | `git log` / issue refs | AI |
| 26 | `{{EFFICIENCY}}` | Hero | user-supplied % | user |
| 27 | `{{BASELINE_DAYS}}` | Hero | user-supplied baseline person-days | user |
| 28 | `{{ACTUAL_DAYS}}` | Hero | user-supplied actual person-days | user |
| 29 | `{{LOC}}` | Hero | `git diff --stat` (or "N/A") | AI |
| 30 | `{{TEST_RESULT}}` | Hero | test command output (e.g. "24 tests ✅") | AI |
| 31 | `{{WORKFLOW}}` | 2 工作流 | fixed SDD 7-phase one-liners | AI |
| 32 | `{{PHASE_TABLE}}` | 3 skill/输出件 | workflow_config + checkpoint + artifact existence | AI |
| 33 | `{{HUMAN_PHASES}}` | 4 人工参与 | which phases had human work (drafted, confirmed) | user confirms |
| 34 | `{{HUMAN_COST}}` | 4 耗时 | prose on where time was spent (drafted, confirmed) | user confirms |
| 35 | `{{AI_EVAL}}` | 5 AI效果 | per-phase AI-assist assessment (drafted, confirmed) | user confirms |
| 36 | `{{OUTCOME_DETAIL}}` | 6 产出 | prose on code-volume/test/efficiency drivers (drafted, confirmed) | user confirms |
