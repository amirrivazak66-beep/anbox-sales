# OnBox CRM — Supabase integration status

## Implemented on this feature branch
- Username-only sign-in through the `username-login` Edge Function and Supabase Auth session.
- Password change required when `profiles.must_change_password` is true.
- Manager-only create-user and reset-password UI/function; generated temporary passwords are returned once and must be delivered securely.
- Manager-created accounts are restricted to the `sales` role. The first manager must be provisioned only through a trusted server-side/dashboard process.
- Lead list, create, edit and delete use Supabase; row access is intended to be enforced by RLS.
- Excel/CSV import keeps the existing parser and duplicate detection but writes accepted rows to Supabase. Excel template/export code remains in place.
- Removed the legacy hard-coded browser password map from the feature branch.
- Existing JSON backup/restore and localStorage data are preserved. No automatic destructive migration is performed.

## Current real deployment state (checked 2026-10-13)
- GitHub Pages `main` still runs the previous CRM code. This feature branch/PR has NOT been merged.
- The additive migration `onbox_crm_auth_integration_20261013` HAS already been applied to the existing production Supabase project. New schema and RLS policies are present.
- Production Supabase Edge Functions `username-login` and `admin-users` are deployed and ACTIVE. They are not yet usable for normal staff sign-in because there are no Auth users or profile rows.
- The production Supabase counts checked after migration were 0 for `auth.users`, `public.profiles`, and `public.leads`. This does not reveal browser localStorage data.
- No paid resource or paid development branch was created.
- CI static validation and smoke checks passed on the observed feature-branch commit. These are not end-to-end browser/Auth/RLS tests.

## Required before live release
1. Review the currently deployed Edge Function versions against the reviewed feature-branch source. Do not assume they match merely because the slugs are ACTIVE.
2. Add/verify appropriate login abuse protection and generic failure behavior. Supabase Auth endpoint rate limits should be verified; do not claim custom per-IP rate limiting exists.
3. Bootstrap the first manager safely using a trusted dashboard/server-side process. There are currently no Auth users; create a matching `profiles` row and verify the role is exactly `manager`. Never place service-role credentials in browser code or commit them.
4. Verify standard Edge Function secrets are configured; never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser.
5. Test with a manager and two sales accounts: wrong password, first-login password change, create/reset sales account, lead CRUD, and cross-owner read/update/delete isolation through the actual app and direct REST/RLS calls.
6. Test Excel template, Excel/CSV import, duplicate detection, export, and JSON backup/restore using representative files.
7. Export a JSON backup from each staff browser before migrating. Then sign in on each browser and use “Transfer my local leads to Supabase”; review counts and sample records. LocalStorage is not accessible to this migration automatically and must not be deleted.
8. Team settings, checklist, KPI targets and reports still use browser-local storage. Do not describe the whole CRM as cloud-synchronized until those modules are separately migrated and tested.
9. Merge and publish only after the above release gates pass. Keep the previous `main` commit as the code rollback point.

## Rollback boundaries
- Code rollback: redeploy the previous GitHub Pages `main` commit.
- Do not automatically drop the additive database columns/table or delete rows during rollback.
- If import results are wrong, stop further writes and reconcile from each browser's verified JSON backup. Never run a bulk-delete as automatic rollback.
