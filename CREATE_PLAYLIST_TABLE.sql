-- Tabla para canciones sugeridas en playlist colaborativa
CREATE TABLE IF NOT EXISTS playlist_songs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    song_name TEXT NOT NULL,
    artist TEXT NOT NULL,
    suggested_by TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_playlist_songs_event ON playlist_songs(event_id);
CREATE INDEX IF NOT EXISTS idx_playlist_songs_created ON playlist_songs(event_id, created_at DESC);

-- Habilitar RLS
ALTER TABLE playlist_songs ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso
-- Cualquiera puede leer canciones
CREATE POLICY "Anyone can read playlist songs" ON playlist_songs
    FOR SELECT USING (true);

-- Cualquiera puede insertar canciones
CREATE POLICY "Anyone can suggest songs" ON playlist_songs
    FOR INSERT WITH CHECK (true);

--Solo usuarios autenticados pueden eliminar canciones
CREATE POLICY "Authenticated users can delete songs" ON playlist_songs
    FOR DELETE USING (auth.role() = 'authenticated');

COMMENT ON TABLE playlist_songs IS 'Canciones sugeridas por invitados para la playlist del evento';
