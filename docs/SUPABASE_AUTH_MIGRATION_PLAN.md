# Supabase Auth Migration Plan — OnBox CRM

## Status
Planning/staging only. This branch does not change `main`, and the SQL migration in this branch has NOT been applied to Supabase.

## Confirmed current state (checked 2026-10-13)
- Main CRM UI is `index.html` and currently stores leads and session/team settings in browser `localStorage`.
- Login credentials are hard-coded in client-side JavaScript. They must be treated as exposed and rotated.
- Supabase project `anbox-sales` is healthy and contains public tables: `config`, `daily_reports`, `kpi_targets`, `leaderboard`, `leads`, `reports`, `users`.
- The checked tables reported 0 rows; this does not prove that each browser's localStorage is empty.
- `auth.users` currently has 0 users.
- RLS is enabled on the seven public tables, but no policies were found. This is fail-closed for normal API access until policies are added.
- `public.users` contains a plaintext `password` column. Do not use it for authentication; do not copy these passwords into Supabase Auth.

## Required user experience
- Keep username-based sign-in (no email field shown to staff).
- Manager creates a unique temporary password for each staff member.
- Staff must change the temporary password on first successful login.
- A salesperson can read/create/update/delete only their own leads.
- A manager can access all leads.
- Keep Excel import/export behavior and all existing lead fields.

## Proposed architecture
1. Use Supabase Auth for sessions and password hashing.
2. Because Supabase Auth's standard password sign-in uses an email/phone identifier, implement a Supabase Edge Function named `username-login` that:
   - validates and normalizes the username;
   - maps it server-side to a synthetic Auth email in a fixed, non-user-controlled namespace;
   - calls Auth password sign-in using the public/anon key (never the service-role key for user sign-in);
   - returns the normal Auth session response;
   - applies rate limits, generic failure messages, and logging without logging passwords.
3. Implement an admin-only Edge Function named `admin-set-temp-password` that verifies the caller's JWT and manager role, sets a random one-time temporary password for a selected Auth user using the service-role key server-side, and sets a `must_change_password` flag. Never return or store the service-role key in browser code.
4. Add `public.profiles`, keyed by `auth.users.id`, for username, display name, role, and `must_change_password`. Only trusted server-side provisioning may create/change roles.
5. Add nullable `owner_auth_id` to `public.leads`. Populate it only after reconciling existing records and their owners. Do not guess owner mapping from display names.
6. Enforce RLS on leads using `owner_auth_id = auth.uid()` for staff and an admin-role helper for managers. Prevent staff from changing their own owner field.
7. Define separate least-privilege policies for reports, daily reports, KPI targets, leaderboard and config only after each table's intended access has been confirmed. Do not broadly enable access to every authenticated user.
8. Preserve browser localStorage as a temporary read-only migration source. Add explicit JSON backup/export, preview and duplicate detection before importing. Do not auto-delete local data.
9. Integrate Supabase JS using only Project URL + publishable key in the browser. Never expose `sb_secret_*`, service_role, database password, or other server secrets.
10. Keep Excel feature tests and add authentication, ownership, admin, migration, logout, expired-session, and RLS tests.

## Deployment sequence
A. Back up/export current local CRM data in each staff browser and verify the backup files.
B. Build and test schema/Edge Functions in a non-production Supabase project first if available.
C. Apply additive migration; verify policies and test anonymous, staff A, staff B, and manager sessions.
D. Import local data after explicit owner mapping; compare row counts and sample records.
E. Merge the GitHub pull request only after review; deploy; verify Excel import/export and rollback path.
F. Only after validation, remove hard-coded credentials from the production UI. Rotate old passwords.

## Safety constraints
- No SQL has been executed by this branch.
- No Supabase schema/data has been changed by this branch.
- No main-branch code has been changed.
- Do not merge this planning PR as a completed connection: it is a staged implementation plan and additive migration draft, not an end-to-end finished integration.
