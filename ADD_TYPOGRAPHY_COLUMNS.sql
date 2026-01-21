-- Agrega las columnas de tipografía a la tabla event_invitations
ALTER TABLE event_invitations 
ADD COLUMN IF NOT EXISTS font_size INTEGER DEFAULT 18,
ADD COLUMN IF NOT EXISTS font_weight TEXT DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS letter_spacing FLOAT DEFAULT 0.03;

-- Por si acaso, asegurar que custom_font_url también exista
ALTER TABLE event_invitations 
ADD COLUMN IF NOT EXISTS custom_font_url TEXT;

-- Comentario para verificar
COMMENT ON COLUMN event_invitations.font_size IS 'Tamaño base de la fuente en px';
COMMENT ON COLUMN event_invitations.font_weight IS 'Peso de la fuente (normal, bold, etc)';
COMMENT ON COLUMN event_invitations.letter_spacing IS 'Espaciado entre letras en em';
