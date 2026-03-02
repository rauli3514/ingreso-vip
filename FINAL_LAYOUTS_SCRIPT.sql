-- PASO 1: Eliminar cualquier tabla incorrecta previa (opcional pero recomendado)
DROP TABLE IF EXISTS public.diseños_eventos;
DROP TABLE IF EXISTS public.event_layouts;

-- PASO 2: Crear la tabla correcta
CREATE TABLE public.event_layouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name text DEFAULT 'Layout 1',
  width numeric DEFAULT 1000,
  height numeric DEFAULT 1000,
  objects jsonb DEFAULT '[]'::jsonb, -- Aquí se guardan las mesas
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- PASO 3: Habilitar seguridad (RLS)
ALTER TABLE public.event_layouts ENABLE ROW LEVEL SECURITY;

-- PASO 4: Crear política de acceso (Importante: NO traducir)
CREATE POLICY "Enable all for authenticated users" ON public.event_layouts
  FOR ALL USING (auth.role() = 'authenticated');

-- PASO 5: Forzar actualización del esquema en Supabase
NOTIFY pgrst, 'reload config';
