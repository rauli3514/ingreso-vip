-- Agregar columna de teléfono a la tabla profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
