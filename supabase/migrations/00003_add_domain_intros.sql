-- Add domain_intros column to weekly_plans
ALTER TABLE weekly_plans 
ADD COLUMN IF NOT EXISTS domain_intros JSONB DEFAULT '{}'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN weekly_plans.domain_intros IS 'AI-generated intro text for each domain, keyed by domain name';
