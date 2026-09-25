-- Migration: Create registered_events table with zero-bloat schema, strict RLS and performance indexes

CREATE TABLE IF NOT EXISTS public.registered_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'pending', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure a user can only register once per event
CREATE UNIQUE INDEX IF NOT EXISTS idx_registered_events_user_event 
ON public.registered_events (user_id, event_id);

-- Performance Indexes for 1ms queries
CREATE INDEX IF NOT EXISTS idx_registered_events_user_id 
ON public.registered_events (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_registered_events_event_id 
ON public.registered_events (event_id);

-- Enable Row Level Security
ALTER TABLE public.registered_events ENABLE ROW LEVEL SECURITY;

-- 1. Read Policy: Allow reading so event cards & curator aggregations work (exact same pattern as saved_events & interested_events)
CREATE POLICY "Allow read for registered events"
ON public.registered_events
FOR SELECT
USING (true);

-- 2. Insert Policy: Users can only create registrations for themselves
CREATE POLICY "Users can register for themselves"
ON public.registered_events
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 3. Delete Policy: Users can unmark / cancel their own registration
CREATE POLICY "Users can delete their own registration"
ON public.registered_events
FOR DELETE
USING (auth.uid() = user_id);
