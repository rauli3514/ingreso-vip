-- ==========================================
-- SCRIPT: ACTUALIZACIÓN DE PROVEEDORES
-- ==========================================

-- Agregar nuevas columnas a la tabla de providers
ALTER TABLE public.providers 
ADD COLUMN IF NOT EXISTS website_url TEXT,
ADD COLUMN IF NOT EXISTS instagram_url TEXT;

-- Refrescar esquema de la API para que Supabase reconozca los nuevos campos
NOTIFY pgrst, 'reload schema';
