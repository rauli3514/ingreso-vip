-- 1. Agregar columna assigned_event_ids si no existe
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS assigned_event_ids text[] DEFAULT '{}';

-- 2. Asegurar permisos correctos (por si acaso)
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- 3. Crear política para que usuarios puedan ver sus eventos asignados (Opcional, pero recomendado)
-- CREATE POLICY "Users can see assigned events" ON public.events
-- FOR SELECT
-- USING (
--   id IN (
--     SELECT unnest(assigned_event_ids) 
--     FROM public.profiles 
--     WHERE id = auth.uid()
--   )
-- );
