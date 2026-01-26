-- Create playlist_requests table
CREATE TABLE IF NOT EXISTS playlist_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    song_name TEXT NOT NULL,
    artist_name TEXT NOT NULL,
    guest_name TEXT,
    vote_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending'
);

-- Add RLS policies (adjust as needed, currently allowing public access for demo)
ALTER TABLE playlist_requests ENABLE ROW LEVEL SECURITY;

-- Allow public read of playlist requests for the event
CREATE POLICY "Public read access" ON playlist_requests
    FOR SELECT
    USING (true);

-- Allow public insert (guests suggesting songs)
CREATE POLICY "Public insert access" ON playlist_requests
    FOR INSERT
    WITH CHECK (true);

-- Allow public update (for voting)
CREATE POLICY "Public update access" ON playlist_requests
    FOR UPDATE
    USING (true);
