-- Migration: 20261108_lock_event_activity_tables.sql
-- Purpose: anyone holding the public key could list who saved, liked or registered for which
-- event, and match those ids to full names. After this, people read only their own rows.
--
-- DO NOT RUN until the code using the count functions from 20261107 is live, or counts show 0.

BEGIN;

DO $$
DECLARE
  rule record;
BEGIN
  FOR rule IN
    SELECT tablename, policyname FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('saved_events', 'interested_events', 'registered_events')
      AND cmd = 'SELECT'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.%I', rule.policyname, rule.tablename);
  END LOOP;

  -- A catch-all rule would keep the tables open while looking locked, so stop and roll back.
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('saved_events', 'interested_events', 'registered_events')
      AND cmd = 'ALL'
      AND (qual IS NULL OR qual = 'true')
  ) THEN
    RAISE EXCEPTION 'An open FOR ALL policy still exposes these tables. Nothing was changed.';
  END IF;
END $$;

CREATE POLICY "Users read their own saves" ON public.saved_events
  FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users read their own interests" ON public.interested_events
  FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users read their own registrations" ON public.registered_events
  FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);

COMMIT;

-- UNDO (reopens the leak, so use it only if something breaks):
-- DROP POLICY "Users read their own saves" ON public.saved_events;
-- DROP POLICY "Users read their own interests" ON public.interested_events;
-- DROP POLICY "Users read their own registrations" ON public.registered_events;
-- CREATE POLICY "Allow read for saved events" ON public.saved_events FOR SELECT USING (true);
-- CREATE POLICY "Allow read for interested events" ON public.interested_events FOR SELECT USING (true);
-- CREATE POLICY "Allow read for registered events" ON public.registered_events FOR SELECT USING (true);
