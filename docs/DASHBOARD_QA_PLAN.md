# Dashboard Stabilization — Phase 0/1 QA Plan

## Scope and safety
This is a code-only smoke-test harness. It does not log in to production, call Supabase, change database records, or modify browser localStorage. It is a first safety net, not a replacement for browser end-to-end tests.

## Automated checks
- Landing and dashboard files exist and are not unexpectedly empty.
- Required landing and dashboard markers remain present.
- Static HTML IDs are unique.
- Inline JavaScript blocks pass Node syntax checks.
- Relative local links resolve to files in the repository.
- A guard rejects accidental `localStorage.clear()` and destructive SQL markers in dashboard HTML.

## What this does not prove
- It does not render HTML in a browser or test layout/interaction.
- It does not authenticate to Supabase or prove RLS correctness.
- It does not verify that GitHub Pages has published the latest commit.
- It does not prove Excel data round-trips without loss.
- It does not verify database backup restoration.

## Manual / staging acceptance checklist
- [ ] Landing page loads at desktop and mobile sizes; slider works; reduced-motion preference is respected.
- [ ] Login succeeds for an authorized test user and fails safely for invalid credentials.
- [ ] Session survives refresh; logout ends the session.
- [ ] Manager and salesperson role boundaries are verified with test accounts.
- [ ] Create, edit, assign, filter, export and delete a test lead; delete requires confirmation.
- [ ] Excel/CSV export and re-import preserve values and dates.
- [ ] KPI calculations match independently calculated expected values across day/month boundaries.
- [ ] Reports and pipeline display correct empty/loading/error states.
- [ ] Checklist toggles persist after save/reload (current static code suggests this may be broken).
- [ ] JSON backup exports the expected keys and restores only in a disposable test browser profile.
- [ ] Team, pipeline, reports and settings pages all render and navigate without blank panels.
- [ ] The deployed URL serves the expected commit and dashboard login link opens `dashboard.html`.

## Release gate
Do not make a production schema, RLS, Edge Function or data migration until:
1. A database restore point has been verified.
2. Relevant dependencies and permissions have been mapped.
3. The change is isolated in a branch and has a rollback plan.
4. Required checks pass in staging.
5. The final live deployment has been checked.
