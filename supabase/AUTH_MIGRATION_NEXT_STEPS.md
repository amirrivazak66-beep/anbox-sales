# Auth migration implementation notes

Status: draft in `feature/supabase-auth-migration-plan`; not deployed.

## Username login draft
`username-login-function.draft.ts` demonstrates mapping a normalized username to a synthetic Auth email (`<username>@auth.anbox.invalid`) and exchanging the supplied password with Supabase Auth. It must not be deployed to production until rate limiting, account provisioning, and first-login password change are implemented and tested.

## Admin-issued temporary password
The admin reset function remains to be implemented and reviewed. It must verify the caller's JWT against Supabase Auth, read the caller's role from the protected profile table, allow only `manager`, update the target Auth user's password using the service-role key exclusively on the server, set `must_change_password=true`, and return the generated temporary password only once. Never log or commit credentials.

## Blockers before live connection
- There are currently zero rows in `auth.users`; there is no manager Auth account yet.
- The current `public.users` table is empty and has a legacy plaintext `password` column; do not use it for authentication.
- The current CRM has hard-coded browser credentials and localStorage-based lead data.
- The `public.leads` table currently has zero rows and `created_by` is bigint; ownership migration needs explicit mapping to UUID `owner_auth_id` and must not guess by display name.
- RLS is enabled but policies are absent. Do not enable browser writes until tested policies are in place.
- Keep Excel import/export unchanged and verify it with representative files before merging.

## Safety
No production Supabase schema or data has been changed. No edge function has been deployed. Do not merge this draft or point the live UI at Supabase yet.