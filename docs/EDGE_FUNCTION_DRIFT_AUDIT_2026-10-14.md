# Live Edge Function Drift and Security Review

**Audit date:** 2026-10-14  
**Project ref:** `uaydruhkevdmvpyefdjm`  
**Mode:** read-only; no production changes made  
**Repository base:** `651a5e2783e2fdcec3dddc795f6c18ce00f72075`

## Findings

### 1. Deployed source drift — admin-users v3

- Deployed function: `admin-users`, version 3, `verify_jwt=true`.
- GitHub source path: `supabase/functions/admin-users/index.ts`.
- The deployed source includes two manager-only actions that are absent from the tracked GitHub file: `update_user` and `delete_user`.
- `update_user` is restricted to target profiles with role `sales`, checks for duplicate usernames, updates Auth identity metadata and profile fields, and attempts to roll back the Auth email if the profile update fails.
- `delete_user` is restricted to sales profiles, rejects deleting the caller, checks for assigned leads and refuses deletion when any are found, then deletes the Auth user.
- This is a source-of-truth/reproducibility risk: a future deployment from the tracked source could unintentionally remove currently deployed manager functionality.
- Safe remediation: copy the retrieved deployed source into GitHub in a code-only PR, add static regression guards, run CI, and do not deploy the function as part of this reconciliation. Follow up with tests against isolated accounts before future function deployment.

### 2. Deployed source match — username-login v1

- Deployed source exactly matches `supabase/functions/username-login/index.ts` in GitHub (2,230 characters in each source at audit time).
- `verify_jwt=false` is required for the unauthenticated username/password exchange pattern currently used by this function. This does not by itself establish abuse protection; rate limiting, Auth rate limits, monitoring and generic failure behavior still need review.
- The function accepts POST only, normalizes/validates usernames, limits password input length, returns generic invalid-credential errors, and uses the anon key rather than a service-role key.

### 3. Security Advisor / ACL items — no changes applied

- `public.is_crm_manager()` is `SECURITY DEFINER`, has an empty configured search path, references `public.profiles` explicitly, and is executable by `anon` and `authenticated` according to the live ACL. Advisor warnings remain.
- Leaked-password protection is disabled.
- `public.users` and `public.leaderboard` have RLS enabled without policies. Existing grants/dependencies and intended access must be verified before any policy/grant changes.
- Three RLS initialization-plan performance warnings and four unused-index notices were observed. Do not optimize policies or drop indexes without query evidence and regression/rollback coverage.

## Recovery gate and non-goals

- No real database backup file or successful restore rehearsal has been verified.
- The organization is on the Free plan; do not create a paid project or branch without explicit cost review/approval.
- Do not change production grants, RLS, Auth settings, schema or Edge Functions before a real backup, separate restore rehearsal, dependency mapping, role tests and a rollback plan.
- This audit is not a live end-to-end test using manager/salesperson credentials and does not certify every authorization path.

## Next sequence

1. Reconcile deployed `admin-users` source into the repository through a PR; add guards for the two actions and the assigned-lead deletion block.
2. Validate GitHub Actions for the PR and confirm main remains unchanged until merge.
3. Arrange a trusted logical backup and restore rehearsal outside production; never send credentials or dumps through chat or commit them.
4. Use isolated manager/sales accounts to test role boundaries, username/password flow, account edits, deletion refusal when leads exist, password reset/change, lead ownership, Excel round-trip, KPI and reports.
5. Only after these gates, propose narrowly scoped production security changes.
