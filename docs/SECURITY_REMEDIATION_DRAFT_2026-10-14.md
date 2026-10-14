# Security Remediation Draft and Role Test Plan

**Created:** 2026-10-14  
**Status:** planning only — no production changes authorized or applied  
**Project ref:** `uaydruhkevdmvpyefdjm`

## Confirmed read-only findings

1. `public.is_crm_manager()` is `SECURITY DEFINER`, configured with an empty search path, and its body explicitly references `public.profiles`. Its current ACL permits EXECUTE to `anon`, `authenticated`, `service_role`, and `postgres`.
2. The function returns a boolean based on `auth.uid()` and the matching `profiles.role`. It is used by multiple RLS policies, so removing EXECUTE from `authenticated` without a redesign could break manager/owner queries.
3. `public.users` and `public.leaderboard` have RLS enabled but no policies. Previous ACL inventory showed no table grants to `anon` or `authenticated`; verify grants again immediately before any change.
4. Supabase Auth leaked-password protection is disabled.
5. The legacy `public.users` table has a `password` text column and is referenced by foreign keys from `daily_reports`, `kpi_targets`, and `leaderboard`. This plan does not inspect any password values and does not authorize table retirement.

## Candidate change A — remove anonymous EXECUTE only

**Candidate SQL; do not run until all preconditions below pass:**

```sql
REVOKE EXECUTE ON FUNCTION public.is_crm_manager() FROM anon;
GRANT EXECUTE ON FUNCTION public.is_crm_manager() TO authenticated;
```

This deliberately leaves authenticated execution in place because RLS policies call the function. Do not change the function to SECURITY INVOKER, move schemas, revoke authenticated execution, or alter policies in the same change; those are separate design decisions.

### Preconditions

- Encrypted backup of roles/schema/data exists outside GitHub and is readable.
- Restore rehearsal into a separate disposable environment succeeds.
- Reconfirm current function body, ACL, policies, grants, and migration ledger.
- Run tests against isolated anon, sales, and manager identities.
- Confirm the frontend does not intentionally call `/rest/v1/rpc/is_crm_manager` while unauthenticated.
- Prepare rollback SQL and a deployment window.

### Role-based regression matrix

| Test | Identity | Expected result |
|---|---|---|
| Direct RPC `is_crm_manager` | anon | Permission denied after candidate change; no schema details returned |
| Direct RPC `is_crm_manager` | salesperson | `false` |
| Direct RPC `is_crm_manager` | manager | `true` |
| Read own profile | salesperson | Own profile only |
| Read another salesperson profile | salesperson | Denied/empty per existing policy |
| Read all profiles for team management | manager | Allowed per existing policy |
| Read own lead | salesperson | Allowed |
| Read another salesperson's lead | salesperson | Denied/empty |
| Read team leads | manager | Allowed |
| Insert lead owned by self | salesperson | Allowed when required fields valid |
| Insert lead owned by another user | salesperson | Rejected by policy |
| Edit own lead | salesperson | Allowed |
| Edit another user's lead | salesperson | Rejected/hidden |
| Update/delete team lead | manager | Allowed per existing policy |
| Read manager reports/config | manager | Allowed |
| Read manager reports/config | salesperson | Denied/empty |
| Read/write legacy `users` and `leaderboard` | anon and authenticated | Remains inaccessible unless a separate, reviewed requirement says otherwise |

The expected results must be confirmed in the isolated restore environment first. Test both PostgREST/API behavior and the application UI.

## Candidate change B — leaked-password protection

Enable the Supabase Auth leaked-password protection setting only after confirming current project plan/availability, testing password change/reset flows, and agreeing how to handle passwords rejected by the protection check. This is an Auth configuration change rather than an ordinary SQL migration; do not change it through this draft.

## Candidate change C — legacy tables

Do not add policies to `users` or `leaderboard` merely to silence Advisor warnings. First map all frontend references, foreign keys, grants, reports/KPI dependencies, and whether legacy rows are still needed. If unused, prepare a separate deprecation/migration plan with an export and rollback path. Never query or expose the legacy password column values during the inventory phase.

## Rollback candidate for change A

If the controlled test fails and rollback is required, restore the prior grant:

```sql
GRANT EXECUTE ON FUNCTION public.is_crm_manager() TO anon;
GRANT EXECUTE ON FUNCTION public.is_crm_manager() TO authenticated;
```

Use only after confirming the live ACL still matches the pre-change state. A rollback is not a substitute for a backup.

## Blocking recovery requirement

The connected Supabase tools provide metadata, SQL, migration, and Edge Function operations but do not expose a database dump or verified restore-rehearsal operation. The backup/recovery runbook requires a trusted local Supabase CLI workflow. Until a human operator completes and verifies that workflow, keep all production security changes blocked.
