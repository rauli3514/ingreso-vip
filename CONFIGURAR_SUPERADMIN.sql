-- ==========================================
-- CONFIGURAR SUPERADMIN
-- Este script configura el usuario rauli3514@gmail.com como superadmin
-- ==========================================

-- 1. VERIFICAR USUARIOS EXISTENTES
SELECT 
    id,
    email,
    role,
    is_active,
    created_at,
    assigned_event_ids
FROM public.profiles
ORDER BY created_at DESC;

-- 2. ACTUALIZAR USUARIO A SUPERADMIN
-- Ejecuta esto para hacer superadmin a tu usuario
UPDATE public.profiles 
SET 
    role = 'superadmin',
    is_active = true
WHERE email = 'rauli3514@gmail.com';

-- 3. VERIFICAR QUE SE ACTUALIZÓ CORRECTAMENTE
SELECT 
    id,
    email,
    role,
    is_active
FROM public.profiles
WHERE email = 'rauli3514@gmail.com';

-- 4. SI EL USUARIO NO EXISTE, CRÉALO MANUALMENTE
-- (Solo si el usuario ya existe en auth.users pero no en profiles)
/*
INSERT INTO public.profiles (id, email, role, is_active)
SELECT 
    id,
    email,
    'superadmin'::user_role,
    true
FROM auth.users
WHERE email = 'rauli3514@gmail.com'
ON CONFLICT (id) DO UPDATE
SET role = 'superadmin', is_active = true;
*/

-- 5. VERIFICAR TODOS LOS USUARIOS Y SUS ROLES
SELECT 
    p.email,
    p.role,
    p.is_active,
    COUNT(e.id) as eventos_propios,
    COALESCE(array_length(p.assigned_event_ids, 1), 0) as eventos_asignados
FROM public.profiles p
LEFT JOIN public.events e ON e.owner_id = p.id
GROUP BY p.id, p.email, p.role, p.is_active, p.assigned_event_ids
ORDER BY p.created_at DESC;
