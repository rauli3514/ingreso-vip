-- Add venue coordinates to events
ALTER TABLE events ADD COLUMN IF NOT EXISTS venue_lat NUMERIC;
ALTER TABLE events ADD COLUMN IF NOT EXISTS venue_lng NUMERIC;

-- Add dress code images (array of URLs) to events
ALTER TABLE events ADD COLUMN IF NOT EXISTS dress_code_images TEXT[] DEFAULT '{}';

-- Add gift configuration (jsonb for flexibility: cards, bank details override)
ALTER TABLE events ADD COLUMN IF NOT EXISTS gift_config JSONB DEFAULT '{}'::jsonb;

-- Add guest_name to playlist_requests if not exists (already ran but safe to repeat with IF NOT EXISTS logic)
ALTER TABLE playlist_requests ADD COLUMN IF NOT EXISTS guest_name TEXT;

-- Verify columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'events' AND column_name IN ('venue_lat', 'venue_lng', 'dress_code_images', 'gift_config');
