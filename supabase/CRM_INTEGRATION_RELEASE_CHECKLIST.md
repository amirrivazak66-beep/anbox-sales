# OnBox CRM — Supabase integration status

## Implemented on this feature branch
- Username-only sign-in through the `username-login` Edge Function and Supabase Auth session.
- Password change required when `profiles.must_change_password` is true.
- Manager-only create-user and reset-password UI/function; generated temporary passwords are returned once and must be delivered securely.
- Lead list, create, edit and delete use Supabase; row access is intended to be enforced by RLS.
- Excel/CSV import keeps the existing parser and duplicate detection but writes accepted rows to Supabase. Excel template/export code remains in place.
- Removed the legacy hard-coded browser password map.
- Existing JSON backup/restore and localStorage data are preserved. No automatic destructive migration is performed.

## Required before live release
1. Apply `supabase/migrations/20261013000200_crm_auth_integration.sql` on a Supabase development branch and verify the migration succeeds.
2. Bootstrap the first manager safely. There are currently no Auth users; the manager must be created through a trusted Supabase dashboard/server-side process and have a matching `profiles` row. Do not place service-role credentials in browser code or commit them.
3. Deploy `username-login` with JWT verification disabled (it authenticates via Supabase Auth password grant) and `admin-users` with JWT verification enabled.
4. Configure the standard Supabase Edge Function secrets; never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser.
5. Add the controlled localStorage-to-cloud migration/import flow and reconcile lead ownership for each staff browser before retiring local data.
6. Test manager, two sales accounts, wrong password, first-login password change, lead CRUD across devices, direct REST RLS access, Excel/CSV import and export, and JSON backup/restore.
7. Confirm the non-lead data areas (team settings, checklist, KPI reports) are still browser-local; their Supabase tables need separate persistence/policies before claiming full multi-device CRM sync.

## Current deployment status
- GitHub branch only; main/live site has not been changed.
- No Supabase SQL migration has been applied.
- No Edge Function has been deployed by this change.
- Existing database rows were reported as empty during inspection, but localStorage on staff browsers may contain important records.
