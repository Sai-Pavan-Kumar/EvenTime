-- Migration: 20261119_unified_et_score.sql
-- Purpose: one ET Score, worked out live from real data, matching the "How ET Score works" modal:
--   100 base + 50 once the profile is complete + 20 per approved event
--   + 10 per unique person who saved or marked interest on an approved event − penalty_points.
--
-- Before this, the score lived in two places that never agreed: profiles.et_score (bumped by six
-- separate code paths) and leaderboard_view (+50 per event of ANY status, +5 per save, +25 for
-- college and branch). Nothing adds points anymore; the view recomputes, so it cannot drift.
-- The only stored input is penalty_points, written by the server when 5+ trusted reports confirm spam.

BEGIN;

-- 1. The single formula. Every profile gets a row, so a score exists before the first event too.
DROP VIEW IF EXISTS public.leaderboard_view;

CREATE VIEW public.leaderboard_view AS
WITH approved AS (
  SELECT id, creator_id FROM public.events WHERE status = 'approved'
),
event_counts AS (
  SELECT creator_id, count(*) AS events_posted FROM approved GROUP BY creator_id
),
-- A person who both saved and marked interest counts once, and a creator's own clicks never count.
supporters AS (
  SELECT DISTINCT a.creator_id, a.id AS event_id, x.user_id
  FROM approved a
  JOIN (
    SELECT event_id, user_id FROM public.saved_events
    UNION
    SELECT event_id, user_id FROM public.interested_events
  ) x ON x.event_id = a.id
  WHERE x.user_id <> a.creator_id
),
support_counts AS (
  SELECT creator_id, count(*) AS impact_saves FROM supporters GROUP BY creator_id
)
SELECT
  p.id AS user_id,
  p.full_name,
  p.username,
  p.avatar_url,
  p.college,
  p.branch,
  (100 + CASE WHEN p.is_onboarded THEN 50 ELSE 0 END)::integer AS base_score,
  coalesce(e.events_posted, 0)::integer AS events_posted,
  coalesce(s.impact_saves, 0)::integer AS impact_saves,
  greatest(
    0,
    100
    + CASE WHEN p.is_onboarded THEN 50 ELSE 0 END
    + 20 * coalesce(e.events_posted, 0)
    + 10 * coalesce(s.impact_saves, 0)
    - coalesce(p.penalty_points, 0)
  )::integer AS et_score
FROM public.profiles p
LEFT JOIN event_counts e ON e.creator_id = p.id
LEFT JOIN support_counts s ON s.creator_id = p.id
WHERE p.deleted_at IS NULL;

-- Runs as owner so it can count other people's saves (see 20261109); it only exposes totals.
ALTER VIEW public.leaderboard_view SET (security_invoker = false);
GRANT SELECT ON public.leaderboard_view TO anon, authenticated, service_role;

-- 2. A confirmed spam penalty becomes the one stored input the view subtracts.
CREATE OR REPLACE FUNCTION public.apply_leaderboard_penalty(p_user_id uuid, p_amount integer)
RETURNS void
LANGUAGE sql
SET search_path = public
AS $$
  UPDATE public.profiles
  SET penalty_points = coalesce(penalty_points, 0) + greatest(p_amount, 0)
  WHERE id = p_user_id;
$$;

-- 3. Nobody outside the server may touch scores. The old add-points functions stay for rollback
--    but can no longer be called from the browser.
REVOKE EXECUTE ON FUNCTION public.apply_leaderboard_penalty(uuid, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_et_score(uuid, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.award_event_approval_score(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.apply_et_score_decay() FROM PUBLIC, anon, authenticated;
-- Direct writes to profiles.et_score / penalty_points from a signed-in user are already reset by
-- trg_prevent_profile_privilege_escalation, so no column grant change is needed here.

-- 4. The admin user search shows the same score as everywhere else.
CREATE OR REPLACE FUNCTION public.admin_search_users(search_text text DEFAULT NULL)
RETURNS TABLE (
  id uuid, full_name text, username text, email text, role text,
  et_score integer, avatar_url text, updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.full_name::text, p.username::text, p.email::text, p.role::text,
         coalesce(lv.et_score, 100)::integer, p.avatar_url::text, p.updated_at::timestamptz
  FROM public.profiles p
  LEFT JOIN public.leaderboard_view lv ON lv.user_id = p.id
  WHERE EXISTS (SELECT 1 FROM public.profiles me WHERE me.id = auth.uid() AND me.role = 'admin')
    AND (
      coalesce(trim(search_text), '') = ''
      OR p.full_name ILIKE '%' || trim(search_text) || '%'
      OR p.email ILIKE '%' || trim(search_text) || '%'
      OR p.username ILIKE '%' || trim(search_text) || '%'
    )
  ORDER BY p.updated_at DESC NULLS LAST
  LIMIT 50;
$$;

-- 5. Admin and test accounts that must never rank.
CREATE OR REPLACE FUNCTION public.leaderboard_excluded_ids()
RETURNS uuid[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(array_agg(id), '{}') FROM public.profiles
  WHERE lower(email) IN ('p.pavansiri@gmail.com', 'eventime.admin@gmail.com')
     OR username IN ('eventime', 'testdelete', 'eventime.admin', 'eventimeadmin', 'admin');
$$;

-- 6. One-time sync so the retired column doesn't show a stale number in raw table views.
--    The app no longer reads it; leaderboard_view is the only source.
UPDATE public.profiles p
SET et_score = lv.et_score
FROM public.leaderboard_view lv
WHERE lv.user_id = p.id AND p.et_score IS DISTINCT FROM lv.et_score;

COMMIT;

NOTIFY pgrst, 'reload schema';

-- Check after running: hp1 should be 170 (100 + 50 profile + 20 for one approved event).
-- SELECT username, base_score, events_posted, impact_saves, et_score
-- FROM public.leaderboard_view ORDER BY et_score DESC LIMIT 15;
