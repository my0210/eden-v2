-- Migration: Rename domains muscle -> frame, sleep -> recovery
-- ============================================================

-- Update existing plan_items data
UPDATE plan_items SET domain = 'frame' WHERE domain = 'muscle';
UPDATE plan_items SET domain = 'recovery' WHERE domain = 'sleep';

-- Update the check constraint on plan_items.domain
ALTER TABLE plan_items 
  DROP CONSTRAINT IF EXISTS plan_items_domain_check;

ALTER TABLE plan_items 
  ADD CONSTRAINT plan_items_domain_check 
    CHECK (domain IN ('heart', 'frame', 'recovery', 'metabolism', 'mind'));
