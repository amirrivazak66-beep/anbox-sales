# Release Status — 2026-10-14

## Current mainline snapshot
- Public homepage: index.html, title «مدیرنگر | هوش مدیریتی کسب‌وکار».
- Preserved application: dashboard.html, same title and new inline SVG mark.
- Latest mainline SHA at time of this status note: 6668de02e141486fc6d95119658f3b442c5565a5.
- Supabase project remains unchanged by the code/branding work.

## Completed and merged
- PR #9 — Product Blueprint, Phase 1 product definition, technical audit and roadmap.
- PR #10 — Dependency-free static smoke checks; corrected the old CRM workflow to inspect dashboard.html rather than the public landing page.
- PR #11 — Checklist Save button now persists the current checkbox values to the existing per-user localStorage key.
- PR #12 — Follow-up audit records read-only database privilege/dependency checks and corrected checklist finding.
- PR #13 — Provisional ManagerNegar brand and inline SVG logo in login/sidebar/header and public landing page.
- PR #14 — Remaining visible legacy brand labels cleaned up while preserving database and backup compatibility.
- PR #15 — Playwright browser smoke tests with mock Supabase and isolated local storage.
- PR #16 — Provisional brand guidelines and legal-clearance checklist.

## Automated verification
Latest relevant browser-test branch run passed:
- Browser smoke checks (mock data only).
- Static dashboard smoke checks.
- CRM Supabase static validation.
- CRM smoke checks.

The browser test exercises the landing-page brand, carousel and mobile menu; login validation and a synthetic manager session; dashboard/leads/team/pipeline/reports/settings navigation; and checklist persistence across reload. The test mocks Supabase and does not use production credentials or records.

A final static review of the current main files also found:
- No duplicate static IDs in index.html or dashboard.html.
- All inline JavaScript blocks pass syntax parsing.
- Both pages contain the provisional brand.
- The login/sidebar/dashboard title no longer uses the old AnBox wordmark.
- The existing database field key anbox_fit, legacy Excel header alias, backup format identifier and localStorage key structure remain preserved.

## Not yet verified — do not infer completion
- Actual GitHub Pages response/deployment was not verified through the available tools. Confirm the live URL in a browser after Pages finishes publishing.
- No full Supabase database backup/restore point was verified.
- Real production login and role boundaries were not exercised by the mock browser test.
- Excel/CSV data round-trip has not been run against a real file.
- No database rows, RLS policies, Auth settings or Edge Functions were changed.

## Security follow-up — production changes held
- public.users has RLS enabled and no policies; read-only inspection found grants only for postgres and service_role and no references in public SQL routines/views/triggers. Do not delete it until all external dependencies and password-storage history are verified.
- public.is_crm_manager() is SECURITY DEFINER and explicitly grants EXECUTE to anon and authenticated; PUBLIC is not granted EXECUTE. Review all callers before any privilege change.
- Supabase Advisor reports leaked-password protection disabled and RLS initialization-plan performance warnings. Address these only after restore capability, test accounts and rollback plan are available.
- Five indexes are reported unused; do not remove them based only on low observed usage.

## Next execution sequence
1. Confirm the live homepage and dashboard URLs in a real browser.
2. Verify database backup/restore capability through the Supabase project dashboard or an authorized backup process.
3. Run real-user role and Excel round-trip tests in a safe environment.
4. Prepare a least-privilege security migration plan without applying it to production yet.
5. Only then continue to the next Phase 1 feature implementation.

## Brand caveat
«مدیرنگر» is a provisional working identity. Exact-name web search returned no results in the limited search performed, but trademark, company-name, social-handle and domain availability have not been cleared.
