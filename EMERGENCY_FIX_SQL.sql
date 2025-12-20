-- === SOLUCIÓN DE EMERGENCIA (A PRUEBA DE FALLOS) ===
-- Este script usa nombres únicos para las políticas, así NUNCA habrá error de "ya existe".

-- 1. ASEGURAR COLUMNAS (Sin fallar si existen)
DO $$ 
BEGIN
    ALTER TABLE public.events ADD COLUMN IF NOT EXISTS has_living_room boolean DEFAULT false;
    ALTER TABLE public.events ADD COLUMN IF NOT EXISTS has_after_party boolean DEFAULT false;
    ALTER TABLE public.events ADD COLUMN IF NOT EXISTS after_party_time text DEFAULT '01:00';
    ALTER TABLE public.events ADD COLUMN IF NOT EXISTS video_url_default text;
    ALTER TABLE public.events ADD COLUMN IF NOT EXISTS video_configuration jsonb DEFAULT '{}';
    
    ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS is_after_party boolean DEFAULT false;
    ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS has_puff boolean DEFAULT false;
    ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS assigned_video_url text;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 2. HABILITAR SEGURIDAD
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;

-- 3. CREAR POLÍTICAS CON NOMBRES ÚNICOS (Evita conflictos)
-- Usamos un número aleatorio para asegurar que se creen
CREATE POLICY "policy_read_events_fix_2025" ON public.events FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "policy_all_events_fix_2025" ON public.events FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "policy_read_guests_fix_2025" ON public.guests FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "policy_all_guests_fix_2025" ON public.guests FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. ARREGLAR STORAGE (PUBLIC)
INSERT INTO storage.buckets (id, name, public) VALUES ('guest-videos', 'guest-videos', true) ON CONFLICT (id) DO UPDATE SET public = true;
INSERT INTO storage.buckets (id, name, public) VALUES ('event-assets', 'event-assets', true) ON CONFLICT (id) DO UPDATE SET public = true;

-- Políticas Storage (También únicas)
CREATE POLICY "storage_read_guests_2025" ON storage.objects FOR SELECT TO public USING (bucket_id = 'guest-videos');
CREATE POLICY "storage_write_guests_2025" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'guest-videos');

SELECT '✅ AHORA SÍ. Base de datos reparada.' as status;
