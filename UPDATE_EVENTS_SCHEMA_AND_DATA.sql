-- PASO 1: Agregar las columnas faltantes (Si no existen)
ALTER TABLE events ADD COLUMN IF NOT EXISTS venue_lat NUMERIC;
ALTER TABLE events ADD COLUMN IF NOT EXISTS venue_lng NUMERIC;
ALTER TABLE events ADD COLUMN IF NOT EXISTS dress_code_images TEXT[] DEFAULT '{}';
ALTER TABLE events ADD COLUMN IF NOT EXISTS gift_config JSONB DEFAULT '{}'::jsonb;

-- PASO 2: Rellenar con datos de prueba (Para ver los cambios visuales)
UPDATE events 
SET 
    -- Coordenadas de ejemplo (Catedral de Buenos Aires)
    venue_lat = -34.607568,
    venue_lng = -58.373256,

    -- Imágenes de ejemplo para Dress Code
    dress_code_images = ARRAY[
        'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=400&q=80',
        'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=400&q=80',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80'
    ],

    -- Configuración de Regalos Visuales
    gift_config = '{
        "cards": [
            {"title": "Luna de Miel", "icon": "plane", "amount": 50000, "description": "Ayúdanos a volar"},
            {"title": "Cena Romántica", "icon": "dinner", "amount": 20000, "description": "Una noche especial"},
            {"title": "Nuestra Casa", "icon": "house", "amount": 100000, "description": "Ladrillo a ladrillo"}
        ],
        "cbu": "0000003100000000000000", 
        "alias": "BODA.EJEMPLO.2026",
        "bank": "Banco Santander"
    }'::jsonb
WHERE id = (SELECT id FROM events LIMIT 1); 
