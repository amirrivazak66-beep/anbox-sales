# OnBox / anbox-sales — Product Context

## Purpose
This repository contains a Persian, right-to-left web experience for sales-team and CRM workflows. The repository name is `anbox-sales`; the current landing page title and visible product copy use the name «مدیرنگر» (management intelligence). Do not assume the public product naming is fully aligned with the OnBox brand until the product owner confirms the intended naming.

## Verified product surfaces
- `index.html`: Persian (`lang="fa"`) and RTL landing page; its current metadata describes sales-team management, KPI monitoring, lead follow-up, and target achievement.
- `dashboard.html`: Persian/RTL dashboard page; source includes Excel/XLSX loading fallbacks from external CDNs.
- Supabase-related SQL/functions and GitHub Actions exist in the repository tree/history; inspect the actual files before changing database or authorization behavior.

## Brand guidance supplied by the product owner
- OnBox primary blue: `#0047BB`; white is a supporting color.
- Brand motif: box/pixel visual language.
- Do not redraw, replace, or alter the official logo without explicit instruction.
- Preserve Persian RTL behavior and existing workflows unless a task specifically asks to change them.
- The product owner has described OnBox as a logistics/4PL platform and the sales CRM as a lead-management workflow. Treat these as product context, not proof that every existing page currently implements every capability.

## Important workflow invariants
- Keep backups private and outside this repository (for example, `D:\\onbox-backups` on the owner's Windows machine). Never commit SQL dumps, exports, credentials, tokens, or real customer data.
- Treat the live website and production Supabase project as production systems.
- Prefer small, reviewable changes on a dedicated branch and use a pull request.
- Do not merge, deploy, run destructive SQL, apply production migrations, change production data, or modify production access controls without explicit approval for that exact operation.
- Preserve existing authentication checks, role boundaries, owner/manager restrictions, and Supabase Row Level Security (RLS). Inspect current implementation before proposing changes.
- Never put service-role keys, database passwords, access tokens, or connection strings into browser code or committed files.

## Product questions not yet authoritatively settled in repository docs
- Canonical public product name across the landing page, dashboard, and OnBox brand.
- Current user roles and their exact permission matrix.
- Complete list of supported CRM workflows and source-of-truth for KPI definitions.
- Official logo asset location and approved design tokens beyond the primary blue above.

When these questions matter to a task, inspect the implementation and ask the product owner only if code/repository evidence cannot resolve them.
