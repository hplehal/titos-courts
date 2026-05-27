-- Migration: match_court_nullable (2026-05-23)
-- Make Match.courtNumber nullable so playoff shells can be created with
-- 'TBD' courts (W11 SF2 + Final use extra bookings that aren't always
-- confirmed at generation time). Regular-season seeders still always
-- assign a court at insert time.
-- Idempotent.

ALTER TABLE "Match" ALTER COLUMN "courtNumber" DROP NOT NULL;
