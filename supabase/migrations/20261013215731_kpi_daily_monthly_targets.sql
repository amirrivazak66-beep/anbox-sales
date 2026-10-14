alter table public.crm_kpi_definitions
  add column if not exists target_daily integer,
  add column if not exists target_monthly integer;

update public.crm_kpi_definitions
set target_daily = coalesce(target_daily, target, 0),
    target_monthly = coalesce(target_monthly, coalesce(target, 0) * 22)
where target_daily is null or target_monthly is null;

alter table public.crm_kpi_definitions
  alter column target_daily set default 0,
  alter column target_monthly set default 0;

comment on column public.crm_kpi_definitions.target_daily is
  'Daily target for this KPI and salesperson.';
comment on column public.crm_kpi_definitions.target_monthly is
  'Monthly target for this KPI and salesperson.';
