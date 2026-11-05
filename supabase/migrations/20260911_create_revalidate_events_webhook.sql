-- Create revalidation webhook trigger on events table
-- Automatically invalidates Next.js ISR cache on INSERT, UPDATE, or DELETE

DROP TRIGGER IF EXISTS "revalidate_events" ON public.events;

CREATE TRIGGER "revalidate_events"
AFTER INSERT OR UPDATE OR DELETE ON public.events
FOR EACH ROW
EXECUTE FUNCTION supabase_functions.http_request(
  'https://eventime.thesurfboard.in/api/revalidate',
  'POST',
  '{"Content-Type": "application/json", "x-webhook-secret": "SET_IN_SUPABASE_DASHBOARD_NEVER_COMMIT"}',
  '{}',
  '5000'
);
