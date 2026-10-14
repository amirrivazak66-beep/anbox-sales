# Technical & Product Audit — 2026-10-14

- Repository: `amirrivazak66-beep/anbox-sales`
- Supabase project: `uaydruhkevdmvpyefdjm`
- This audit used read-only inspection of repository files, schema, metadata, row counts, policies, migrations and Supabase advisors.
- No production code, database rows, policies, or browser storage were changed.
- Static/metadata audit only: browser end-to-end tests and the live GitHub Pages response were not verified.

## Repository state
Recent `main` commits:
- `39547f1` — Launch sales assistant landing page as homepage
- `e2db344` — Preserve existing sales dashboard before homepage launch
- `cc13ae9` — Fix missing closing div for team page
- `6b5fc65` — Fix blank CRM page content on main
- `9cec74c` — Fix Supabase reports and pipeline views

Observed files:
- `index.html`: 37,021 characters; public landing page; title and positioning are sales-focused.
- `dashboard.html`: 105,457 characters; preserved application; title still says «داشبورد فروش | آن‌باکس».
- `landing-preview.html` exists on `feature/sales-assistant-landing`; a draft PR #8 was previously created for that preview. Review current diff before any merge.

## Features found in static code
- Username/password login through Supabase Edge Function `username-login`, followed by Supabase Auth session setup.
- Profile and role lookup from `profiles`.
- Lead creation, listing, filtering, updating and deletion.
- Sales pipeline visualization; team, checklist and KPI views.
- KPI definitions/targets and calculations based on lead data.
- Reports fetched from Supabase.
- Excel/CSV import/export and JSON local-storage backup/restore code.
- Admin account creation and password reset through `admin-users` Edge Function.

Static code is not proof of end-to-end behavior. Test login/logout, role boundaries, lead CRUD and ownership, Excel round-trip, backup/restore, KPI calculation, reports, checklist persistence, navigation and responsive layout.

## Static-code issue to verify
`updateChecklist()` already persists each checkbox toggle immediately to the existing per-user localStorage key. The original `saveChecklist()` button only displayed a success message, which was misleading. PR #11 changed the button handler to write the current checkbox state explicitly and added a regression smoke assertion. Browser-level save/reload verification is still required.

## Supabase snapshot
Project status: `ACTIVE_HEALTHY`; PostgreSQL 17.6.1.127. No Supabase development branches were listed.

Read-only row counts at audit time:
| Table | Rows |
|---|---:|
| `config` | 1 |
| `crm_kpi_definitions` | 32 |
| `daily_reports` | 0 |
| `kpi_targets` | 4 |
| `leaderboard` | 0 |
| `leads` | 2 |
| `profiles` | 6 |
| `reports` | 2 |
| `users` | 7 |

Counts are a point-in-time snapshot, not a backup. All nine listed public tables have RLS enabled. Existing policies observed cover reports/config manager SELECT; KPI targets and daily reports owner/manager SELECT; lead owner/manager CRUD; profile self/manager SELECT; and CRM KPI definitions manager writes plus owner/manager SELECT. Effective access must be tested with real roles.

## Security findings requiring review

### High priority: legacy `public.users` table
- Columns include `username`, `password`, `name`, `role`, `created_at`; table has 7 rows and RLS enabled.
- No RLS policies were returned for `public.users`.
- The inspected frontend login path uses `username-login`; admin actions use `admin-users`.
- A `password` column does not by itself prove plaintext storage. Inspect Edge Function source and stored values without exposing credentials. Determine whether the table is legacy, whether values are hashed, and whether it can be retired later. Do not delete or migrate it before dependency and backup review.

### High priority: public execution of `is_crm_manager()`
Supabase Security Advisor reports `public.is_crm_manager()` as `SECURITY DEFINER` and executable by `anon` and `authenticated`. The function checks whether `auth.uid()` has manager role in `profiles`, uses an empty search path, and returns a boolean. Review whether anonymous execution is necessary and whether least-privilege grants can be applied safely. Do not change grants until dependent policies and Edge Functions are mapped.

### Medium: leaked-password protection
Supabase Advisor reports leaked-password protection disabled. Review Auth configuration and rollout impact before enabling.

### Medium: RLS policy performance
Advisor reports repeated auth/current_setting evaluation in policies on `crm_kpi_definitions`, `kpi_targets`, and `daily_reports`. Optimize only after correctness tests and baseline measurement.

### Informational
- RLS enabled with no policy was reported for `leaderboard` and `users`. Confirm whether this is intentional for `leaderboard`.
- Five indexes were reported unused. Do not drop based only on this report; traffic may be low or indexes may support constraints/future use.

## Migration history observed
- `20261013184306` — `onbox_crm_auth_integration_20261013`
- `20261013215731` — `kpi_daily_monthly_targets`
- `20261014093029` — `restore_manager_read_access_reports_config`

Review migration SQL and compare it to live schema before further schema changes.

## Backup and release state
- Code-level backup exists as `dashboard.html`, committed before `index.html` was replaced.
- A full database backup/restore point was not verified.
- The homepage commit was verified; actual published Pages response and interactive UI were not verified.
- Do not clear browser storage. The app includes localStorage checklist and backup/restore behavior; export relevant keys from the actual browser before any local-storage migration.
- Before schema/security changes: verify database backup/restore, capture schema/policies, and prepare rollback.

## Minimum test matrix
| Area | Acceptance test |
|---|---|
| Authentication | Valid/invalid login, refresh, logout, forced password change |
| Roles | Manager and salesperson only see authorized records/actions |
| Leads | Create, update, assign, filter, duplicate guard, confirmed delete |
| KPI | Targets, date boundaries, daily/monthly totals, empty state |
| Reports | Load, empty state, errors and role access |
| Excel/CSV | Export then re-import without loss; malformed file handling |
| Backup/restore | Export and validate; restore in test profile before production |
| Checklist | Toggle, save, reload, persistence |
| Navigation | Dashboard, leads, team, pipeline, reports, settings without blank panels |
| Responsive | Keyboard, small viewport, visible errors and loading states |

## Recommended next actions
1. Review Product Blueprint and agree first-release scope.
2. Verify database backup and restoration procedure.
3. Inspect Edge Function source for `username-login` and `admin-users`, especially secret and legacy password handling.
4. Run end-to-end tests in a safe staging environment.
5. Fix checklist persistence in an isolated branch after confirming expected behavior.
6. Apply least-privilege RLS/function changes only after dependency review.
7. Align the public homepage to the platform-wide positioning after brand approval.

No production changes were made by this audit.

## 9. Edge Function source review

The active Edge Function source was inspected read-only after the initial audit draft:

- `username-login` is active, has `verify_jwt=false`, accepts POST, validates the username format and password length, then calls Supabase Auth password-token endpoint using server-side `SUPABASE_URL` and `SUPABASE_ANON_KEY`. It returns a generic invalid-credentials response. No service-role key is used in this function. The visible source does not implement an explicit rate limit; verify whether infrastructure-level throttling/abuse protection exists before broad public exposure.
- `admin-users` is active, has `verify_jwt=true`, validates the bearer session with `auth.getUser()`, looks up the caller's profile and requires the manager role for administrative actions. It uses `SUPABASE_SERVICE_ROLE_KEY` server-side for administrative Auth operations. The service-role key was not found in the inspected frontend snippet; keep it server-side only.
- The login flow uses Supabase Auth and `profiles`, not a direct read of `public.users` in the inspected path. This strengthens the hypothesis that `public.users` may be a legacy table, but dependencies outside the inspected path must be checked before any cleanup.
- The Edge Function comments refer to the historical OnBox CRM; this is a maintenance/branding inconsistency, not by itself a security flaw.

Before changing Edge Functions: review invocation logs and current callers, check abuse controls for the public login bridge, test account creation/reset/change-password flows with manager and salesperson roles, and preserve the existing Auth accounts.


## 10. Follow-up checks completed after the initial audit

- Read-only dependency scan found no references to `public.users` in public SQL routines, views or triggers. This does not prove that no external client or uninspected process uses it, so the table remains untouched.
- Table grants for `public.users` were returned only for `postgres` and `service_role`; no direct table grants to `anon` or `authenticated` were found. RLS remains enabled and no policies are defined for the table. Do not remove the table without a migration/dependency review.
- The function ACL for `public.is_crm_manager()` explicitly grants EXECUTE to `anon` and `authenticated`; the `PUBLIC` role is not granted EXECUTE. The function returns a manager-role boolean and uses an empty search_path. The anonymous grant appears unnecessary for the authenticated UI but should only be revoked after verifying all callers and a restore path.
- The three GitHub Actions checks passed on the checklist-fix branch: Static dashboard smoke checks, CRM Supabase static validation and CRM smoke checks. This is static CI validation, not browser E2E testing.
- PR #10 merged as `e55ef29`: added static smoke checks and corrected the legacy CRM workflow to inspect `dashboard.html` rather than the new public landing page `index.html`.
- PR #11 merged as `4974ac9`: made the checklist Save button persist the current per-user checklist state. No Supabase data or schema was changed.
- The audit still has no verified database restore point and no live browser test. Those remain release blockers for production database/security changes.
