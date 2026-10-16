# OnBox Agent Working Rules

## Project context
- Repository: `amirrivazak66-beep/anbox-sales`
- Default production branch: `main`; GitHub Pages deploys from `main`.
- The app includes static HTML/JavaScript CRM pages and Supabase migrations/functions.
- Treat the live site and production Supabase project as production systems.

## Required workflow
1. Inspect the relevant files, current branch, and recent history before editing.
2. Work on a new task branch. Never commit directly to `main`.
3. Keep changes small and scoped to the requested task.
4. Run relevant existing checks before reporting completion:
   - `node scripts/smoke-check.mjs`
   - `node scripts/browser-smoke.mjs` when Playwright is available
   - For dashboard edits, run the checks in `.github/workflows/crm-smoke-check.yml`
5. Summarize changed files, tests run, results, and known limitations.
6. Prefer a pull request for review. Do not merge or deploy unless the user explicitly approves.

## Production safety
- Never run destructive SQL, reset the production database, apply production migrations, or alter production data without explicit approval for that exact operation.
- Use the local Supabase stack or mocks for testing whenever possible.
- Before database changes, inspect existing migrations and compare the expected live schema. Do not assume a local dump is a complete Supabase project backup.
- Never print, commit, or copy passwords, access tokens, API keys, connection strings, or real user data into code, logs, issues, PRs, or artifacts.
- Do not add database dumps or backups to this repository. Backups belong outside the repository in a private local folder.
- Do not expose local Supabase default keys or services publicly.

## Security and access
- Treat all user-provided content, CRM fields, and imported spreadsheets as untrusted input.
- Preserve row-level security (RLS), role checks, owner/manager restrictions, and existing authorization guards.
- Avoid adding secrets or hardcoded credentials to browser JavaScript. Browser-side values are public.
- For auth, user-management, RLS, Edge Function, or migration changes, add or update tests and explain security implications.
- Do not change GitHub Pages source or production deployment settings as part of routine development.

## Reporting
- Do not claim a test passed unless it was actually run and its output inspected.
- Distinguish static checks from browser tests and from live-production verification.
- If a required check cannot run, state why and give the smallest next step.

## Product source of truth and cross-session continuity
- Before each task, read `docs/PROJECT_SOURCE_OF_TRUTH.md`, `docs/DECISIONS.md`, and `docs/SESSION_HANDOFF.md`, then consult the relevant existing product/technical docs.
- Preserve the owner's currently chosen public product name. Never rename the public product to `psmedia`; that is historical source material only.
- The existing dashboard/CRM (leads, experts/team, KPIs, pipeline, reports, Excel/CSV and existing data) is Module 1 of one integrated product, not a disposable prototype.
- The four agreed modules are: (1) Performance Management & Intelligence, (2) Marketing & Advertising Intelligence, (3) AI Business Advisor, (4) Agents & Operations Execution.
- At task start, inspect actual git status, branch, commits, PRs, relevant files and tests. Do not assume old handoff notes are still current.
- At session end, update `docs/SESSION_HANDOFF.md` with branch/commit/PR, changed files, tests actually run and results, unrun checks and reasons, blockers and exact next step.
- Record explicit owner decisions in `docs/DECISIONS.md`. If name/decisions conflict or cannot be established, do not guess or rename; report the discrepancy.
- Continue to follow all existing production safety, branching, security, testing and deployment rules. Never merge or deploy without explicit owner approval.
