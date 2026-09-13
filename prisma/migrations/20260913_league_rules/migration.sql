-- Per-league game-night rules, editable on /admin/leagues.
--
-- Adds the rule columns and, on the first run only, copies the rules the code
-- used to derive from each league's slug so existing leagues behave exactly as
-- before:
--   slug contains sunday/mens → 3 rounds, 2 divisions, single slot,
--                               courts 7,6,8,9,10, 5 tiers, 9 PM – 12 AM
--   slug = sunday-mens        → head-to-head tiebreak
--   slug contains thursday    → 6:30 – 8:30 / 8:30 – 10:30 PM, courts 9,10, 4 tiers
-- Everything else keeps the Tuesday COED defaults.
--
-- Safe to re-run: once the columns exist the whole block is skipped, so admin
-- edits are never overwritten.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema() AND table_name = 'League' AND column_name = 'slotMode'
  ) THEN
    ALTER TABLE "League"
      ADD COLUMN "roundsPerWeek" INTEGER NOT NULL DEFAULT 2,
      ADD COLUMN "headToHead" BOOLEAN NOT NULL DEFAULT false,
      ADD COLUMN "divisionCount" INTEGER NOT NULL DEFAULT 4,
      ADD COLUMN "slotMode" TEXT NOT NULL DEFAULT 'two',
      ADD COLUMN "earlySlotLabel" TEXT NOT NULL DEFAULT '8 – 10 PM',
      ADD COLUMN "lateSlotLabel" TEXT NOT NULL DEFAULT '10 PM – 12 AM',
      ADD COLUMN "singleSlotLabel" TEXT NOT NULL DEFAULT '9 PM – 12 AM',
      ADD COLUMN "timeRangeLabel" TEXT NOT NULL DEFAULT '8 PM – 12 AM',
      ADD COLUMN "courts" INTEGER[] DEFAULT ARRAY[6, 8, 9, 10]::INTEGER[],
      ADD COLUMN "defaultTierCount" INTEGER NOT NULL DEFAULT 8;

    UPDATE "League" SET
      "roundsPerWeek" = 3,
      "divisionCount" = 2,
      "slotMode" = 'single',
      "earlySlotLabel" = '9 – 10:30 PM',
      "lateSlotLabel" = '10:30 PM – 12 AM',
      "timeRangeLabel" = '9 PM – 12 AM',
      "courts" = ARRAY[7, 6, 8, 9, 10],
      "defaultTierCount" = 5
    WHERE slug LIKE '%sunday%' OR slug LIKE '%mens%';

    UPDATE "League" SET "headToHead" = true WHERE slug = 'sunday-mens';

    UPDATE "League" SET
      "earlySlotLabel" = '6:30 – 8:30 PM',
      "lateSlotLabel" = '8:30 – 10:30 PM',
      "timeRangeLabel" = '6:30 – 10:30 PM',
      "courts" = ARRAY[9, 10],
      "defaultTierCount" = 4
    WHERE slug LIKE '%thursday%' AND NOT (slug LIKE '%sunday%' OR slug LIKE '%mens%');
  END IF;
END $$;
