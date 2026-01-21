-- EJECUTA ESTO EN EL SQL EDITOR DE SUPABASE PARA CORREGIR EL ERROR --

-- 1. Agregar columna para la cantidad de pases (Por defecto 1)
ALTER TABLE guests 
ADD COLUMN IF NOT EXISTS passes INTEGER DEFAULT 1;

-- 2. Agregar columna para los nombres de los acompañantes (Array de texto)
ALTER TABLE guests 
ADD COLUMN IF NOT EXISTS companions TEXT[] DEFAULT '{}';

-- 3. (Opcional) Asegurar permisos para que el usuario autenticado pueda ver y editar estas columnas
GRANT SELECT, INSERT, UPDATE, DELETE ON guests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON guests TO service_role;
