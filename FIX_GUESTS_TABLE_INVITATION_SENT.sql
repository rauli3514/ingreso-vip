-- Add invitation_sent column to guests table if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'guests' AND column_name = 'invitation_sent') THEN
        ALTER TABLE guests ADD COLUMN invitation_sent BOOLEAN DEFAULT FALSE;
    END IF;
END $$;
