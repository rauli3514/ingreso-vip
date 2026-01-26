-- 1. Tabla para Playlist Colaborativa
CREATE TABLE IF NOT EXISTS playlist_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    guest_id UUID REFERENCES guests(id) ON DELETE SET NULL, -- Opcional, si queremos saber quién la pidió
    song_name TEXT NOT NULL,
    artist_name TEXT,
    vote_count INTEGER DEFAULT 1,
    status TEXT DEFAULT 'pending', -- pending, approved, rejected
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Políticas RLS para playlist
ALTER TABLE playlist_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view approved playlist" ON playlist_requests
    FOR SELECT USING (true); -- Permitir ver todas por ahora para mostrar "lo que piden otros"

CREATE POLICY "Guests can insert songs" ON playlist_requests
    FOR INSERT WITH CHECK (true); -- Idealmente validar event_id, pero simplificado por ahora

CREATE POLICY "Owners can manage playlist" ON playlist_requests
    FOR ALL USING (
        EXISTS (SELECT 1 FROM events WHERE id = playlist_requests.event_id AND owner_id = auth.uid())
    );

-- 2. Nuevas columnas en la tabla EVENTS para las otras funcionalidades

ALTER TABLE events 
ADD COLUMN IF NOT EXISTS gift_config JSONB DEFAULT NULL, -- Almacenará { cbu, alias, bank, cards: [{title, amount, icon}] }
ADD COLUMN IF NOT EXISTS venue_lat DOUBLE PRECISION,     -- Para botones de Uber/Cabify
ADD COLUMN IF NOT EXISTS venue_lng DOUBLE PRECISION,     -- Para botones de Uber/Cabify
ADD COLUMN IF NOT EXISTS dress_code_images TEXT[] DEFAULT '{}'; -- Array de URLs para la galería de vestimenta

-- 3. Trigger para notificar nueva canción (opcional, dejamos preparado)
-- (Podemos reusar el sistema de notificaciones existente si lo hay, o dejarlo simple)
