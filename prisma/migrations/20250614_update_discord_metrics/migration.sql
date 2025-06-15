-- Remove unused columns
ALTER TABLE "discord_metrics" 
DROP COLUMN IF EXISTS "ai_interactions",
DROP COLUMN IF EXISTS "point_transactions";

-- Add new columns for message tracking
ALTER TABLE "discord_metrics" 
ADD COLUMN IF NOT EXISTS "daily_user_messages" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "daily_staff_messages" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "channel_message_stats" JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS "staff_channel_stats" JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS "role_counts" JSONB DEFAULT '{}';