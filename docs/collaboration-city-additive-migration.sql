-- Additive schema change for collaboration editor. Review and apply before enabling city persistence.
-- Existing rows and original province / date text remain unchanged.
ALTER TABLE public.collaboration_requests ADD COLUMN IF NOT EXISTS city text;
COMMENT ON COLUMN public.collaboration_requests.city IS 'Optional city selected within province; preserve legacy values as free text';
-- Date fields remain text intentionally: historical date-only entries have unknown hours,
-- and next_followup_text contains non-date workflow notes. Never mass-convert them.
-- Existing record_collaboration_followup RPC already increments call_count once for calls.
