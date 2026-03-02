-- 1. Intentamos permisos genéricos a nivel de tabla (lo más importante)
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.event_layouts TO anon, authenticated, service_role;

-- 2. Aseguramos que la política RLS existe y es permisiva
ALTER TABLE public.event_layouts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.event_layouts;
CREATE POLICY "Enable all for authenticated users" ON public.event_layouts
  FOR ALL USING (auth.role() = 'authenticated');

-- 3. Forzar actualización de caché de API (Crucial)
NOTIFY pgrst, 'reload config';
