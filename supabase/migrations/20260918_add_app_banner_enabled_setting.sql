-- Add app_banner_enabled toggle to app_settings
ALTER TABLE public.app_settings 
ADD COLUMN IF NOT EXISTS app_banner_enabled boolean DEFAULT false;
