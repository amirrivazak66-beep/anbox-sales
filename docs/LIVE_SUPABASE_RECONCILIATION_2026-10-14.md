# Live Supabase Reconciliation — 2026-10-14

**Purpose:** Reconcile repository documentation with a read-only inspection of the connected Supabase project. This is a metadata/schema audit, not a penetration test or live user acceptance test.

## Environment and method

- Project ref: `uaydruhkevdmvpyefdjm` (project name `anbox-sales`).
- Organization plan: Free.
- Project status: `ACTIVE_HEALTHY`; PostgreSQL 17.6.
- Inspection performed on 2026-10-14 around 15:10 UTC using read-only project metadata, table metadata, migration history, Edge Function source retrieval, advisor results, and SELECT-only SQL.
- No production rows, schema, policies, Auth settings, or Edge Functions were changed during this audit.
- No usernames, phone numbers, password hashes, tokens, or customer lead contents are recorded here.

## Live data/schema snapshot

Counts only; no row contents were inspected for this summary.

| Object | Observed count/state |
|---|---:|
| `auth.users` | 6 |
| `public.profiles` | 6 (1 manager, 5 sales) |
| `public.leads` | 8 |
| Leads with non-null `owner_auth_id` | 8 of 8 |
| `public.users` (legacy table) | 7 |
| `public.crm_kpi_definitions` | 32 |
| `public.kpi_targets` | 4 |
| `public.daily_reports` | 0 |
| `public.reports` | 2 |
| `public.config` | 1 |
| `public.leaderboard` | 0 |

The earlier migration-plan snapshot that reported zero Auth users and zero rows in several public tables is historical and no longer describes the live project. Do not inspect or modify the legacy `public.users` records as part of a code-only task.

## Current application/backend connection

- `dashboard.html` uses Supabase JS with the project's publishable key.
- Login calls the deployed `username-login` Edge Function, establishes the returned Auth session, and loads the matching `public.profiles` row.
- `admin-users` is called for password changes and manager account-management actions.
- Lead reads/writes use `public.leads`; the current schema has an `owner_auth_id` UUID and all 8 observed lead rows are assigned.
- Team settings, KPI target editing state, and checklist state still include browser `localStorage` usage. The cloud migration is therefore not complete for every module; do not describe the whole app as fully cloud-backed.

## Live migrations versus repository files — blocking reconciliation issue

The live Supabase migration history reports these versions/names:

| Live version | Live migration name | Repository status at audit |
|---|---|---|
| `20261013184306` | `onbox_crm_auth_integration_20261013` | Similar migration source exists under a different filename/version (`20261013000200_crm_auth_integration.sql`); exact versioned file is absent. |
| `20261013215731` | `kpi_daily_monthly_targets` | Similar SQL exists as `20261014002000_kpi_daily_monthly_targets.sql`, with a different version. |
| `20261014093029` | `restore_manager_read_access_reports_config` | No matching versioned migration file was found in `main`. |

The repository also contains `20261013000100_auth_profiles_lead_ownership_draft.sql` under the migrations directory even though it is labelled draft and is not recorded as applied under that version. The database records the statements for its applied migrations, so the exact applied SQL can be reconciled without guessing. However, the repository does not yet constitute a complete, proven clean-database bootstrap: the base schema predates/exists outside this three-migration history.

**Do not run `supabase db push`, `db reset`, or apply migrations from the current directory against production until the migration ledger and repository are reconciled and a recovery path is verified.** Do not simply rename files or mark migrations applied without comparing exact statements and understanding the baseline schema.

## RLS and privilege observations

- RLS is enabled on all inspected public tables.
- `public.profiles` has a self-or-manager SELECT policy; browser INSERT/UPDATE/DELETE grants are absent.
- `public.leads` has authenticated owner-or-manager SELECT/INSERT/UPDATE/DELETE policies. The observed 8 leads all have a non-null owner UUID. Role behavior still requires end-to-end tests using authorized manager and salesperson accounts.
- `public.users` has RLS enabled, no policy, and no anon/authenticated table privileges in the current grant check. It contains 7 rows and has legacy dependencies; do not delete it or reuse its password column.
- `public.leaderboard` has RLS enabled, no policy, and zero rows in the observed snapshot. Confirm intended use before changing it.
- `public.is_crm_manager()` is SECURITY DEFINER and currently executable by `anon` and `authenticated`. This is flagged by Supabase Security Advisor. Review all policy/function callers and test equivalent role behavior before changing grants.
- Supabase Security Advisor also reports leaked-password protection disabled.
- Performance advisor reports three RLS initialization-plan warnings. Five indexes are reported unused; do not drop them based only on this observation window.

RLS policies may deny rows even when table-level grants exist. Do not interpret `has_table_privilege` alone as proof that a role can read or mutate rows.

## Edge Functions observed

- `username-login`: ACTIVE, version 1, `verify_jwt=false` (expected for a public login endpoint, but it needs abuse/rate-limit review).
- `admin-users`: ACTIVE, version 3, `verify_jwt=true`; source validates the caller's Auth user and checks the profile role for manager-only account operations. It also permits a signed-in user to change their own password.
- The source retrieved from the deployed project is not automatically proven identical to a GitHub commit merely because a file with the same name exists. Keep deployed/source comparison in the release checklist.

## Priority next steps

1. Obtain a real, authorized database backup and verify its integrity; rehearse restoration in a separate environment. Do not request secrets in chat.
2. Reconcile the three live migration versions with tracked SQL and document the pre-existing baseline schema. Preserve exact applied statements and avoid accidental duplicate/earlier migrations.
3. Run controlled E2E tests with authorized test accounts: username login, forced password change, manager account create/reset/update/delete, salesperson-only owned-lead access, manager-wide lead access, lead reassignment, logout/session expiry, Excel round-trip.
4. Review login abuse controls and the `is_crm_manager()` anon EXECUTE grant; prepare isolated changes only after backup/restore and rollback are established.
5. Decide intended access for `reports`, `config`, `kpi_targets`, `daily_reports`, and `leaderboard`; do not add broad RLS policies.
6. Keep team settings, KPI target state, checklist, and any other local-only module explicitly tracked as pending cloud-persistence work.
7. Update this report after each verified checkpoint; do not claim backup/restore or live E2E completion until there is direct evidence.

## Safety boundary

This report documents observations only. It authorizes no production changes. The Supabase organization is on the Free plan; do not create a paid branch/project or incur costs without first checking and confirming cost.