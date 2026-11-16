-- Phase 2: operational follow-up history and due-date workflow
create table if not exists public.collaboration_request_followups (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.collaboration_requests(id) on delete cascade,
  actor_auth_id uuid not null default auth.uid() references auth.users(id),
  interaction_type text not null check (interaction_type in ('call','note')),
  call_result text not null default '',
  notes text not null default '',
  next_action text not null default '',
  due_at timestamptz,
  completed_at timestamptz,
  completed_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index if not exists collaboration_followups_request_created_idx on public.collaboration_request_followups(request_id,created_at desc);
create index if not exists collaboration_followups_due_open_idx on public.collaboration_request_followups(due_at) where due_at is not null and completed_at is null;
create index if not exists collaboration_followups_actor_created_idx on public.collaboration_request_followups(actor_auth_id,created_at desc);
alter table public.collaboration_request_followups enable row level security;
grant select,insert,update on public.collaboration_request_followups to authenticated;
create policy collaboration_followups_select on public.collaboration_request_followups for select to authenticated using ((select public.is_crm_manager()) or exists(select 1 from public.collaboration_requests r where r.id=collaboration_request_followups.request_id and r.owner_auth_id=(select auth.uid())));
create policy collaboration_followups_insert on public.collaboration_request_followups for insert to authenticated with check (actor_auth_id=(select auth.uid()) and ((select public.is_crm_manager()) or exists(select 1 from public.collaboration_requests r where r.id=collaboration_request_followups.request_id and r.owner_auth_id=(select auth.uid()))));
create policy collaboration_followups_update on public.collaboration_request_followups for update to authenticated using ((select public.is_crm_manager()) or exists(select 1 from public.collaboration_requests r where r.id=collaboration_request_followups.request_id and r.owner_auth_id=(select auth.uid()))) with check ((select public.is_crm_manager()) or exists(select 1 from public.collaboration_requests r where r.id=collaboration_request_followups.request_id and r.owner_auth_id=(select auth.uid())));
create or replace function public.guard_collaboration_followup_completion() returns trigger language plpgsql set search_path='' as $$
begin
 if (to_jsonb(new)-'completed_at'-'completed_by') is distinct from (to_jsonb(old)-'completed_at'-'completed_by') then raise exception 'Follow-up history is immutable; only completion fields may change'; end if;
 if old.completed_at is not null then raise exception 'Follow-up is already completed'; end if;
 if new.completed_at is null or new.completed_by is distinct from (select auth.uid()) then raise exception 'Invalid follow-up completion'; end if;
 return new;
end; $$;
create trigger collaboration_followups_completion_guard before update on public.collaboration_request_followups for each row execute function public.guard_collaboration_followup_completion();
create or replace function public.record_collaboration_followup(p_request_id uuid,p_interaction_type text,p_call_result text default '',p_notes text default '',p_next_action text default '',p_due_at timestamptz default null) returns uuid language plpgsql set search_path='' as $$
declare v_id uuid; v_actor uuid := (select auth.uid());
begin
 if v_actor is null then raise exception 'Authentication required'; end if;
 if p_interaction_type not in ('call','note') then raise exception 'Invalid interaction type'; end if;
 if not coalesce((select public.is_crm_manager()),false) and not exists(select 1 from public.collaboration_requests r where r.id=p_request_id and r.owner_auth_id=v_actor) then raise exception 'Not authorized to record follow-up for this request'; end if;
 insert into public.collaboration_request_followups(request_id,actor_auth_id,interaction_type,call_result,notes,next_action,due_at)
 values(p_request_id,v_actor,p_interaction_type,coalesce(p_call_result,''),coalesce(p_notes,''),coalesce(p_next_action,''),p_due_at) returning id into v_id;
 update public.collaboration_requests set call_count=case when p_interaction_type='call' then call_count+1 else call_count end,call_result=case when p_interaction_type='call' then coalesce(p_call_result,'') else call_result end,last_contact_text=case when p_interaction_type='call' then to_char(now() at time zone 'Asia/Tehran','YYYY/MM/DD HH24:MI') else last_contact_text end,next_followup_text=case when p_due_at is null then '' else to_char(p_due_at at time zone 'Asia/Tehran','YYYY/MM/DD HH24:MI') end,next_action=coalesce(p_next_action,''),updated_at=now() where id=p_request_id;
 if not found then raise exception 'Request not found or not accessible'; end if;
 return v_id;
end; $$;
create or replace function public.complete_collaboration_followup(p_followup_id uuid) returns boolean language plpgsql set search_path='' as $$
declare v_request_id uuid; v_actor uuid := (select auth.uid());
begin
 if v_actor is null then raise exception 'Authentication required'; end if;
 select request_id into v_request_id from public.collaboration_request_followups where id=p_followup_id;
 if v_request_id is null then raise exception 'Follow-up not found or not accessible'; end if;
 if not coalesce((select public.is_crm_manager()),false) and not exists(select 1 from public.collaboration_requests r where r.id=v_request_id and r.owner_auth_id=v_actor) then raise exception 'Not authorized to complete this follow-up'; end if;
 update public.collaboration_request_followups set completed_at=now(),completed_by=v_actor where id=p_followup_id and completed_at is null;
 return found;
end; $$;
grant execute on function public.record_collaboration_followup(uuid,text,text,text,text,timestamptz) to authenticated;
grant execute on function public.complete_collaboration_followup(uuid) to authenticated;
