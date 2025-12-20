-- Agregar campo theme_id a la tabla events
-- Este campo permite seleccionar un tema visual predefinido (neon, boda, tecno, etc.)

ALTER TABLE events 
ADD COLUMN IF NOT EXISTS theme_id TEXT DEFAULT 'default';

-- Crear índice para búsquedas por tema
CREATE INDEX IF NOT EXISTS idx_events_theme_id ON events(theme_id);

-- Comentario de la columna
COMMENT ON COLUMN events.theme_id IS 'ID del tema visual seleccionado (neon, boda, tecno, rustic, infantil, quince, 15-anos, default)';
