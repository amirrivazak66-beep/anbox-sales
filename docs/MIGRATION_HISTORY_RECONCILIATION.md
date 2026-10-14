# Supabase Migration History Reconciliation

**Updated:** 2026-10-14  
**Status:** repository versioned migrations aligned to the three versions observed in the connected Supabase project's migration ledger; a complete clean-install baseline is still missing. This is repository-only work, not a database deployment.

## Why this exists

The live project's migration ledger reports these exact versions/names:

| Version | Name |
|---|---|
| `20261013184306` | `onbox_crm_auth_integration_20261013` |
| `20261013215731` | `kpi_daily_monthly_targets` |
| `20261014093029` | `restore_manager_read_access_reports_config` |

The applied SQL statements were retrieved read-only from `supabase_migrations.schema_migrations` and tracked under filenames that use the same version numbers. The matching files are:
- `supabase/migrations/20261013184306_onbox_crm_auth_integration_20261013.sql`
- `supabase/migrations/20261013215731_kpi_daily_monthly_targets.sql`
- `supabase/migrations/20261014093029_restore_manager_read_access_reports_config.sql`

The previous files `20261013000100_auth_profiles_lead_ownership_draft.sql`, `20261013000200_crm_auth_integration.sql`, and `20261014002000_kpi_daily_monthly_targets.sql` were not the exact migration versions recorded in the live ledger. They are removed from the active migrations directory in this change to prevent accidental application as pending migrations. Their prior contents remain available in Git history.

## Important limitation: not a clean-install baseline

The live project had tables before these three tracked migrations. The repository does not yet contain a complete, verified baseline migration that creates all prerequisite tables, columns, constraints, functions, and policies from an empty database.

Therefore:
- Do not treat `supabase/migrations` as sufficient to build a brand-new database from scratch.
- Do not run `supabase db reset` against production.
- Do not run `supabase db push` against production merely because filenames now align. First run a non-mutating diff/status check using the correct CLI version and a reviewed project link, verify backup/restore, and confirm no pending migration would alter production.
- Do not mark migrations applied manually or rewrite production migration history without an explicit, reviewed recovery plan.
- A future baseline/schema snapshot should be produced from an authorized schema-only export and reviewed separately; it must not be added as an earlier executable migration against the existing production project without a carefully designed adoption process.

## Safety and next steps

No production schema, rows, Auth settings, RLS policies, grants, or Edge Functions were changed during this reconciliation.

1. Verify a real backup and restore rehearsal.
2. Confirm local filenames/versions and live ledger match; then run only read-only CLI status/diff checks.
3. Build a complete schema-only baseline artifact from a trusted export, excluding data and secrets.
4. Review the deployed Edge Function sources against GitHub source and run controlled live E2E tests.
5. Only after these gates, propose narrowly scoped security migrations.

The connected organization is on the Supabase Free plan. Do not create a paid project/branch or incur costs without first checking and confirming cost.
