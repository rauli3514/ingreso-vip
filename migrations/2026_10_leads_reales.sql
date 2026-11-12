-- =============== LEADS Y CLIENTES CON DATOS REALES (octubre 2026) ===============
-- Antes:
--   * El teléfono y el nombre que la gente pone al registrarse quedaban
--     escondidos en auth.users, así que el Directorio de Clientes no los mostraba.
--   * Los leads se guardaban con el nombre del evento ("Mi Evento") y sin
--     email ni teléfono: no había forma de saber quién los pidió.
--   * Cualquier usuario con cuenta podía leer, cambiar y borrar todos los leads
--     y modificar los proveedores.
--
-- Este script:
--   1. Agrega nombre y teléfono a profiles, los copia al registrarse y
--      completa los de las cuentas que ya existen.
--   2. Deja que el superadmin vea cuándo entró cada cliente por última vez.
--   3. Guarda en cada lead quién lo pidió (owner_id) y permite leads para
--      EventPix (sin proveedor).
--   4. Solo el superadmin lee y maneja leads y proveedores.
--
-- Necesita public.is_superadmin() (está en 2026_10_cobro_seguro_planes.sql).
-- Ejecutar una vez en el SQL Editor de Supabase. Se puede volver a ejecutar.

-- 1. NOMBRE Y TELÉFONO EN PROFILES
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name text;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, role, is_active, full_name, phone)
    VALUES (
        new.id,
        new.email,
        'provider',
        true,
        NULLIF(COALESCE(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'), ''),
        NULLIF(new.raw_user_meta_data ->> 'phone', '')
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name),
        phone = COALESCE(NULLIF(public.profiles.phone, ''), EXCLUDED.phone);
    RETURN new;
END;
$$;

-- Por si el proyecto no tiene el disparador que crea el perfil al registrarse.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Cuentas que ya existen: se completa lo que falte con lo que pusieron al registrarse.
UPDATE public.profiles p SET
    full_name = COALESCE(p.full_name, NULLIF(COALESCE(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name'), '')),
    phone = COALESCE(NULLIF(p.phone, ''), NULLIF(u.raw_user_meta_data ->> 'phone', ''))
FROM auth.users u
WHERE u.id = p.id;

-- 2. ÚLTIMO INGRESO DE CADA CUENTA (solo para el superadmin)
CREATE OR REPLACE FUNCTION public.admin_last_sign_ins()
RETURNS TABLE (id uuid, last_sign_in_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT u.id, u.last_sign_in_at FROM auth.users u WHERE public.is_superadmin();
$$;
REVOKE ALL ON FUNCTION public.admin_last_sign_ins() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_last_sign_ins() TO authenticated;

-- 3. QUIÉN PIDIÓ CADA LEAD
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid();
-- Leads para EventPix (Kiosco Box, pantalla, etc.): no tienen proveedor.
ALTER TABLE public.leads ALTER COLUMN provider_id DROP NOT NULL;

-- Leads viejos: se los asigna al dueño del evento.
UPDATE public.leads l SET owner_id = e.owner_id
FROM public.events e
WHERE l.event_id = e.id AND l.owner_id IS NULL;

-- 4. PERMISOS
-- Se borran todas las políticas que haya en leads y providers (con el nombre
-- que tengan) y se crean de nuevo.
DO $$
DECLARE pol record;
BEGIN
    FOR pol IN
        SELECT policyname, tablename FROM pg_policies
        WHERE schemaname = 'public' AND tablename IN ('leads', 'providers')
    LOOP
        EXECUTE format('DROP POLICY %I ON public.%I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;

-- Leads: cualquiera los crea desde el organizador (a su nombre o sin cuenta);
-- solo el superadmin los lee, cambia y borra.
CREATE POLICY "Public can insert leads" ON public.leads
    FOR INSERT TO public WITH CHECK (owner_id IS NULL OR owner_id = auth.uid());
CREATE POLICY "Superadmin reads leads" ON public.leads
    FOR SELECT TO authenticated USING (public.is_superadmin());
CREATE POLICY "Superadmin updates leads" ON public.leads
    FOR UPDATE TO authenticated USING (public.is_superadmin()) WITH CHECK (public.is_superadmin());
CREATE POLICY "Superadmin deletes leads" ON public.leads
    FOR DELETE TO authenticated USING (public.is_superadmin());

-- Proveedores: todos los ven (el organizador los muestra); solo el superadmin los cambia.
CREATE POLICY "Public can read providers" ON public.providers
    FOR SELECT TO public USING (true);
CREATE POLICY "Superadmin modifies providers" ON public.providers
    FOR ALL TO authenticated USING (public.is_superadmin()) WITH CHECK (public.is_superadmin());

NOTIFY pgrst, 'reload schema';
