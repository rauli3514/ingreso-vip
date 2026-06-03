-- ==========================================
-- SCRIPT: CREACIÓN DE PROVIDERS Y LEADS
-- ==========================================

-- 1. CREAR TABLA DE PROVEEDORES (providers)
CREATE TABLE IF NOT EXISTS public.providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name TEXT NOT NULL,
    services_offered JSONB NOT NULL DEFAULT '[]'::jsonb, -- Ej: ["Música / DJ", "Pantalla LED"]
    location TEXT NOT NULL,
    whatsapp_number TEXT NOT NULL,
    base_price NUMERIC DEFAULT 0,
    logo_url TEXT,
    rating NUMERIC DEFAULT 5.0,
    reviews_count INTEGER DEFAULT 0,
    tier TEXT DEFAULT 'standard' CHECK (tier IN ('standard', 'premium')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. CREAR TABLA DE LEADS (leads)
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
    event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
    client_name TEXT NOT NULL,
    client_email TEXT,
    client_phone TEXT,
    estimated_budget NUMERIC DEFAULT 0,
    event_details JSONB DEFAULT '{}'::jsonb, -- Cantidad invitados, fecha, mesas, etc.
    status TEXT DEFAULT 'nuevo' CHECK (status IN ('nuevo', 'contactado', 'cerrado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- 4. POLÍTICAS PARA PROVEEDORES (providers)
-- Todo el mundo puede ver los proveedores
DROP POLICY IF EXISTS "Public can read providers" ON public.providers;
CREATE POLICY "Public can read providers" ON public.providers 
    FOR SELECT TO public USING (true);

-- Solo usuarios autenticados (admin) pueden modificar proveedores
DROP POLICY IF EXISTS "Auth users can modify providers" ON public.providers;
CREATE POLICY "Auth users can modify providers" ON public.providers 
    FOR ALL TO authenticated USING (true);

-- 5. POLÍTICAS PARA LEADS (leads)
-- Cualquier persona (organizador logueado o público en planificador) puede crear un lead
DROP POLICY IF EXISTS "Public can insert leads" ON public.leads;
CREATE POLICY "Public can insert leads" ON public.leads 
    FOR INSERT TO public WITH CHECK (true);

-- Solo los usuarios logueados pueden ver o modificar leads (el admin)
DROP POLICY IF EXISTS "Auth users can read leads" ON public.leads;
CREATE POLICY "Auth users can read leads" ON public.leads 
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Auth users can modify leads" ON public.leads;
CREATE POLICY "Auth users can modify leads" ON public.leads 
    FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Auth users can delete leads" ON public.leads;
CREATE POLICY "Auth users can delete leads" ON public.leads 
    FOR DELETE TO authenticated USING (true);

-- 6. REFRESCO DE CACHÉ DE ESQUEMA (Para que la API lo tome)
NOTIFY pgrst, 'reload schema';
