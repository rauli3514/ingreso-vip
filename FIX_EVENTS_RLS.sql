-- Enable RLS on events if not enabled
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Allow public read access to events (since invitations are public)
CREATE POLICY "Public read events" ON events
    FOR SELECT
    USING (true);

-- Just in case, grant usage to anon (usually default in Supabase but good to ensure)
GRANT SELECT ON events TO anon;
GRANT SELECT ON events TO authenticated;

-- Verify the update by selecting the data we just put in
SELECT id, venue_lat, venue_lng, dress_code_images FROM events LIMIT 1;
