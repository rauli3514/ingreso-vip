-- =============================================
-- AGREGAR COLUMNA PHOTO_KIOSK_CONFIG A EVENTS
-- Ejecutar este script en Supabase SQL Editor
-- =============================================

-- 1. Agregar la columna photo_kiosk_config (JSONB, nullable)
ALTER TABLE events
ADD COLUMN IF NOT EXISTS photo_kiosk_config JSONB DEFAULT NULL;

-- 2. Verificar que se agregó correctamente
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'events'
  AND column_name = 'photo_kiosk_config';

-- ✅ Resultado esperado: 1 fila con columna photo_kiosk_config, jsonb, YES
