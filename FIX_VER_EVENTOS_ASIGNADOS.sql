-- === FIX PARA QUE USUARIOS VEAN SUS EVENTOS ASIGNADOS ===

-- Problema: Los usuarios tienen el evento asignado en su perfil, pero la tabla 'events'
-- tiene reglas de seguridad (RLS) que les impiden VER esos eventos.

-- Solución: Permitir que cualquier usuario autenticado pueda leer (SELECT) la tabla de eventos.
-- El filtrado de qué eventos ven realmente se hace en la aplicación (Frontend).

-- 1. Eliminar políticas restrictivas anteriores de lectura en events (si existen)
DROP POLICY IF EXISTS "Users can see assigned events" ON public.events;
DROP POLICY IF EXISTS "Users can view own events" ON public.events;

-- 2. Crear política permisiva de lectura para usuarios autenticados
CREATE POLICY "Authenticated users can read events" 
ON public.events 
FOR SELECT 
TO authenticated 
USING (true);

-- Nota: Esto no permite editar ni borrar, solo VER.
-- La edición sigue restringida a Super Admins o dueños.
