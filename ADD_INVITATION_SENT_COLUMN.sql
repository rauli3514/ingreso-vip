-- Add invitation_sent column to guests table
ALTER TABLE guests 
ADD COLUMN IF NOT EXISTS invitation_sent BOOLEAN DEFAULT FALSE;

-- Update existing guests to have false (optional, but good for consistency)
UPDATE guests SET invitation_sent = FALSE WHERE invitation_sent IS NULL;
