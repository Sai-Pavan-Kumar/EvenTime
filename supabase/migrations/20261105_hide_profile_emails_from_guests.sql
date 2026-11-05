-- Migration: 20261105_hide_profile_emails_from_guests.sql
-- Purpose: anyone holding the public key could read every email and push token from
-- /rest/v1/profiles without logging in. This closes that for logged-out callers now.
--
-- Logged-in callers keep full access on purpose: older app versions run select('*') on their
-- own profile, which column grants would break. 20261103_hide_private_profile_columns.sql
-- finishes the job after the mobile release.
--
-- The activity tables are left alone: the event page joins interested_events to profiles as a
-- guest, and that join needs interested_events.user_id.

REVOKE SELECT ON public.profiles FROM anon;
GRANT SELECT (
  id, full_name, avatar_url, updated_at, college, graduation_year, goals, is_onboarded,
  elo_rating, role, username, college_id, et_score, preferred_cities, user_type,
  last_approved_at, deleted_at, branch, penalty_points, notification_preferences
) ON public.profiles TO anon;

NOTIFY pgrst, 'reload schema';
