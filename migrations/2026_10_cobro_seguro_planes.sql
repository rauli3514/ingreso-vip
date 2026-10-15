-- =============== COBRO SEGURO DE PLANES (octubre 2026) ===============
-- Antes, el plan se activaba desde el navegador al volver de MercadoPago
-- (?payment_success=true&plan=premium), así que cualquiera podía activarlo
-- escribiendo esa dirección. Ahora solo lo activa la función
-- mercadopago-webhook, después de confirmar el pago con MercadoPago.
--
-- Este script:
--   1. Prepara la tabla payments para no registrar dos veces el mismo pago.
--   2. Pasa a active_modules los eventos que ya tenían el plan por la vía vieja.
--   3. Impide que el navegador cambie planner_data.active_modules.
--   4. Deja que solo el superadmin vea los pagos y cambie los precios.
--
-- Ejecutar una vez en el SQL Editor de Supabase. Se puede volver a ejecutar.

-- 0. ¿Quién es superadmin? (mismo criterio que src/contexts/AuthContext.tsx)
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin')
        OR (auth.jwt() ->> 'email') = 'rauli3514@gmail.com';
$$;

-- 1. TABLA PAYMENTS
CREATE TABLE IF NOT EXISTS public.payments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id uuid REFERENCES public.events(id) ON DELETE SET NULL,
    plan_name text,
    amount numeric,
    status text,
    created_at timestamptz DEFAULT now()
);
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS mp_payment_id text;
CREATE UNIQUE INDEX IF NOT EXISTS payments_mp_payment_id_key ON public.payments(mp_payment_id);

-- 2. EVENTOS QUE YA TENÍAN EL PLAN POR LA VÍA VIEJA
-- (un servicio del grupo eventpix_premium marcado como listo). Se les agrega
-- invitation_pro para que no pierdan el acceso que ya tenían.
UPDATE public.events e
SET planner_data = jsonb_set(
        e.planner_data,
        '{active_modules}',
        COALESCE(e.planner_data -> 'active_modules', '[]'::jsonb) || '["invitation_pro"]'::jsonb
    )
WHERE EXISTS (
        SELECT 1 FROM jsonb_array_elements(COALESCE(e.planner_data -> 'services', '[]'::jsonb)) s
        WHERE s ->> 'group' = 'eventpix_premium' AND s ->> 'status' = 'ready'
    )
  AND NOT COALESCE(e.planner_data -> 'active_modules', '[]'::jsonb) ? 'invitation_pro';

-- 3. EL NAVEGADOR NO PUEDE CAMBIAR LOS MÓDULOS ACTIVOS
-- El planificador guarda planner_data entero desde el navegador. Este trigger
-- conserva los active_modules que ya había, salvo que escriba el servidor
-- (service_role, o una conexión directa como el SQL Editor) o el superadmin.
CREATE OR REPLACE FUNCTION public.protect_active_modules()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF auth.role() IS NULL OR auth.role() = 'service_role' OR public.is_superadmin() THEN
        RETURN NEW;
    END IF;

    IF TG_OP = 'UPDATE' AND OLD.planner_data ? 'active_modules' THEN
        NEW.planner_data := jsonb_set(
            COALESCE(NEW.planner_data, '{}'::jsonb),
            '{active_modules}',
            OLD.planner_data -> 'active_modules'
        );
    ELSIF NEW.planner_data ? 'active_modules' THEN
        NEW.planner_data := NEW.planner_data - 'active_modules';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_active_modules ON public.events;
CREATE TRIGGER protect_active_modules
    BEFORE INSERT OR UPDATE OF planner_data ON public.events
    FOR EACH ROW
    EXECUTE FUNCTION public.protect_active_modules();

-- 4. PERMISOS DE PAYMENTS Y APP_SETTINGS
-- Se borran las políticas que hubiera y se dejan solo estas:
--   payments:     solo el superadmin la lee; solo el servidor escribe.
--   app_settings: todos leen los precios; solo el superadmin los cambia.
DO $$
DECLARE pol record;
BEGIN
    FOR pol IN
        SELECT policyname, tablename FROM pg_policies
        WHERE schemaname = 'public' AND tablename IN ('payments', 'app_settings')
    LOOP
        EXECUTE format('DROP POLICY %I ON public.%I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payments_select_superadmin" ON public.payments
    FOR SELECT USING (public.is_superadmin());

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "app_settings_select_all" ON public.app_settings
    FOR SELECT USING (true);
CREATE POLICY "app_settings_update_superadmin" ON public.app_settings
    FOR UPDATE USING (public.is_superadmin()) WITH CHECK (public.is_superadmin());
