-- Sincronización en la Nube (Multi-dispositivo)
-- Este script añade una columna para guardar toda la configuración visual del planificador de EventPix.

ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS planner_data JSONB DEFAULT '{}'::jsonb;

-- Asegurar que los dueños del evento puedan actualizar esta columna
-- (Las políticas de RLS de update existentes ya permiten modificar cualquier columna al owner_id, 
--  así que no es estrictamente necesario añadir nuevas políticas si ya existían para 'events').
