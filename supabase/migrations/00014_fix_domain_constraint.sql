-- Fix: Ensure domain constraint uses new names (frame, recovery instead of muscle, sleep)
-- This is a repair migration in case 00004 wasn't fully applied

-- FIRST: Drop the old constraint so we can update data
ALTER TABLE plan_items 
  DROP CONSTRAINT IF EXISTS plan_items_domain_check;

-- THEN: Update any existing data with old domain names
UPDATE plan_items SET domain = 'frame' WHERE domain = 'muscle';
UPDATE plan_items SET domain = 'recovery' WHERE domain = 'sleep';

-- FINALLY: Add the new constraint with correct values
ALTER TABLE plan_items 
  ADD CONSTRAINT plan_items_domain_check 
    CHECK (domain IN ('heart', 'frame', 'recovery', 'metabolism', 'mind'));
