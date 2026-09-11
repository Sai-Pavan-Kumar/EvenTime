-- Create revalidation webhook trigger on events table
-- Automatically invalidates Next.js ISR cache on INSERT, UPDATE, or DELETE

DROP TRIGGER IF EXISTS "revalidate_events" ON public.events;

CREATE TRIGGER "revalidate_events"
AFTER INSERT OR UPDATE OR DELETE ON public.events
FOR EACH ROW
EXECUTE FUNCTION supabase_functions.http_request(
  'https://eventime.thesurfboard.in/api/revalidate',
  'POST',
  '{"Content-Type": "application/json", "x-webhook-secret": "et_whsec_f8a92b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a"}',
  '{}',
  '5000'
);
