-- === FIX COLUMNAS FALTANTES EN BASE DE DATOS ===

-- Problema: Al guardar la configuración de "Trasnoche" y "Living" en el evento,
-- los cambios no se guardan porque faltan estas columnas en la tabla de base de datos.

-- 1. Agregar columnas booleanas a tabla 'events'
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS has_living_room boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS has_after_party boolean DEFAULT false;

-- 2. Asegurar columnas de invitados (por si no se ejecutó el script anterior)
ALTER TABLE public.guests 
ADD COLUMN IF NOT EXISTS is_after_party boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS has_puff boolean DEFAULT false;

-- 3. Asegurar columna de hora de trasnoche
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS after_party_time text DEFAULT '01:00';

-- 4. Notificar éxito (opcional, solo para verificar en SQL Editor)
SELECT 'Columnas creadas exitosamente' as status;
