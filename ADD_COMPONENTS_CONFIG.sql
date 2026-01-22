ALTER TABLE event_invitations 
ADD COLUMN IF NOT EXISTS components_config JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN event_invitations.components_config IS 'Configuración extra para componentes como DressCode, Playlist, Trivia, etc.';
