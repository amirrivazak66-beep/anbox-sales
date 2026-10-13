# OnBox CRM — First manager bootstrap (manual, controlled)

## Why this is manual
The project currently has no Supabase Auth users or profile rows. The public username-login function cannot create users, and the admin-users function correctly refuses manager-only actions until a manager profile exists. Do not bypass this by putting a service-role key in the website or GitHub.

## Preconditions
- Do this only in the Supabase Dashboard for project `uaydruhkevdmvpyefdjm`.
- Choose a unique manager username and a one-time temporary password. Do not put the password in Git, issue comments, logs, or this document.
- The username must match `^[a-z0-9._-]{2,40}$` and should be lowercase.
- Keep the old GitHub Pages application as the live version until acceptance tests pass.

## Steps
1. Open Supabase Dashboard → project `anbox-sales` → Authentication → Users.
2. Create a user with email `<username>@auth.anbox.invalid`, set a strong one-time temporary password, and mark/confirm the email as confirmed if the UI offers that option. The synthetic domain is intentional; staff will sign in using the username, not this email.
3. Copy the new Auth user's UUID from the dashboard.
4. Open SQL Editor and run the following query after replacing all three placeholders. Use single quotes around string values; do not paste the password into SQL.

```sql
insert into public.profiles (id, username, display_name, role, must_change_password)
values (
  '<AUTH_USER_UUID>'::uuid,
  '<LOWERCASE_USERNAME>',
  '<MANAGER_DISPLAY_NAME>',
  'manager',
  true
);
```

5. Verify the row was created without returning sensitive fields:

```sql
select username, display_name, role, must_change_password
from public.profiles
where username = '<LOWERCASE_USERNAME>';
```

6. Keep the temporary password private and deliver it to the manager through a trusted channel. On first successful sign-in, the app should require a password change.
7. Test the manager account first. Then create two test salesperson accounts through the manager UI, test cross-owner isolation, and verify lead CRUD plus Excel/CSV import/export and JSON backup/restore.
8. Do not import live localStorage leads until a JSON backup has been exported and verified from every staff browser. Do not delete local data.

## Stop conditions
- If the Auth user cannot be created or the profile insert fails, stop and inspect the exact error; do not broaden RLS or grant browser access to `public.users`.
- If the login bridge or password change fails, do not merge/publish the feature branch.
- If a salesperson can see or modify another salesperson's lead, stop all rollout and fix RLS before proceeding.
- This process creates a privileged account. Only an authorized project owner should execute it.
