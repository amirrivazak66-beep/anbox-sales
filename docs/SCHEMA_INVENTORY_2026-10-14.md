# Supabase Schema Inventory — Read-only Snapshot

**Observed:** 2026-10-14  
**Project ref:** `uaydruhkevdmvpyefdjm`  
**PostgreSQL:** 17.6  
**Purpose:** structure inventory to support a future reviewed baseline. This is not a migration, backup, or restore artifact.

## Scope and safety

This inventory was assembled from read-only metadata queries and generated schema types. No business row values, passwords, Auth secrets, tokens, or customer details were queried. Do not execute this document as SQL. Metadata can drift; refresh it before designing migrations.

## Public tables

| Table | Observed purpose / key shape | RLS | Notes |
|---|---|---:|---|
| `config` | integer PK; JSONB `experts`, `fields` | enabled + forced | `config_manager_select` policy for authenticated manager |
| `crm_kpi_definitions` | UUID PK; owner profile FK; KPI key/name/icon; target/daily/monthly targets | enabled | owner/key unique; owner-or-manager select, manager writes |
| `daily_reports` | UUID PK; legacy `users` FK; date, counts, notes/checklist | enabled | owner-or-manager SELECT policy |
| `kpi_targets` | UUID PK; legacy `users` FK; date and KPI integer targets | enabled | owner/date unique; owner-or-manager SELECT policy |
| `leaderboard` | UUID PK; legacy `users` FK; week/month/score/rank | enabled | no RLS policy observed; zero rows reported in earlier audit |
| `leads` | bigint PK/sequence; company, phone, pipeline, follow-up, notes, nullable `owner_auth_id` FK to `auth.users` | enabled | owner-or-manager CRUD policies; all 8 observed leads had owner IDs in earlier audit |
| `profiles` | UUID PK/FK to `auth.users`; username, display name, role, must-change-password | enabled | unique lowercase username; role constrained to sales/manager; self-or-manager SELECT |
| `reports` | UUID PK; legacy `eid`, date, text metrics, checklist | enabled + forced | unique `(eid,date)`; manager SELECT policy |
| `users` | UUID PK; username, `password` text column, name, role, created_at | enabled | legacy table; no RLS policy observed; no anon/authenticated table grants observed in previous ACL audit. No values were inspected. |

## Functions and policies observed

- `public.is_crm_manager()` returns boolean, is `SECURITY DEFINER`, uses an empty configured `search_path`, and is executable by `anon`, `authenticated`, `service_role`, and `postgres` in the current ACL. It is called by multiple manager policies. Review dependencies and role behavior before changing grants.
- Policies include `leads_select_owner_or_manager`, `leads_insert_owner_or_manager`, `leads_update_owner_or_manager`, `leads_delete_owner_or_manager`, `profiles_select_self_or_manager`, `crm_kpi_select_own_or_manager`, manager write policies for KPI definitions, owner/manager SELECT policies for KPI targets and daily reports, `reports_manager_select`, and `config_manager_select`.
- `public.users` and `public.leaderboard` had RLS enabled but no policies in the observed metadata.
- The migration ledger has three reconciled entries: `20261013184306`, `20261013215731`, `20261014093029`.

## Known structural concerns — do not fix blindly

1. Legacy `public.users.password` exists as a text column. This inventory does not inspect its contents or prove whether values are plaintext/hashed. Do not expose or query these values; map all dependencies and verify the active Auth migration before planning retirement.
2. Legacy tables `daily_reports`, `kpi_targets`, and `leaderboard` reference `public.users`, so dropping or renaming `users` could break foreign keys and historical features.
3. `reports` and `daily_reports` use different naming and type conventions (e.g. `savedAt` vs `saved_at`, text vs integer metrics); do not unify without an explicit compatibility migration.
4. `leads.owner_auth_id` is nullable at the schema level even though all currently observed lead rows have an owner. A future NOT NULL constraint would need a verified backfill/validation plan.
5. The generated TypeScript schema types do not replace a complete schema export. Index definitions, sequences, grants, extensions, triggers, all function bodies, Auth configuration, Storage objects and non-public schemas must be inventoried before a clean-install baseline can be considered complete.

## What this does not prove

- It does not contain row data or a backup of Supabase Auth/Storage.
- It does not prove restoreability.
- It does not create a clean-install baseline.
- It does not authorize production changes.

## Next safe sequence

1. Create encrypted logical backups of roles, schema and data from a trusted local environment; do not commit them.
2. Restore into a separate disposable environment and validate row counts, constraints, RLS, functions, role access, and application behavior.
3. Complete schema inventory with indexes, sequences, extensions, grants, triggers, function bodies, Auth settings, and Storage objects.
4. Draft a baseline as a separate review artifact and test it against a fresh isolated database; do not run it against production.
5. Design narrow security fixes with rollback SQL and authorized manager/sales tests.
