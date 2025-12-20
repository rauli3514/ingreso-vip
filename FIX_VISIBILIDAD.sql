-- === FIX CRÍTICO DE VISIBILIDAD ===

-- 1. Habilitar la LECTURA (SELECT) para todos los usuarios logueados.
-- Sin esto, la lista de usuarios aparece vacía porque la BD la oculta.
DROP POLICY IF EXISTS "Permitir lectura a autenticados" ON public.profiles;

CREATE POLICY "Permitir lectura a autenticados" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (true);

-- 2. Habilitar la ESCRITURA (UPDATE/DELETE) solo para Super Admins
-- Esto permite asignar eventos y deshabilitar usuarios.
DROP POLICY IF EXISTS "Super Admin Control Total" ON public.profiles;

CREATE POLICY "Super Admin Control Total" 
ON public.profiles 
FOR ALL 
USING (
  -- Verifica si el usuario que intenta la acción tiene rol 'superadmin'
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'superadmin'
);
