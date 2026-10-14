# Supabase Backup and Recovery Runbook — ManagerNegar

Date: 2026-10-14  
Project ref: `uaydruhkevdmvpyefdjm`  
Organization plan observed during audit: Free

## Current status

- The Supabase project is `ACTIVE_HEALTHY`, on PostgreSQL 17.6.
- The organization is on the Free plan.
- Supabase's official documentation says automatic daily database backups are available on Pro, Team, and Enterprise plans, not Free. Free-plan projects should regularly export data with Supabase CLI and keep off-site backups.
- No backup file was created or restore tested during this audit. Therefore recovery is **not yet verified**.
- No production database rows, schema, RLS policies, Auth settings, or Edge Functions were changed during this audit.

References:
- https://supabase.com/docs/guides/platform/backups
- https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore
- https://supabase.com/docs/guides/deployment/ci/backups

## Manual logical backup procedure

Run these steps on a trusted computer with Supabase CLI installed and Docker available. Do not put database passwords, access tokens, or connection strings into GitHub issues, source files, or chat.

1. Open Supabase Dashboard → Project Settings → Database and retrieve the database connection details securely.
2. In a private working directory, use the database connection string as an environment variable or enter it only into a trusted local secret prompt. Avoid committing it to shell history.
3. Export roles, schema, and data separately:

```bash
supabase db dump --db-url "$SUPABASE_DB_URL" -f roles.sql --role-only
supabase db dump --db-url "$SUPABASE_DB_URL" -f schema.sql
supabase db dump --db-url "$SUPABASE_DB_URL" -f data.sql --use-copy --data-only
```

4. Confirm that all three files exist and are non-empty. Record the date, project ref, CLI version, and file hashes in a private backup log.
5. Store an encrypted copy outside this repository (for example, an encrypted local drive plus a separate secure backup destination). Do not commit production data or roles to this public repository.
6. Verify the files can be read and inspect the schema dump for expected application tables, policies, and functions. A successful dump is not proof that restoration works.
7. For a true recovery test, restore into a separate, disposable PostgreSQL/Supabase environment—not production—and validate schema, representative row counts, RLS policies, functions, and application behavior. Do not test restore by overwriting the live project.

Important limitations:
- A CLI dump excludes Supabase-managed schemas such as Auth and Storage internals; see the official restore guide for special handling of customizations and project-specific services.
- Database dumps do not include the actual objects stored through the Supabase Storage API. Back up required Storage objects separately.
- Keep the backup encrypted and access-controlled because it contains business data and may include personal information.

## Before future production changes

Do not apply database/security migrations until:
- A fresh off-site backup exists.
- The dump files have been checked for completeness.
- A recovery target and restoration procedure are identified.
- A rollback plan and a quiet deployment window are agreed.
- The planned SQL migration has been reviewed against current grants, RLS policies, and application role behavior.

## Candidate security work (not applied)

The read-only audit observed:
- `public.is_crm_manager()` is SECURITY DEFINER and has EXECUTE grants for `anon` and `authenticated`; inspect all callers and verify role behavior before changing grants.
- Supabase Advisor reports leaked-password protection disabled. Review the Auth setting and its compatibility with current account/password workflows before enabling.
- RLS is enabled without policies on `public.users` and `public.leaderboard`. Inspect grants, foreign keys, and expected use before changing either table.
- Several RLS policy performance warnings and unused-index notices exist. Do not optimize/drop indexes without query evidence and a rollback plan.

No candidate change in this section is authorized or applied by this document.
