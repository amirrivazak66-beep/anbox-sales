# Project Continuity Protocol

Purpose: preserve project decisions and progress across many ChatGPT conversations and context limits. This is the canonical entry point; chat history alone is not a source of truth.

Repository: https://github.com/amirrivazak66-beep/anbox-sales  
Default branch: `main`  
Updated: 2026-10-14

## Operating rules

1. At the start of every new chat, inspect current `main`, recent commits, open PRs, CI runs, and deployment state. Read this file, the current release status, roadmap, and product definition.
2. Live repository evidence beats chat memory. Recheck all statuses; old PR/check states can change.
3. Label facts clearly: `USER-CONFIRMED`, `AUTOMATED-TESTED`, `VERIFIED`, `IN-PROGRESS`, `PLANNED`, or `BLOCKED`. Never describe a plan as implemented.
4. Check history and existing PRs before starting work. Do not repeat completed work unless new evidence shows a regression or gap.
5. Continue safe, reversible code, documentation, and test tasks autonomously. Ask only when a genuinely missing product decision, account permission, external action, or high-impact choice blocks progress.
6. Never put access tokens, passwords, service-role keys, credential-bearing database URLs, customer data, or production backups in chat, commits, or public test fixtures.
7. Do not make destructive production DB/Auth/RLS/grant/Edge Function changes until a real backup is available, restoration has been rehearsed separately, dependencies are mapped, and required approval is explicit.
8. Use focused branches and small PRs. Run relevant tests, merge only after checks pass, then verify the new `main` SHA and deployment state.
9. Never overstate testing: mocked browser tests are not live end-to-end tests, and a successful Pages workflow does not prove every real user flow.
10. Preserve compatibility. Do not casually change database field names, legacy Excel headers, backup formats/identifiers, or localStorage keys. Map consumers and define migration/rollback first.

## Product north star

The long-term goal is an **AI Business Manager**, not merely a CRM or generic chatbot. Help a business leader understand what changed, why it matters, what to do next, who owns the action, and whether it worked.

Initial customer hypothesis: owner/CEO of an Iranian SMB with 10–100 employees. This is a hypothesis, not validated market research.

Principles:
- Separate observed facts, calculations, assumptions, and AI recommendations.
- Show sources, time windows, freshness, and uncertainty; explicitly say when data is insufficient.
- Require human approval for consequential external actions such as public publishing, budget changes, and destructive operations.
- Build features only when tied to a measurable customer outcome.
- Treat the current sales dashboard as an operational module and a prerequisite, not the whole product.

## Roadmap

- **Phase 0 — Protect and understand:** rollback, real backup/restore, schema/permissions map, deployment confirmation, critical test matrix.
- **Phase 1 — Stabilize current app:** auth and role boundaries, lead ownership/CRUD, KPI calculations and date boundaries, checklist persistence, reports/pipeline/Excel/JSON backup, security review.
- **Phase 2 — Product/UX foundation:** user jobs, data model, modules, navigation, permissions, audit trail, UX and error states.
- **Phase 3 — Decision Intelligence MVP:** daily/weekly brief, evidence-backed prioritized recommendations, owner/due date, accept/reject/defer, outcome tracking.
- **Phase 4 — Marketing intelligence:** begin with one or two validated, accessible data sources; calculate CPL/CPA/ROI only when attribution data supports it.
- **Phase 5 — Controlled agents:** drafting/analysis first; least-privilege access, approvals, logs, retries, rollback, spend limits.
- **Phase 6 — Scale/commercial model:** validate subscription, then consider agency/multi-workspace, APIs, and governed benchmarks.
- **Parallel brand workstream:** «مدیرنگر» remains provisional until name/domain/trademark clearance.

Full phase criteria: [ROADMAP_V1.md](ROADMAP_V1.md) and [PHASE_1_PRODUCT_DEFINITION.md](PHASE_1_PRODUCT_DEFINITION.md).

## Canonical documents — read in order

1. This file: [PROJECT_CONTINUITY.md](PROJECT_CONTINUITY.md).
2. [RELEASE_STATUS_2026-10-14.md](RELEASE_STATUS_2026-10-14.md) — update or supersede after material changes.
3. [ROADMAP_V1.md](ROADMAP_V1.md) — phases and exit criteria.
4. [PHASE_1_PRODUCT_DEFINITION.md](PHASE_1_PRODUCT_DEFINITION.md) — product/customer hypotheses and acceptance criteria.
5. [SUPABASE_BACKUP_RECOVERY_RUNBOOK.md](SUPABASE_BACKUP_RECOVERY_RUNBOOK.md).
6. [SUPABASE_SECURITY_HARDENING_PLAN.md](SUPABASE_SECURITY_HARDENING_PLAN.md) — plan only, not production authorization.
7. [SUPABASE_AUTH_MIGRATION_PLAN.md](SUPABASE_AUTH_MIGRATION_PLAN.md) and [AUTH_MIGRATION_NEXT_STEPS.md](../supabase/AUTH_MIGRATION_NEXT_STEPS.md) — draft; check current PR/files.
8. [PROJECT_HANDOFF_TEMPLATE.md](PROJECT_HANDOFF_TEMPLATE.md) — paste into the next chat.

If a path changes, inspect the repository; never invent a replacement path.

## Application map

- `index.html`: public landing page.
- `dashboard.html`: sales dashboard/application.
- `scripts/browser-smoke.mjs`: Playwright browser tests using mocked Supabase and synthetic data.
- `docs/`: product definition, roadmap, release status and operational/security runbooks.
- Supabase is the backend; production schema/Auth/RLS/functions are high-impact resources.
- GitHub Pages hosts the public site. A code merge does not itself prove successful live release.

Preserve the manager/salesperson experience, lead management, Excel/CSV import/export, and backup compatibility.

## Status snapshot — 2026-10-14 (refresh on every handoff)

### Confirmed/merged at snapshot time
- PR #18 recorded the owner's confirmation that live site/dashboard, manager/salesperson roles, lead management, and Excel import/export worked. This is **USER-CONFIRMED**, not independently repeated live QA by the assistant.
- PR #19 added a backup/recovery runbook; it did not create or verify a real backup/restore.
- PR #20 added a read-only security plan; it did not change production DB/RLS/Auth/functions.
- Settings layout fix was committed as `c2f692e0cdc1479358e4b7555f5889953d15ad2e`.
- PR #21 added settings regression coverage and merged as `f48f66dbcf8b42b7ad9e3f6896d99a598ec415f2`. All four checks passed: `validate`, `syntax-and-feature-check`, `browser-smoke`, `static-smoke`. Browser test uses mocked Supabase and synthetic manager data.

### Still unverified
- Actual database backup, integrity, and successful restore into a separate environment.
- Full live E2E using authorized manager and salesperson test accounts.
- Completion of draft Supabase Auth migration, including Edge Function/client integration, owner reconciliation, and E2E validation.
- Live/manual confirmation of every relevant deployment.
- Production security remediations described in the security plan.

### Open PRs at snapshot time
- PR #5: draft username-based Supabase Auth migration; SQL not applied and integration incomplete.
- PR #8: draft landing-page preview; recheck whether useful because `index.html` already serves the landing page.
- PR #21: merged; do not repeat unless regression evidence appears.

These PR details are historical. Fetch the current PR list before acting.

## Next execution order

1. Fetch current `main` SHA, commits, open PRs, Actions, and deployment status.
2. Compare current repository evidence with release status.
3. Confirm PR #21 merge and mainline CI (snapshot merge SHA: `f48f66d`).
4. Establish a real, authorized Supabase backup and rehearse restoration in a separate environment. Never request secrets in chat.
5. Test using isolated authorized accounts: role boundaries, lead ownership/CRUD, KPI/date boundaries, checklist save/reload, reports, Excel round-trip, JSON/local backup, settings.
6. Review login abuse controls and Supabase dependencies. Prepare least-privilege changes only after the recovery gate.
7. Update release status and this continuity file with evidence and the next exact action.
8. Start the next validated product feature only after Phase 0/1 exit criteria are met.

If an external account action is required, continue all independent work and document the precise blocker, safe steps, permission needed, and resume point. Never claim the blocked action is complete.

## Latest live Supabase reconciliation — 2026-10-14

A read-only inspection of the connected Free-plan project `uaydruhkevdmvpyefdjm` found the live state has advanced beyond earlier notes:
- 6 Auth users and 6 profiles (1 manager, 5 sales).
- 8 leads; all 8 have non-null `owner_auth_id`.
- Legacy `public.users` has 7 rows; `public.leaderboard` has 0.
- Active Edge Functions: `username-login` v1 (verify_jwt=false) and `admin-users` v3 (verify_jwt=true).
- Live migration history contains versions `20261013184306`, `20261013215731`, and `20261014093029`. PR #24 aligned the tracked migration filenames and exact SQL with those three live versions. This does not create a complete clean-install baseline.
- Security Advisor flags `public.is_crm_manager()` executable by anon/authenticated and leaked-password protection disabled. RLS is enabled; `public.users` and `public.leaderboard` have no policies.
- Dashboard login and lead CRUD are cloud-backed, while team settings/KPI target state/checklist still include localStorage.

Full evidence and safe next steps: [LIVE_SUPABASE_RECONCILIATION_2026-10-14.md](LIVE_SUPABASE_RECONCILIATION_2026-10-14.md).

**Current blocker:** no verified real backup + separate restore rehearsal, and no complete clean-install baseline. Migration ledger filenames/statements are now reconciled by PR #24. Do not run production migrations or change Auth/RLS/grants until the recovery gate is met. These facts supersede conflicting older zero-user/no-live-migration notes.

## Handoff at context/chat limit

Before the conversation ends:
1. Finish or safely checkpoint the current task; do not start broad work that cannot be recorded.
2. Commit code/docs to a named branch and create/update a PR, or record why not.
3. Record date, branch, commit SHA, PR link/state, changed files, tests/results, mock-vs-live distinction, decisions, risks, and next exact action in the release status or a concise progress log.
4. Update this continuity file only for durable project-wide changes; avoid duplicating detailed implementation notes.
5. Prepare [PROJECT_HANDOFF_TEMPLATE.md](PROJECT_HANDOFF_TEMPLATE.md) for the next conversation.
6. In the new chat, paste the handoff and repository URL. The next assistant must verify live GitHub state before acting.

## Definition of done

A task is complete only when the intended outcome is clear, changes are committed on the expected branch, applicable checks pass, role/data risks and compatibility are reviewed, PR/merge/deployment state is recorded accurately, remaining live validation is named, and the next action is recorded.

**Canonical rule:** when chat memory and repository evidence conflict, inspect the live repository and choose the safer, better-supported state. Never silently discard a decision or present an assumption as a fact.


## Latest continuation update — 2026-10-14, after PR #24

- Current main SHA verified: `651a5e2783e2fdcec3dddc795f6c18ce00f72075`.
- PR #24 merged: [migration ledger reconciliation](https://github.com/amirrivazak66-beep/anbox-sales/pull/24).
- Mainline GitHub Actions for this SHA all completed successfully: CRM smoke, static dashboard smoke, browser smoke (mock data only), and GitHub Pages build/deployment. This is not live account-level E2E.
- Live migration ledger has three versions, each now tracked under the matching filename. Clean-install baseline remains incomplete.
- New read-only drift check found deployed `admin-users` v3 differs from `supabase/functions/admin-users/index.ts` in GitHub: deployed code contains manager-only `update_user` and `delete_user` actions not present in the tracked file. The deployed `username-login` v1 source exactly matches GitHub; `verify_jwt=false` is expected for this username/password bridge and requires abuse/rate-limit review. `admin-users` has `verify_jwt=true`.
- A read-only ACL check reconfirmed `public.is_crm_manager()` is SECURITY DEFINER and has EXECUTE grants for `anon` and `authenticated`; the Security Advisor also reports leaked-password protection disabled and two RLS-enabled tables without policies. No production setting or grant was changed.
- Next action: reconcile the deployed `admin-users` source into GitHub in a PR (without redeploying it), add regression guards, then review the PR checks. Keep production changes blocked until an authorized backup and separate restore rehearsal are confirmed.
