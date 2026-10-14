# Local Persistence to Cloud Migration Plan

**Date:** 2026-10-14  
**Status:** discovery and implementation plan only; no application or production changes authorized by this document  
**Branch/PR:** `docs/continuity-after-pr27` / PR #28  
**Production project:** `uaydruhkevdmvpyefdjm`

## Objective

Make the manager/salesperson experience consistent across devices and browsers by moving active settings/checklist persistence to the authenticated Supabase backend, without losing current browser data or breaking existing exports/imports. This is a phased plan, not an instruction to change production.

## Read-only code observations on current main

- `dashboard.html` loads and creates leads in Supabase `public.leads`; Excel/CSV imports write to the same table. The existing `leads_<username>` localStorage key remains a legacy import source and is included in JSON backup.
- Checklist state is stored per browser under `checklist_<username>`. `updateChecklist` and `saveChecklist` write localStorage only; another browser/device will not see the same state.
- `shared_team` and `shared_kpi_targets` are still read/written by legacy helper functions. Current team display and KPI configuration also query cloud `profiles` and `crm_kpi_definitions`. Before deleting or repurposing legacy helpers, map every HTML/JS call site and test old backup compatibility.
- Cloud KPI definitions already include `owner_auth_id`, `key`, `name`, `icon`, `target`, `target_daily`, and `target_monthly`. Prefer this existing cloud source for KPI configuration; do not create a second competing target store.
- The current JSON backup uses format identifier `anbox-crm-backup`, version 1, and key pattern `leads_*`, `checklist_*`, `kpi_*`, `shared_team`, and `shared_kpi_targets`. Preserve this contract and keep importing old backups safely.
- `reports` and `daily_reports` have distinct legacy naming/type conventions. Do not reuse either table for checklist storage without reviewing the complete schema and all writers/readers.

## Proposed implementation sequence

### Step 1 — finish discovery (no writes)

1. Inventory every read/write/reference of `shared_team`, `shared_kpi_targets`, `checklist_*`, `leads_*`, and `kpi_*` across HTML, scripts, tests, and docs.
2. Identify any remaining UI paths that call legacy team/KPI functions.
3. Map current Supabase tables, columns, policies, grants, foreign keys, and report writers. Use metadata and source inspection only.
4. Add browser tests for local-only checklist behavior and JSON backup round-trip before changing implementation.

### Step 2 — define cloud checklist persistence

- Prefer a narrowly scoped, authenticated per-user record with a stable user ID, checklist schema/version, boolean item values, and updated timestamp.
- Choose the table and policy design only after reviewing existing schema and RLS conventions. Do not use username as the durable foreign key; usernames can change.
- Confirm the manager and salesperson access model. Default should be own-record access; manager-wide access is not needed unless an explicit business requirement exists.
- Add a fallback/error state so a network or policy error is never reported as a successful cloud save.
- Preserve current localStorage values until the cloud write has succeeded and the user has a recoverable export. Avoid silent overwrites when cloud and local values differ.

### Step 3 — dual-read, guarded migration, and compatibility

1. On load, read cloud state first when available; detect local-only state separately.
2. If local state exists and cloud state does not, offer a clear one-time import/merge path. Never silently replace either copy.
3. Validate checklist length and boolean values; version the payload for future checklist changes.
4. After verified cloud persistence, keep the local copy as a temporary fallback for at least one release. Do not clear localStorage automatically.
5. Retain JSON backup version 1 import/export compatibility. If backup format needs to expand, add a versioned migration and tests rather than changing the existing key contract.

### Step 4 — tests and release gates

- Salesperson A can save/reload their own checklist on the same browser and a second browser.
- Salesperson A cannot read or overwrite salesperson B's checklist through API calls.
- Manager access matches the explicitly approved policy; do not infer blanket access from the role.
- Offline/network failure shows an error and does not claim a cloud save.
- Legacy local checklist is imported once without deleting the original; repeated import is idempotent.
- Old JSON backups import, export, and restore the same legacy keys.
- Excel/CSV lead import/export, lead ownership, team administration, KPI definitions, reports, and login remain unaffected.
- Tests run with isolated synthetic accounts and data. Mocked browser tests are not live E2E proof.

## Blocking conditions and safety

- This work can be developed and tested in a branch, but production schema/RLS changes must wait until an encrypted logical backup exists outside GitHub and a restore rehearsal succeeds in a separate disposable environment.
- No production SQL, RLS, grants, Auth settings, or Edge Functions are changed by this plan.
- No localStorage keys, database columns, Excel headers, backup identifiers, or existing data may be removed or renamed without a tested migration and rollback.
- Never put production data, backup files, credentials, or service-role keys in GitHub or chat.

## Next exact action

Complete the call-site/dependency inventory and add focused tests before proposing a reversible checklist persistence implementation. Keep the backup/restore gate in force for any production schema/policy change.
