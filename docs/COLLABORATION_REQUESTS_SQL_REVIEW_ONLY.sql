-- REVIEW ONLY. DO NOT APPLY TO PRODUCTION WITHOUT VERIFIED BACKUP, RLS REVIEW AND EXPLICIT APPROVAL.
-- This is a schema proposal, NOT an applied migration.
create table public.collaboration_requests (
 id uuid primary key default gen_random_uuid(),
 owner_auth_id uuid not null references auth.users(id),
 external_id text not null check(length(trim(external_id))>0),
 phone text not null default '', company text not null default '', province text not null default '',
 monthly_shipments text not null default '', sales_category text not null default '',
 registered_at_text text not null default '', expert_name text not null default '',
 call_result text not null default '', sales_stage text not null default '',
 priority text not null default '', call_count integer not null default 0 check(call_count>=0),
 last_contact_text text not null default '', next_followup_text text not null default '',
 next_action text not null default '', notes text not null default '',
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(owner_auth_id,external_id)
);
create index collaboration_requests_owner_idx on public.collaboration_requests(owner_auth_id);
alter table public.collaboration_requests enable row level security;
-- Confirm is_crm_manager() behavior and permissions before applying.
create policy collaboration_read on public.collaboration_requests for select to authenticated
 using(owner_auth_id=(select auth.uid()) or public.is_crm_manager());
create policy collaboration_add on public.collaboration_requests for insert to authenticated
 with check(owner_auth_id=(select auth.uid()));
create policy collaboration_edit on public.collaboration_requests for update to authenticated
 using(owner_auth_id=(select auth.uid()) or public.is_crm_manager())
 with check(owner_auth_id=(select auth.uid()) or public.is_crm_manager());
create function public.collaboration_owner_immutable() returns trigger language plpgsql set search_path='' as $$
begin
 if new.owner_auth_id is distinct from old.owner_auth_id then
 raise exception 'owner_auth_id cannot be changed';
 end if;
 return new;
end; $$;
revoke all on function public.collaboration_owner_immutable() from public, anon, authenticated;
create trigger collaboration_owner_immutable before update on public.collaboration_requests
 for each row execute function public.collaboration_owner_immutable();
grant select,insert,update on public.collaboration_requests to authenticated;
