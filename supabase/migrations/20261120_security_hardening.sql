-- Migration: 20261120_security_hardening.sql
-- Purpose: closes the holes found in the November security audit. Each was proven against the live
-- database inside a rolled-back transaction before this was written.
--   1. Phishing hosts such as "lu.ma.evil.com" passed the trusted-domain check and went live unreviewed.
--   2. A creator could swap an approved event's link through the API and keep it approved.
--   3. Any user could set user_type = 'admin' on their own row and then manage every abuse report.
--   4. A user could file a report already marked "resolved", which blocks the curator penalty forever.
--   5. Visitors could call cleanup and rate-limit functions directly.
--   6. Webhook triggers held the service_role key and webhook secrets in plain text.
--
-- Needs the Vault secrets 'notify_admin_webhook_secret' and 'revalidate_webhook_secret'. They are
-- created by hand, never in a migration: this repository is public.

BEGIN;

-- 1. One trusted-link rule, the same one src/lib/constants/verifiedDomains.ts applies in the app.
-- A plain entry must equal the host or be its parent domain; an entry with a path must match on a
-- path boundary. A bare prefix test let "lu.ma.attacker.com" through as if it were lu.ma.
CREATE OR REPLACE FUNCTION public.is_trusted_event_link(link text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  clean_link text := lower(trim(link));
  link_host text;
  host_and_path text;
BEGIN
  -- "user@host" links are refused outright: "https://lu.ma@evil.com" really opens evil.com.
  IF clean_link IS NULL OR clean_link !~ '^https?://' OR clean_link ~ '^https?://[^/?#]*@' THEN
    RETURN false;
  END IF;

  -- Stops at ":" so a port never becomes part of the host.
  link_host := regexp_replace(substring(clean_link from '^https?://([^/?#:]+)'), '^www\.', '');
  IF link_host IS NULL OR link_host = '' THEN
    RETURN false;
  END IF;
  host_and_path := link_host || coalesce(substring(clean_link from '^https?://[^/?#]+(/[^?#]*)'), '');

  RETURN EXISTS (
    SELECT 1
    FROM (SELECT rtrim(lower(trim(domain_name)), '/') AS entry FROM public.verified_domains) d
    WHERE d.entry <> ''
      AND CASE
        WHEN position('/' in d.entry) > 0 THEN
          host_and_path = d.entry OR starts_with(host_and_path, d.entry || '/')
        ELSE
          link_host = d.entry OR right(link_host, length(d.entry) + 1) = '.' || d.entry
      END
  );
END;
$$;

-- 2. Same moderation rules as before, plus: an approved event whose link changes to an untrusted one
-- goes back to review. The app already does this, but a direct API call skipped the app.
CREATE OR REPLACE FUNCTION public.prevent_self_status_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin boolean;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN new;
  END IF;

  SELECT (role = 'admin') INTO is_admin FROM public.profiles WHERE id = auth.uid();
  IF coalesce(is_admin, false) THEN
    RETURN new;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NOT public.is_trusted_event_link(new.registration_link) THEN
      new.status := 'pending';
    END IF;
    new.is_featured := false;
    new.admin_notes := null;
    new.approved_at := CASE WHEN new.status = 'approved' THEN now() ELSE null END;
  ELSIF TG_OP = 'UPDATE' THEN
    new.status := old.status;
    new.is_featured := old.is_featured;
    new.admin_notes := old.admin_notes;
    new.approved_at := old.approved_at;

    IF old.status = 'approved'
       AND (new.registration_link, new.website, new.external_link)
           IS DISTINCT FROM (old.registration_link, old.website, old.external_link)
       AND NOT public.is_trusted_event_link(new.registration_link) THEN
      new.status := 'pending';
      new.approved_at := null;
    END IF;
  END IF;

  RETURN new;
END;
$$;

-- Event pages send visitors to these links, so only web addresses may be stored. Existing rows all pass.
ALTER TABLE public.events
  ADD CONSTRAINT events_links_are_web_urls CHECK (
    (registration_link IS NULL OR registration_link = '' OR registration_link ~* '^https?://')
    AND (website IS NULL OR website = '' OR website ~* '^https?://')
    AND (external_link IS NULL OR external_link = '' OR external_link ~* '^https?://')
  );

-- 3. user_type is a self-described label ("student", "founder"), so users may edit it, but never to
-- 'admin'. Access decisions read role alone, which this trigger already locks.
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  was_admin boolean;
BEGIN
  -- Service-role (admin client) calls: auth.uid() is null, always allowed through.
  IF auth.uid() IS NULL THEN
    RETURN new;
  END IF;

  was_admin := coalesce(old.role = 'admin', false);

  IF NOT was_admin THEN
    new.role := old.role;
    new.et_score := old.et_score;
    new.elo_rating := old.elo_rating;
    new.penalty_points := old.penalty_points;
    new.last_approved_at := old.last_approved_at;
    new.deleted_at := old.deleted_at;
    new.id := old.id;
    IF lower(new.user_type) = 'admin' THEN
      new.user_type := old.user_type;
    END IF;
  END IF;

  RETURN new;
END;
$$;

DROP POLICY IF EXISTS "Admins can view and manage all reports" ON public.event_reports;
CREATE POLICY "Admins can view and manage all reports" ON public.event_reports
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- 4. Policies are OR-ed, so this loose one cancelled the strict "Users can submit event reports" rule.
-- The strict rule now also ties curator_id to the event's real creator, so nobody reports themselves.
DROP POLICY IF EXISTS "Users can insert reports" ON public.event_reports;
DROP POLICY IF EXISTS "Users can submit event reports" ON public.event_reports;
CREATE POLICY "Users can submit event reports" ON public.event_reports
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = reporter_id
    AND status = 'pending'
    AND curator_id IS NOT DISTINCT FROM (SELECT e.creator_id FROM public.events e WHERE e.id = event_id)
    AND (curator_id IS NULL OR reporter_id <> curator_id)
  );

-- 5. Cleanup jobs run from pg_cron as postgres, and rate limits are checked by the server with the
-- service key. Nobody on the public API needs these; the rate limiter let strangers lock out any IP.
REVOKE EXECUTE ON FUNCTION public.purge_old_deleted_users() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_old_trashed_events() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_rate_limits() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_and_increment_rate_limit(text, text, integer, integer) FROM PUBLIC, anon, authenticated;
-- Signed-in users delete their own account with this; a visitor has no account to delete.
REVOKE EXECUTE ON FUNCTION public.delete_user() FROM PUBLIC, anon;

-- 6. Webhooks read their secret from Vault when they fire, so no key sits in a trigger definition.
-- The payload keeps the shape Supabase's own webhooks send, which both receivers already parse.
CREATE OR REPLACE FUNCTION public.send_table_webhook()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  target_url text := TG_ARGV[0];
  webhook_secret text;
BEGIN
  SELECT decrypted_secret INTO webhook_secret FROM vault.decrypted_secrets WHERE name = TG_ARGV[1];

  PERFORM net.http_post(
    url := target_url,
    body := jsonb_build_object(
      'type', TG_OP,
      'table', TG_TABLE_NAME,
      'schema', TG_TABLE_SCHEMA,
      'record', CASE WHEN TG_OP = 'DELETE' THEN null ELSE to_jsonb(new) END,
      'old_record', CASE WHEN TG_OP = 'INSERT' THEN null ELSE to_jsonb(old) END
    ),
    params := '{}'::jsonb,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-webhook-secret', coalesce(webhook_secret, '')),
    timeout_milliseconds := 5000
  );
  RETURN null;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.send_table_webhook() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS "Admin_Notification" ON public.events;
CREATE TRIGGER "Admin_Notification"
  AFTER INSERT OR UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.send_table_webhook(
    'https://pgqcdygsbafladcczubn.supabase.co/functions/v1/notify-admin', 'notify_admin_webhook_secret');

-- Before this, the report webhook sent no secret, so every admin alert for a report was refused.
DROP TRIGGER IF EXISTS "Report_Notification" ON public.event_reports;
CREATE TRIGGER "Report_Notification"
  AFTER INSERT OR UPDATE ON public.event_reports
  FOR EACH ROW EXECUTE FUNCTION public.send_table_webhook(
    'https://pgqcdygsbafladcczubn.supabase.co/functions/v1/notify-admin', 'notify_admin_webhook_secret');

DROP TRIGGER IF EXISTS revalidate_events ON public.events;
CREATE TRIGGER revalidate_events
  AFTER INSERT OR UPDATE OR DELETE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.send_table_webhook(
    'https://eventime.thesurfboard.in/api/revalidate', 'revalidate_webhook_secret');

COMMIT;
