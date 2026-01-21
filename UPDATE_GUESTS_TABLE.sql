-- Agrega soporte para pases y acompañantes en la tabla guests
ALTER TABLE guests 
ADD COLUMN IF NOT EXISTS passes INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS companions JSONB DEFAULT '[]'::jsonb;

-- Comentarios
COMMENT ON COLUMN guests.passes IS 'Cantidad total de pases asignados a este invitado';
COMMENT ON COLUMN guests.companions IS 'Lista de nombres de los acompañantes (JSON Array)';
