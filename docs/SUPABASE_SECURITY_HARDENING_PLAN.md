# Supabase Security Hardening Plan — ManagerNegar

Date: 2026-10-14  
Project ref: `uaydruhkevdmvpyefdjm`  
Status: **Planning only — no production changes authorized or applied**

## Preconditions

1. Create a fresh logical backup using `docs/SUPABASE_BACKUP_RECOVERY_RUNBOOK.md`.
2. Keep the dump encrypted and outside this public repository.
3. Validate the dump and, before high-risk changes, rehearse restoration in a separate environment.
4. Confirm real manager and salesperson accounts are available for regression tests.
5. Capture current policies, grants, function definitions, Auth settings, and relevant table counts before a change.

## Findings from read-only inspection

### 1. `public.is_crm_manager()` is callable by anon and authenticated

Current function:
- SQL, STABLE, SECURITY DEFINER.
- Empty `search_path`.
- Checks whether `auth.uid()` maps to a `public.profiles` row with role `manager`.
- EXECUTE ACL observed: `postgres`, `anon`, `authenticated`, and `service_role`.
- Current RLS policies on `config`, `crm_kpi_definitions`, `reports`, and `leads` call this function in role checks.

Proposed action (not applied):
- Review all function callers and confirm no unauthenticated feature intentionally invokes this RPC.
- If not required, remove EXECUTE for `anon` while retaining the authenticated/service-role behavior needed by existing policies and server tasks.
- Keep SECURITY DEFINER only if needed; if retained, preserve the fixed empty search path and fully qualify referenced objects.
- Test anonymous access, manager access, salesperson access, and every affected CRUD operation before and after.

### 2. Leaked-password protection is disabled

Proposed action (not applied):
- Review Supabase Auth password-security configuration and expected user onboarding/reset flows.
- Enable leaked-password protection only after confirming plan availability and testing signup/password-change behavior.
- Do not change users' passwords or invalidate sessions as part of this setting review.

### 3. RLS enabled with no policy: `public.users` and `public.leaderboard`

Proposed action (not applied):
- Do not delete either table or disable RLS based only on the advisor.
- Recheck grants, foreign keys, code references, and intended consumer roles.
- For `public.users`, prior read-only inspection found grants only for `postgres` and `service_role`, with foreign-key dependencies from `kpi_targets`, `leaderboard`, and `daily_reports`.
- For `public.leaderboard`, verify grants and application usage. If client roles have no access and no intended use, document that explicitly; otherwise design a narrowly scoped policy.
- Do not add broad `USING (true)` policies.

### 4. RLS performance advisor findings

Affected policies:
- `crm_kpi_definitions.crm_kpi_select_own_or_manager`
- `kpi_targets.kpi_targets_owner_or_manager_select`
- `daily_reports.daily_reports_owner_or_manager_select`

Proposed action (not applied):
- Consider wrapping stable auth/function calls in scalar subqueries, as suggested by the Supabase advisor, only after confirming equivalent semantics.
- Verify plans and role behavior with test accounts.
- Do not mix performance edits with security privilege changes in a single migration.

### 5. Unused-index advisor findings

The advisor reports five indexes as unused. Do not drop them based only on the current observation window. Review table size, workload, constraints, and query plans first.

## Migration and rollout approach

1. Split work into independent migrations: function privilege adjustment, Auth setting change (dashboard configuration, not SQL), and any table-policy work.
2. For each SQL migration, include a header with purpose, preconditions, rollback SQL, and validation queries.
3. Apply first to an isolated test project with representative schema and synthetic users; do not copy production personal data to tests.
4. Test both positive and negative permissions:
   - Anonymous users cannot read/write private business data.
   - Salesperson sees and manages only permitted leads.
   - Manager retains the required cross-team view and manager-only operations.
   - Authenticated users cannot elevate their role by editing client-side state.
5. Roll out only after backup and recovery path are confirmed. Apply one change at a time and re-run the manager/salesperson live checks.
6. Run Supabase Security and Performance Advisors after each database change and record before/after results.

## Rollback principle

If a test fails, stop further rollout and restore the previous grant/policy/function definition using the captured pre-change state. Do not run a project restore or destructive SQL against production as a routine rollback.

## Current conclusion

This is a planning document only. No grants, policies, tables, Auth settings, functions, or production data were modified by this audit.
