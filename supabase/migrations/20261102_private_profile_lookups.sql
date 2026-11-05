-- Migration: 20261102_private_profile_lookups.sql
-- Purpose: the few screens that genuinely need an email (admin console, leaderboard exclusions)
-- get it through these functions, so 20261103_hide_private_profile_columns.sql can take email
-- away from the public API without breaking them.
--
-- Safe to run right away: it only adds functions, nothing existing changes.
-- SECURITY DEFINER runs as the owner (bypasses column grants), so every function checks the
-- caller itself and pins search_path to stop object-shadowing tricks.

-- Admin and test accounts that must never rank. Kept here, not in app code, because filtering
-- by email from the client is exactly what the column grants will forbid.
CREATE OR REPLACE FUNCTION public.leaderboard_excluded_ids()
RETURNS uuid[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(array_agg(id), '{}') FROM public.profiles
  WHERE lower(email) IN ('p.pavansiri@gmail.com', 'eventime.admin@gmail.com')
     OR username IN ('eventime.admin', 'eventimeadmin', 'admin');
$$;

-- Emails for the admin feedback/report lists. Non-admins get an empty result, not an error,
-- so a curious caller learns nothing.
CREATE OR REPLACE FUNCTION public.admin_profile_emails(profile_ids uuid[])
RETURNS TABLE (id uuid, email text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.email::text
  FROM public.profiles p
  WHERE p.id = ANY (profile_ids)
    AND EXISTS (SELECT 1 FROM public.profiles me WHERE me.id = auth.uid() AND me.role = 'admin');
$$;

-- Admin user search by name, username or email. The search text is a bound parameter,
-- which also removes the PostgREST .or() filter injection the old client query had.
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
         p.et_score::integer, p.avatar_url::text, p.updated_at::timestamptz
  FROM public.profiles p
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

REVOKE EXECUTE ON FUNCTION public.admin_profile_emails(uuid[]) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_search_users(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_profile_emails(uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_search_users(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.leaderboard_excluded_ids() TO anon, authenticated;
