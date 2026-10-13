-- DRAFT ONLY: additive migration for review.
-- NOT APPLIED to Supabase. Test in a non-production project first.
-- This migration does not copy/delete CRM data or touch the legacy users.password column.

begin;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  display_name text not null,
  role text not null default 'sales' check (role in ('sales', 'manager')),
  must_change_password boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create or replace function public.is_crm_manager()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'manager'
  );
$$;

revoke all on function public.is_crm_manager() from public;
grant execute on function public.is_crm_manager() to authenticated;

drop policy if exists "profiles_select_self_or_manager" on public.profiles;
create policy "profiles_select_self_or_manager"
on public.profiles
for select
to authenticated
using (id = auth.uid() or public.is_crm_manager());

-- Role and username updates must be done only by trusted server-side provisioning.
revoke insert, update, delete on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;

alter table public.leads
  add column if not exists owner_auth_id uuid references auth.users(id);

-- Existing rows remain unassigned until an explicit, verified owner mapping is performed.
drop policy if exists "leads_select_owner_or_manager" on public.leads;
create policy "leads_select_owner_or_manager"
on public.leads
for select
to authenticated
using (owner_auth_id = auth.uid() or public.is_crm_manager());

drop policy if exists "leads_insert_owner_or_manager" on public.leads;
create policy "leads_insert_owner_or_manager"
on public.leads
for insert
to authenticated
with check (owner_auth_id = auth.uid() or public.is_crm_manager());

drop policy if exists "leads_update_owner_or_manager" on public.leads;
create policy "leads_update_owner_or_manager"
on public.leads
for update
to authenticated
using (owner_auth_id = auth.uid() or public.is_crm_manager())
with check (owner_auth_id = auth.uid() or public.is_crm_manager());

drop policy if exists "leads_delete_owner_or_manager" on public.leads;
create policy "leads_delete_owner_or_manager"
on public.leads
for delete
to authenticated
using (owner_auth_id = auth.uid() or public.is_crm_manager());

commit;
