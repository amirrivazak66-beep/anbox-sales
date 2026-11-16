revoke all on function public.record_collaboration_followup(uuid,text,text,text,text,timestamptz) from public, anon;
revoke all on function public.complete_collaboration_followup(uuid) from public, anon;
grant execute on function public.record_collaboration_followup(uuid,text,text,text,text,timestamptz) to authenticated;
grant execute on function public.complete_collaboration_followup(uuid) to authenticated;
create index if not exists collaboration_followups_completed_by_idx on public.collaboration_request_followups(completed_by) where completed_by is not null;
create index if not exists collaboration_followups_actor_idx on public.collaboration_request_followups(actor_auth_id);
