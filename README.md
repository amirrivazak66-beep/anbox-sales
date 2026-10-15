# anbox-sales

A Persian, right-to-left web repository for sales-team and CRM workflows. The current landing page source uses the title «مدیرنگر | هوش مدیریتی کسب‌وکار» and describes team sales management, KPI monitoring, lead follow-up, and target achievement. Confirm product naming with the owner before renaming user-facing surfaces to OnBox.

## Start here
- Product context and brand constraints: [docs/ONBOX_CONTEXT.md](docs/ONBOX_CONTEXT.md)
- Verified architecture map and validation notes: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- Agent safety and contribution instructions: [AGENTS.md](AGENTS.md) (available on the agent workflow branch until that branch is merged)

## Repository orientation
- `index.html` — Persian/RTL landing page.
- `dashboard.html` — Persian/RTL dashboard page with XLSX/Excel library loading fallbacks.
- `.github/workflows/` — automated static smoke and validation workflows.
- Supabase-related files — inspect the current repository tree and relevant migrations/functions before backend work.

## Validation
The static smoke workflow runs:

```sh
node scripts/smoke-check.mjs
```

Other checks may be available; inspect the workflows and scripts before choosing the validation commands. Do not report a check as passed unless it was actually run.

## Safety
- Work on a dedicated branch and propose changes through a pull request.
- Do not commit database dumps, credentials, tokens, or real customer data.
- Do not make production database changes, alter access controls, merge, or deploy without explicit approval for that specific operation.
- Keep private backups outside this repository.
