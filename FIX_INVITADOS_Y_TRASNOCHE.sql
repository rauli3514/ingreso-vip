-- === FIX PERMISOS INVITADOS Y NUEVAS FUNCIONES ===

-- 1. SOLUCIÓN ERROR CREACIÓN (RLS)
-- Permite a todos los usuarios autenticados crear, ver y editar invitados
DROP POLICY IF EXISTS "Permisos totales invitados" ON public.guests;
DROP POLICY IF EXISTS "Guests are viewable by everyone" ON public.guests;
DROP POLICY IF EXISTS "Guests are insertable by authenticated users" ON public.guests;

CREATE POLICY "Permisos totales invitados" 
ON public.guests 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- 2. NUEVAS COLUMNAS PARA GESTIÓN
-- Invitados: Trasnoche y Puff
ALTER TABLE public.guests 
ADD COLUMN IF NOT EXISTS is_after_party boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS has_puff boolean DEFAULT false;

-- Eventos: Hora de trasnoche
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS after_party_time text;
