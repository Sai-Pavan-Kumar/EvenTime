-- Migration: 20261110_limit_profile_cities_to_list.sql
-- Purpose: onboarding writes preferred_cities straight from the browser, so the server action check
-- does not cover it. Unknown cities are dropped instead of rejected: a hard CHECK would also fail
-- unrelated saves (username, college) for any profile that already holds an old city name.
--
-- Keep this list in sync with src/lib/constants/cities.ts.

BEGIN;

CREATE OR REPLACE FUNCTION public.keep_known_preferred_cities()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.preferred_cities IS NOT NULL THEN
    NEW.preferred_cities := ARRAY(
      SELECT city FROM unnest(NEW.preferred_cities) WITH ORDINALITY AS picked(city, position)
      WHERE city = ANY (ARRAY[
        'Ahmedabad','Anantapur','Bengaluru','Bhopal','Bhubaneswar','Chandigarh','Chennai','Coimbatore',
        'Goa','Guntur','Gurugram','Hyderabad','Indore','Jaipur','Kakinada','Kanpur','Karimnagar',
        'Khammam','Kochi','Kolkata','Lucknow','Mangaluru','Mumbai','Mysuru','Nagpur','New Delhi',
        'Nizamabad','Noida','Patna','Pune','Surat','Thiruvananthapuram','Tirupati','Vijayawada',
        'Visakhapatnam','Warangal'
      ])
      -- Order matters: the first city is the user's home city on the leaderboard.
      ORDER BY position
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS keep_known_preferred_cities ON public.profiles;
CREATE TRIGGER keep_known_preferred_cities
  BEFORE INSERT OR UPDATE OF preferred_cities ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.keep_known_preferred_cities();

COMMIT;
