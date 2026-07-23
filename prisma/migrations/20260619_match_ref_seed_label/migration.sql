-- Migration: match_ref_seed_label (2026-06-19)
-- Adds a placeholder label for a match's referee before the real team is
-- known (playoff ref rotation: "loser refs the next game on this court").
-- Shown on SF/Final cards until the feeding match finalizes and the ref
-- rotation fills refTeamId. Additive + idempotent.

ALTER TABLE "Match" ADD COLUMN IF NOT EXISTS "refSeedLabel" TEXT;
