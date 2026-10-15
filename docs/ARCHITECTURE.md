# Repository Architecture (Verified Baseline)

This document records only what has been verified from repository files. It is an orientation map, not a claim that the entire production architecture has been independently audited.

## Web application
- `index.html` is a standalone HTML landing page. It declares Persian language and RTL layout, and contains inline CSS and page content.
- `dashboard.html` is a standalone HTML dashboard. It declares Persian language and RTL layout, includes inline CSS/JavaScript, and attempts to load SheetJS/XLSX from multiple external CDNs as fallbacks.
- The repository also contains other dashboard-related files/scripts. Before editing, inspect the current tree and determine which file is actually used by the live deployment; do not infer from filename alone.

## Supabase and backend
- The repository includes Supabase-related migrations/functions or validation workflows, but the exact live schema, deployed Edge Functions, environment configuration, and current production settings must be checked against the current repository and Supabase project before making claims.
- Never commit secrets or copy production credentials into source code.
- For local validation, prefer a local Supabase stack or mocks. Do not point local tests at production by default.
- Before proposing a migration, inspect all relevant migration files, existing RLS policies, role checks, and authorization paths. A SQL dump alone is not a complete backup of all Supabase project configuration.

## CI and checks verified
- `.github/workflows/static-smoke.yml` runs `node scripts/smoke-check.mjs` on pull requests targeting `main` and on configured pushes.
- `.github/workflows/supabase-crm-validation.yml` includes static validation of inline JavaScript in `index.html`.
- The agent instructions also name `node scripts/browser-smoke.mjs` when Playwright is available. Confirm the script and its prerequisites exist before relying on it.
- Inspect the other workflow files before changing test or release behavior.

## Deployment
- The repository's established workflow indicates GitHub Pages deployment from `main`; verify repository Pages settings and the latest Actions run before making deployment claims.
- Never merge to `main` or trigger a production deployment unless the user explicitly approves the specific change and deployment.

## Required investigation before architecture-sensitive changes
1. Check the current branch, working-tree status, recent commits, and existing open pull requests.
2. Read the relevant HTML, JavaScript, SQL migrations, Edge Functions, RLS policies, and workflows.
3. Identify whether the target behavior is implemented client-side, in Supabase, or in both.
4. Run the narrowest relevant existing checks and report exactly what ran and what did not.
5. Keep the change isolated in a task branch and summarize risks, test results, and deployment implications.

## Known limitations of this document
This is a verified starting map, not a full security review or an exhaustive schema/API diagram. Details such as every table, foreign key, role permission, Edge Function endpoint, environment variable, and deployment secret have not been exhaustively enumerated here. Update this document when those details have been inspected and confirmed.
