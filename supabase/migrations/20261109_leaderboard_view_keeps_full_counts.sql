-- Migration: 20261109_leaderboard_view_keeps_full_counts.sql
-- Purpose: leaderboard_view runs with the reader's access, so the 20261108 lock hid other people's
-- saves from its impact_saves total and scores dropped. Running it with the owner's access restores
-- them. Safe because the view only returns public profile fields and totals, not who saved what.

ALTER VIEW public.leaderboard_view SET (security_invoker = false);

-- Read-only check: lists any other view or function that reads the locked tables.
SELECT 'view' AS kind, viewname AS name, NULL::boolean AS runs_as_owner
FROM pg_views
WHERE schemaname = 'public'
  AND definition ~ '(saved_events|interested_events|registered_events)'
UNION ALL
SELECT 'function', p.proname, p.prosecdef
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.prosrc ~ '(saved_events|interested_events|registered_events)';

-- UNDO:
-- ALTER VIEW public.leaderboard_view SET (security_invoker = true);
