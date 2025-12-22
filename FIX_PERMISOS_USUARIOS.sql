-- ==========================================
-- FIX PERMISOS DE USUARIOS
-- Este script arregla los permisos RLS para la tabla profiles
-- permitiendo que los superadmins vean todos los usuarios
-- ==========================================

-- 1. ELIMINAR POLÍTICAS ANTIGUAS
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Superadmins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Superadmins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Superadmins can delete profiles" ON public.profiles;

-- 2. AGREGAR COLUMNA assigned_event_ids SI NO EXISTE
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'assigned_event_ids'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN assigned_event_ids uuid[];
    END IF;
END $$;

-- 3. CREAR NUEVAS POLÍTICAS MEJORADAS

-- SELECT: Superadmins ven todo, providers solo su perfil
CREATE POLICY "Profiles select policy" ON public.profiles
    FOR SELECT
    USING (
        -- Superadmins pueden ver todos los perfiles
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role = 'superadmin'
        )
        OR
        -- Usuarios pueden ver su propio perfil
        auth.uid() = id
    );

-- INSERT: Solo al crear cuenta (trigger automático)
CREATE POLICY "Profiles insert policy" ON public.profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- UPDATE: Superadmins pueden actualizar cualquier perfil, usuarios solo el suyo
CREATE POLICY "Profiles update policy" ON public.profiles
    FOR UPDATE
    USING (
        -- Superadmins pueden actualizar cualquier perfil
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role = 'superadmin'
        )
        OR
        -- Usuarios pueden actualizar su propio perfil
        auth.uid() = id
    );

-- DELETE: Solo superadmins pueden eliminar perfiles
CREATE POLICY "Profiles delete policy" ON public.profiles
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role = 'superadmin'
        )
    );

-- 4. MEJORAR POLÍTICAS DE EVENTOS PARA INCLUIR ASSIGNED_EVENT_IDS

-- Eliminar política antigua
DROP POLICY IF EXISTS "Carriers show their own events permissions" ON public.events;
DROP POLICY IF EXISTS "Events select policy" ON public.events;

-- Nueva política de SELECT para eventos
CREATE POLICY "Events select policy" ON public.events
    FOR SELECT
    USING (
        -- Superadmins ven todos los eventos
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role = 'superadmin'
        )
        OR
        -- Owners ven sus propios eventos
        auth.uid() = owner_id
        OR
        -- Providers ven eventos asignados (corregido)
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND events.id = ANY(assigned_event_ids)
        )
    );

-- 5. VERIFICACIÓN
-- Ejecuta esto para ver los permisos actuales:
-- SELECT tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies 
-- WHERE tablename IN ('profiles', 'events')
-- ORDER BY tablename, policyname;

-- 6. CREAR USUARIO SUPERADMIN SI NO EXISTE
-- Nota: Reemplaza 'tu-email@example.com' con el email del superadmin
-- Este script debe ejecutarse DESPUÉS de que el usuario se haya registrado

-- Ejemplo de cómo actualizar un usuario existente a superadmin:
-- UPDATE public.profiles 
-- SET role = 'superadmin' 
-- WHERE email = 'rauli3514@gmail.com';

COMMENT ON TABLE public.profiles IS 'Perfiles de usuarios con roles y permisos actualizados';
COMMENT ON COLUMN public.profiles.assigned_event_ids IS 'Array de UUIDs de eventos asignados a providers';
