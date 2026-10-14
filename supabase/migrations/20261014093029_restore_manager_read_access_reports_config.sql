DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='reports' AND policyname='reports_manager_select') THEN
    CREATE POLICY reports_manager_select ON public.reports
      FOR SELECT TO authenticated USING (public.is_crm_manager());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='config' AND policyname='config_manager_select') THEN
    CREATE POLICY config_manager_select ON public.config
      FOR SELECT TO authenticated USING (public.is_crm_manager());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='kpi_targets' AND policyname='kpi_targets_owner_or_manager_select') THEN
    CREATE POLICY kpi_targets_owner_or_manager_select ON public.kpi_targets
      FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_crm_manager());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='daily_reports' AND policyname='daily_reports_owner_or_manager_select') THEN
    CREATE POLICY daily_reports_owner_or_manager_select ON public.daily_reports
      FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_crm_manager());
  END IF;
END $$;
