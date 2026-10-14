# Project Handoff Template

Copy this into the next conversation when the current chat is full. Replace bracketed items with current facts.

---

We are continuing the long-running AI Business Manager / sales dashboard project.

- Repository: https://github.com/amirrivazak66-beep/anbox-sales
- Continuity protocol: https://github.com/amirrivazak66-beep/anbox-sales/blob/main/docs/PROJECT_CONTINUITY.md
- Roadmap: https://github.com/amirrivazak66-beep/anbox-sales/blob/main/docs/ROADMAP_V1.md
- Product definition: https://github.com/amirrivazak66-beep/anbox-sales/blob/main/docs/PHASE_1_PRODUCT_DEFINITION.md
- Release status: https://github.com/amirrivazak66-beep/anbox-sales/blob/main/docs/RELEASE_STATUS_2026-10-14.md

## Checkpoint
- Date/time/timezone: [fill in]
- Latest main SHA, checked on GitHub: [SHA]
- Working branch and commit: [branch / SHA]
- Active PRs: [number, URL, state]
- Latest CI: [check names and results]
- Deployment state and evidence: [verified or unverified]

## Status labels
- USER-CONFIRMED: explicitly tested by the owner.
- AUTOMATED-TESTED: test name, environment, and mock/live limitation.
- VERIFIED: repository/API/deployment evidence.
- IN-PROGRESS: task, branch, commit, PR.
- BLOCKED: exact dependency, required permission, and safe resume step.

## Decisions to preserve
- Goal: AI Business Manager, not only CRM or generic chatbot.
- Preserve manager/salesperson access, lead management, Excel/CSV import/export, and backup compatibility.
- Do not repeat completed work unless there is evidence of a regression.
- Mock browser tests are not live E2E tests.
- No destructive production DB/Auth/RLS/grant/function change before real backup, separate restore rehearsal, dependency map, rollback plan, and required approval.
- Never put credentials or production records in chat or repository.
- «مدیرنگر» is provisional until name/domain/trademark clearance.

## Exact next action
[One concrete next step, including the relevant file, PR, test, or external dependency.]

## Open risks
[Only unresolved items that may change the next action. Mark assumptions separately from facts.]

---

Instruction to the next assistant: Read PROJECT_CONTINUITY.md first, then fetch current GitHub state: main SHA, recent commits, open PRs, CI, and deployment. This handoff is a starting point, not proof that old statuses remain current. Continue safe work autonomously and update the repository checkpoint before the next handoff.
