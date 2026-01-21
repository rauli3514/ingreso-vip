-- Asegurar que RLS estal habilitado
ALTER TABLE public.event_invitations ENABLE ROW LEVEL SECURITY;

-- 1. Eliminar políticas existentes para evitar conflictos
DROP POLICY IF EXISTS "Authenticated users can select invitations" ON public.event_invitations;
DROP POLICY IF EXISTS "Authenticated users can insert invitations" ON public.event_invitations;
DROP POLICY IF EXISTS "Authenticated users can update invitations" ON public.event_invitations;
DROP POLICY IF EXISTS "Authenticated users can delete invitations" ON public.event_invitations;

-- 2. Crear políticas permisivas para usuarios autenticados
-- SELECT: Ver invitaciones (incluimos anon para que la pública funcione, o creamos una específica)
CREATE POLICY "Public select access" 
ON public.event_invitations FOR SELECT 
USING (true);

-- INSERT: Usuarios autenticados pueden crear invitaciones
CREATE POLICY "Auth insert access" 
ON public.event_invitations FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- UPDATE: Usuarios autenticados pueden editar
CREATE POLICY "Auth update access" 
ON public.event_invitations FOR UPDATE 
USING (auth.role() = 'authenticated');

-- DELETE: Usuarios autenticados pueden borrar
CREATE POLICY "Auth delete access" 
ON public.event_invitations FOR DELETE 
USING (auth.role() = 'authenticated');

-- Asegurarse también de la tabla de RESPUESTAS
ALTER TABLE public.invitation_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert responses" ON public.invitation_responses;
CREATE POLICY "Anyone can insert responses" 
ON public.invitation_responses FOR INSERT 
WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can view responses" ON public.invitation_responses;
CREATE POLICY "Authenticated users can view responses" 
ON public.invitation_responses FOR SELECT 
USING (auth.role() = 'authenticated');
