# Release Status — 2026-10-14

## Current mainline snapshot
- Public homepage: index.html, title «مدیرنگر | هوش مدیریتی کسب‌وکار».
- Preserved application: dashboard.html, same title and new inline SVG mark.
- Supabase project remains unchanged by the code/branding work and remains ACTIVE_HEALTHY.

## Completed and merged
- PR #9 — Product Blueprint, Phase 1 product definition, technical audit and roadmap.
- PR #10 — Dependency-free static smoke checks; corrected the old CRM workflow to inspect dashboard.html rather than the public landing page.
- PR #11 — Checklist Save button now persists the current checkbox values to the existing per-user localStorage key.
- PR #12 — Follow-up audit records read-only database privilege/dependency checks and corrected checklist finding.
- PR #13 — Provisional ManagerNegar brand and inline SVG logo in login/sidebar/header and public landing page.
- PR #14 — Remaining visible legacy brand labels cleaned up while preserving database and backup compatibility.
- PR #15 — Playwright browser smoke tests with mock Supabase and isolated local storage.
- PR #16 — Provisional brand guidelines and legal-clearance checklist.

## Verification status

### Confirmed by user in the live environment
- The public site and dashboard were confirmed working in the real environment.
- Manager and salesperson roles were both tested by the user.
- Excel upload, Excel export, and lead management were tested for both manager and salesperson and reported working.
- These user-confirmed live checks supersede the earlier “not yet verified” entries below.

### Automated verification
Latest relevant browser-test branch run passed:
- Browser smoke checks (mock data only).
- Static dashboard smoke checks.
- CRM Supabase static validation.
- CRM smoke checks.

The browser test exercises the landing-page brand, carousel and mobile menu; login validation and a synthetic manager session; dashboard/leads/team/pipeline/reports/settings navigation; and checklist persistence across reload. The test mocks Supabase and does not use production credentials or records.

A final static review of the current main files also found:
- No duplicate static IDs in index.html or dashboard.html.
- All inline JavaScript blocks pass syntax parsing.
- Both pages contain the provisional brand.
- The login/sidebar/dashboard title no longer uses the old AnBox wordmark.
- The existing database field key anbox_fit, legacy Excel header alias, backup format identifier and localStorage key structure remain preserved.

## Remaining verification — do not infer completion
- A full Supabase database backup/restore point has not been verified. The project dashboard or an authorized backup process must confirm backup availability and recovery steps before production security/schema changes.
- No database rows, RLS policies, Auth settings or Edge Functions were changed during the code/branding work.

## Security follow-up — production changes held
- public.users has RLS enabled and no policies; read-only inspection found grants only for postgres and service_role and no references in public SQL routines/views/triggers. Do not delete it until all external dependencies and password-storage history are verified.
- public.is_crm_manager() is SECURITY DEFINER and explicitly grants EXECUTE to anon and authenticated; PUBLIC is not granted EXECUTE. Review all callers before any privilege change.
- Supabase Advisor reports leaked-password protection disabled and RLS initialization-plan performance warnings. Address these only after restore capability and a rollback plan are available.
- Five indexes are reported unused; do not remove them based only on low observed usage.

## Next execution sequence
1. Verify database backup/restore capability through the Supabase project dashboard or an authorized backup process.
2. Prepare a least-privilege security migration plan without applying it to production yet.
3. Only then continue to the next Phase 1 feature implementation.

## Latest live Supabase reconciliation — read-only, 2026-10-14 (refreshed after PR #24)

The connected Supabase Free-plan project was inspected read-only. This section supersedes earlier migration-drift statements in this document:
- `auth.users`: 6; `public.profiles`: 6 (1 manager, 5 sales).
- `public.leads`: 8, and all 8 have a non-null `owner_auth_id`.
- Legacy `public.users`: 7 rows; `public.leaderboard`: 0 rows.
- Live migration ledger contains `20261013184306`, `20261013215731`, and `20261014093029`. PR #24 aligns the exact SQL statements and filenames in GitHub. A complete clean-install baseline is still missing.
- Main SHA: `651a5e2783e2fdcec3dddc795f6c18ce00f72075`. Mainline CRM smoke, static dashboard smoke, browser smoke (mock data only), and Pages deployment workflows all completed successfully for this SHA.
- Deployed Edge Function `username-login` v1 exactly matches GitHub source; `verify_jwt=false`. Deployed `admin-users` v3 uses `verify_jwt=true`, but its source contains manager-only `update_user` and `delete_user` actions absent from the tracked GitHub file. This source drift is being reconciled in a separate code-only PR; do not redeploy as part of source reconciliation.
- Security Advisor still flags `public.is_crm_manager()` as SECURITY DEFINER executable by `anon` and `authenticated`, leaked-password protection disabled, and RLS-enabled `public.users` and `public.leaderboard` without policies. These require dependency review and controlled role tests before remediation.
- Dashboard login and lead CRUD are cloud-backed; team settings, KPI target state and checklist still include localStorage.

Evidence and migration details: [LIVE_SUPABASE_RECONCILIATION_2026-10-14.md](LIVE_SUPABASE_RECONCILIATION_2026-10-14.md), [MIGRATION_HISTORY_RECONCILIATION.md](MIGRATION_HISTORY_RECONCILIATION.md).

No production database rows, schema, Auth settings, RLS policies, grants, or Edge Functions were changed during this audit. A real backup and successful separate restore rehearsal remain unverified. Do not run `supabase db push/reset` or change production Auth/RLS/grants until the recovery gate is met.

## Brand caveat
«مدیرنگر» is a provisional working identity. Exact-name web search returned no results in the limited search performed, but trademark, company-name, social-handle and domain availability have not been cleared.


## PR #25 and schema inventory — 2026-10-14

- [PR #25](https://github.com/amirrivazak66-beep/anbox-sales/pull/25) merged as `bdfe35bf0aa32e50d9df6fd8eb668f1c83d267dd`. The tracked `admin-users` source now matches deployed v3, including manager-only `update_user` and `delete_user` actions and the guard preventing deletion when a salesperson still owns leads. This was a source-only reconciliation; no function deployment occurred.
- PR checks passed, including browser smoke with mocked Supabase. Mainline static, CRM and browser smoke checks passed after merge. Pages deployment was still in progress at last check and must be verified separately.
- A read-only schema inventory is in [SCHEMA_INVENTORY_2026-10-14.md](SCHEMA_INVENTORY_2026-10-14.md). It records structure/policies only, not row data; it is not a restorable backup or clean-install baseline.
- No backup/restore tool is available through the connected Supabase actions. A real encrypted logical backup and separate restore rehearsal remain unverified. Do not change production RLS, grants, Auth settings, schema or functions until that recovery gate is met.
