-- PASO 1: Asegurar que las columnas existen
ALTER TABLE events ADD COLUMN IF NOT EXISTS venue_lat NUMERIC;
ALTER TABLE events ADD COLUMN IF NOT EXISTS venue_lng NUMERIC;
ALTER TABLE events ADD COLUMN IF NOT EXISTS dress_code_images TEXT[] DEFAULT '{}';
ALTER TABLE events ADD COLUMN IF NOT EXISTS gift_config JSONB DEFAULT '{}'::jsonb;

-- PASO 2: Habilitar lectura pública (IMPORTANTE)
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read events" ON events;
CREATE POLICY "Public read events" ON events FOR SELECT USING (true);
GRANT SELECT ON events TO anon;
GRANT SELECT ON events TO authenticated;

-- PASO 3: Actualizar TODOS los eventos (sin WHERE)
UPDATE events 
SET 
    venue_lat = -34.607568,
    venue_lng = -58.373256,
    dress_code_images = ARRAY[
        'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=400&q=80',
        'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=400&q=80'
    ],
    gift_config = '{
        "cards": [
            {"title": "Luna de Miel", "icon": "plane", "amount": 50000, "description": "Ayúdanos a volar"},
            {"title": "Cena Romántica", "icon": "dinner", "amount": 20000, "description": "Una noche especial"}
        ],
        "cbu": "0000003100000000000000", 
        "alias": "BODA.TEST.FULL"
    }'::jsonb;
