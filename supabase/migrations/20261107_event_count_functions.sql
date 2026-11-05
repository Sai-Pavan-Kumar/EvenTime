-- Migration: 20261107_event_count_functions.sql
-- Purpose: pages need "how many", never "who". These return only a number, so the activity
-- tables can be locked to their owners (20261108) without event counts dropping to 0.
--
-- Run this BEFORE deploying the code that selects these fields: PostgREST rejects unknown fields.
-- SECURITY DEFINER is what lets a count include other people's rows after the lock.

CREATE OR REPLACE FUNCTION public.interested_count(public.events)
RETURNS bigint LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$ SELECT count(*) FROM public.interested_events WHERE event_id = $1.id $$;

CREATE OR REPLACE FUNCTION public.saved_count(public.events)
RETURNS bigint LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$ SELECT count(*) FROM public.saved_events WHERE event_id = $1.id $$;

CREATE OR REPLACE FUNCTION public.registered_count(public.events)
RETURNS bigint LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$ SELECT count(*) FROM public.registered_events WHERE event_id = $1.id $$;

GRANT EXECUTE ON FUNCTION public.interested_count(public.events) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.saved_count(public.events) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.registered_count(public.events) TO anon, authenticated;

-- The home page counts every event at once, so each count must not scan the whole table.
CREATE INDEX IF NOT EXISTS idx_interested_events_event_id ON public.interested_events (event_id);
CREATE INDEX IF NOT EXISTS idx_saved_events_event_id ON public.saved_events (event_id);

NOTIFY pgrst, 'reload schema';

-- UNDO (only while the old code is live, and only before 20261108 has run):
-- DROP FUNCTION public.interested_count(public.events);
-- DROP FUNCTION public.saved_count(public.events);
-- DROP FUNCTION public.registered_count(public.events);
-- NOTIFY pgrst, 'reload schema';
