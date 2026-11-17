# Collaboration editor — staged implementation, NOT approved for production

Status: draft branch only. No production database writes, migrations, or main merges authorized.

## Implemented in branch
- Six controlled select fields, preserving exact approved labels including «ساخت پنل» and «عدم همکاری» (without dash).
- «سایر / ورود مقدار دلخواه» for every controlled field and province; existing unmatched values are shown without silent conversion.
- Province list (31 provinces) in editor.
- Historical call count displayed read-only and excluded from generic UPDATE. Existing record_collaboration_followup RPC remains responsible for new calls.

## Blocked pending schema approval
- Province-dependent city selection requires a new city column plus an authoritative province/city dataset. Do not save city into province or notes.
- Last-contact and next-followup datetime need timestamptz columns, audited Jalali-to-Gregorian conversion, and timezone policy (Asia/Tehran); existing text fields remain untouched until approval.
- Historical call count baseline requires checking current RPC and trigger behavior, and backfilling baseline with a per-request cutoff to prevent double-counting.
- Six fields' historical normalization requires reviewed mapping and a backup, not automatic fuzzy replacements.

## Read-only audit of live data (2026-11-17)
- 312 requests, 312 nonempty provinces.
- 268 nonempty last-contact dates and 268 next-followup dates.
- 267 requests with positive call_count, but only 7 followup interaction_type='call' rows.
- Distinct legacy values: call_result 75, next_action 24, priority 13, sales_category 8, monthly_shipments 6, sales_stage 9, province 30.
- Example safe normalization candidates (dry-run ONLY):
  - call_result: «پاسخگو نبود», «پاسخگو نبودند», «پاسخگو نیست» -> «پاسخ نداد»
  - call_result: «شماره اشتباه است» -> «شماره اشتباه»
  - next_action: «تماس ثانویه», «تماس  ثانویه» -> «تماس مجدد»
  - sales_stage: «عدم همکاری-» -> «عدم همکاری»
- DO NOT auto-map descriptive entries such as «سفیر», names, detailed call notes, or «ارجاع به منابع انسانی» to unrelated options. Keep original text and request review.
- For review generate a per-field CSV with original, candidate, count, confidence, and decision; no UPDATE until approval.

## Release gates
1. Review candidate mappings, unrecognized values, city source, timestamp policy, baseline cutoff.
2. Approve additive DB migration separately; verify RLS and rollback.
3. Complete UI (city + Jalali datetime), migration dry-run, tests, CI.
4. Approve merge/deployment separately. No live records modified in this branch.
