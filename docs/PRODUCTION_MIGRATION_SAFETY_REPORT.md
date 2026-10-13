# OnBox CRM — Pre-migration Safety Report

Date: 2026-10-13  
Branch: `feature/supabase-crm-integration`  
Base production branch: `main`  
Production commit observed: `d411e77748e596bdd880cec10bf564ddf5c28871`

## Scope and safety boundary

- This report is for review only. It does not apply SQL, deploy Edge Functions, merge the pull request, or modify GitHub Pages production.
- The current feature branch is the rollback point for code review; production `main` remains unchanged.
- Supabase production project was inspected read-only. No database writes were performed.
- The inspected Supabase tables reported zero rows in `public.leads` and `auth.users`. Browser localStorage is separate and was not inspected; it may contain real CRM records. Do not infer local data is empty.
- No Supabase Edge Functions were deployed at inspection time.
- The Supabase organization is on the Free plan; no paid database branch or other paid resource was created.

## Production schema observations

Existing `public.leads` fields include the CRM columns (company, phone, contact, sales stage, expert, status, etc.) and `updated_at`. The migration adds `public.profiles`, `owner_auth_id`, and follow-up/notes fields if missing. The migration is additive and leaves existing lead rows unassigned; it does not delete or copy data.

The existing `public.users` table has a legacy plaintext `password` column. The proposed migration revokes browser-role access to that table but does not delete or rewrite it. Do not migrate these passwords into Supabase Auth; issue new temporary passwords instead.

## Review findings / required fixes before production

1. Manager lead creation and Excel import must map `sales_expert` to an unambiguous Supabase profile. A feature-branch fix now does this and falls back to the manager account with a warning when no unique match exists.
2. Login bridge and admin Edge Function must be deployed only after reviewing required environment secrets and function configuration.
3. The first manager account must be created through a trusted dashboard/server-side process; there are currently no Auth users. Never expose the service-role key in browser code.
4. Existing localStorage data must be exported from each staff browser and verified before any cloud import. Local browser storage cannot be backed up remotely by this migration.
5. Reports, daily checklist, KPI targets, and team configuration still use localStorage. Do not describe the entire CRM as cloud-synchronized until those modules are migrated and tested.
6. Test manager, salesperson A, and salesperson B sessions for cross-owner read/update/delete isolation. Verify manager can see all leads, Excel import/export and template remain functional, password reset/first-login password change work, and backup/restore works.
7. The feature branch has not yet passed a recorded CI run at the time of this report. Do not merge until CI is green and manual acceptance tests pass.

## Recommended backup and rollback plan

1. Before migration, export a JSON CRM backup from every staff browser using the existing backup button. Store copies in an access-controlled location and verify that each file opens and contains the expected keys/records.
2. Capture the current Supabase schema and export relevant tables before DDL. Keep a timestamped copy outside the production project.
3. Apply only the reviewed additive migration. Save its exact SQL and deployment commit SHA.
4. Provision the first manager and test in a controlled sequence. Import records only after confirming owner mapping and duplicate counts.
5. Rollback for application code: redeploy the previous GitHub Pages commit. Do not drop new tables/columns automatically; additive schema can remain while investigating.
6. If data import is wrong, stop writes and reconcile using the backups and import log. Never bulk-delete cloud rows as an automatic rollback.

## Explicit non-actions

- No production SQL migration applied.
- No Edge Function deployed.
- No Auth account created.
- No production branch merged or deployed.
- No localStorage data read, copied, or deleted.
- No paid resource created.
