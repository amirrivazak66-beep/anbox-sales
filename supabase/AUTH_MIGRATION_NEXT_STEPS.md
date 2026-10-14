# Auth migration implementation notes

Status: implementation exists in live Supabase; this file is a historical checklist and is not an accurate statement that no Edge Function is deployed. Reconciled 2026-10-14.

Live project has 6 Auth users and 6 profiles, 8 owned leads, and active `username-login` v1 / `admin-users` v3 functions. The applied migration ledger does not exactly match tracked migration filenames; see [LIVE_SUPABASE_RECONCILIATION_2026-10-14.md](../docs/LIVE_SUPABASE_RECONCILIATION_2026-10-14.md).

## Username login draft
`username-login-function.draft.ts` demonstrates mapping a normalized username to a synthetic Auth email (`<username>@auth.anbox.invalid`) and exchanging the supplied password with Supabase Auth. It must not be deployed to production until rate limiting, account provisioning, and first-login password change are implemented and tested.

## Admin-issued temporary password
The admin reset function remains to be implemented and reviewed. It must verify the caller's JWT against Supabase Auth, read the caller's role from the protected profile table, allow only `manager`, update the target Auth user's password using the service-role key exclusively on the server, set `must_change_password=true`, and return the generated temporary password only once. Never log or commit credentials.

## Blockers before live connection
- Historical blocker from 2026-10-13: Auth had zero rows at that time. This is superseded by the 2026-10-14 live audit (6 Auth users, 1 manager profile).
- The legacy `public.users` table has 7 rows in the latest read-only snapshot and a legacy plaintext `password` column; do not use it for authentication or expose its rows.
- The current CRM has hard-coded browser credentials and localStorage-based lead data.
- Latest live snapshot: `public.leads` has 8 rows, all with non-null UUID `owner_auth_id`; verify each ownership boundary with controlled E2E tests and do not guess/reassign owners.
- RLS is enabled but policies are absent. Do not enable browser writes until tested policies are in place.
- Keep Excel import/export unchanged and verify it with representative files before merging.

## Safety
No production Supabase schema or data has been changed. No edge function has been deployed. Do not merge this draft or point the live UI at Supabase yet.