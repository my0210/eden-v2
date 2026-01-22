-- Simplify Protocol Schema
-- Removes complex Health OS fields (phases, active_protocols, weekly_rhythm)
-- Adds recommended_activities as the core concept

-- Add recommended_activities column if it doesn't exist
ALTER TABLE protocols 
ADD COLUMN IF NOT EXISTS recommended_activities JSONB DEFAULT '[]'::jsonb;

-- Add comment explaining the column
COMMENT ON COLUMN protocols.recommended_activities IS 'Array of recommended activities with weekly targets and personalization';

-- Drop planned_activities table (we're using activity_logs directly)
DROP TABLE IF EXISTS planned_activities CASCADE;

-- Simplify activity_logs table to match new schema
-- First, add value and unit columns if they don't exist
ALTER TABLE activity_logs
ADD COLUMN IF NOT EXISTS value NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT 'min';

-- Drop the old data column if it exists (we're simplifying to value/unit)
-- Note: This will lose existing flexible data, so commenting out for safety
-- If you want to migrate data from 'data' column to 'value', do it manually first
-- ALTER TABLE activity_logs DROP COLUMN IF EXISTS data;
-- ALTER TABLE activity_logs DROP COLUMN IF EXISTS planned_activity_id;

-- Create index on activity_logs for efficient querying
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_date 
ON activity_logs(user_id, date);

CREATE INDEX IF NOT EXISTS idx_activity_logs_domain 
ON activity_logs(domain);

-- Update RLS policy for activity_logs if needed
DROP POLICY IF EXISTS "Users can view their own activity logs" ON activity_logs;
DROP POLICY IF EXISTS "Users can insert their own activity logs" ON activity_logs;

CREATE POLICY "Users can view their own activity logs"
ON activity_logs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activity logs"
ON activity_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own activity logs"
ON activity_logs FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own activity logs"
ON activity_logs FOR DELETE
USING (auth.uid() = user_id);
