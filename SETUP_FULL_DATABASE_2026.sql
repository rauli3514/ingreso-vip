-- =============== SCRIPT DE ACTUALIZACIÓN DE BASE DE DATOS (INGRESOS VIP 2026) ===============
-- Este script crea las tablas faltantes, añade las columnas necesarias y ajusta los permisos (RLS).

-- 0. ASEGURARNOS QUE FUNCIONES BASE ESTAN
create extension if not exists "uuid-ossp";

-- 1. CREAR TABLA GUESTS SI NO EXISTE
CREATE TABLE IF NOT EXISTS public.guests (
  id uuid default uuid_generate_v4() primary key,
  event_id uuid references public.events(id) on delete cascade not null,
  first_name text not null,
  last_name text not null,
  display_name text,
  table_info text,
  assigned_video_url text,
  status text default 'pending',
  arrived_at timestamptz,
  created_at timestamptz default now()
);

-- 2. AÑADIR NUEVAS COLUMNAS A LA TABLA EVENTS
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='theme_id') THEN
        ALTER TABLE public.events ADD COLUMN theme_id UUID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='description') THEN
        ALTER TABLE public.events ADD COLUMN description TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='after_party_time') THEN
        ALTER TABLE public.events ADD COLUMN after_party_time TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='gift_config') THEN
        ALTER TABLE public.events ADD COLUMN gift_config JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- 3. AÑADIR NUEVAS COLUMNAS A LA TABLA GUESTS
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='guests' AND column_name='is_after_party') THEN
        ALTER TABLE public.guests ADD COLUMN is_after_party BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='guests' AND column_name='has_puff') THEN
        ALTER TABLE public.guests ADD COLUMN has_puff BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='guests' AND column_name='table_info') THEN
        ALTER TABLE public.guests ADD COLUMN table_info TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='guests' AND column_name='companions') THEN
        ALTER TABLE public.guests ADD COLUMN companions JSONB DEFAULT '[]'::jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='guests' AND column_name='invitation_sent') THEN
        ALTER TABLE public.guests ADD COLUMN invitation_sent BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- 4. AÑADIR NUEVAS COLUMNAS A LA TABLA INVITATIONS (Si existe, sino la creamos basico)
CREATE TABLE IF NOT EXISTS public.invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invitations' AND column_name='advanced_settings') THEN
        ALTER TABLE public.invitations ADD COLUMN advanced_settings JSONB DEFAULT '{}'::jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invitations' AND column_name='components_config') THEN
        ALTER TABLE public.invitations ADD COLUMN components_config JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- 5. CREAR NUEVAS TABLAS DE FUNCIONES INTERACTIVAS SI NO EXISTEN
CREATE TABLE IF NOT EXISTS public.playlist_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    guest_id UUID REFERENCES public.guests(id) ON DELETE SET NULL,
    song_name TEXT NOT NULL,
    artist_name TEXT,
    vote_count INTEGER DEFAULT 1,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.trivia_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    options JSONB NOT NULL,
    correct_answer INTEGER NOT NULL,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.trivia_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    guest_name TEXT NOT NULL,
    answers JSONB NOT NULL,
    score INTEGER NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. PERMISOS Y POLITICAS DE SEGURIDAD (Row Level Security)

-- Permitir uso genérico
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Playlist Requests
ALTER TABLE public.playlist_requests ENABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.playlist_requests TO anon, authenticated;
DROP POLICY IF EXISTS "Public can insert playlist requests" ON public.playlist_requests;
CREATE POLICY "Public can insert playlist requests" ON public.playlist_requests FOR INSERT TO public WITH CHECK (true);
DROP POLICY IF EXISTS "Public can read playlist requests" ON public.playlist_requests;
CREATE POLICY "Public can read playlist requests" ON public.playlist_requests FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "Auth users can modify playlist requests" ON public.playlist_requests;
CREATE POLICY "Auth users can modify playlist requests" ON public.playlist_requests FOR ALL TO authenticated USING (true);

-- Trivia Questions
ALTER TABLE public.trivia_questions ENABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.trivia_questions TO anon, authenticated;
DROP POLICY IF EXISTS "Public can read trivia questions" ON public.trivia_questions;
CREATE POLICY "Public can read trivia questions" ON public.trivia_questions FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "Auth users can modify trivia questions" ON public.trivia_questions;
CREATE POLICY "Auth users can modify trivia questions" ON public.trivia_questions FOR ALL TO authenticated USING (true);

-- Trivia Responses
ALTER TABLE public.trivia_responses ENABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.trivia_responses TO anon, authenticated;
DROP POLICY IF EXISTS "Public can insert trivia responses" ON public.trivia_responses;
CREATE POLICY "Public can insert trivia responses" ON public.trivia_responses FOR INSERT TO public WITH CHECK (true);
DROP POLICY IF EXISTS "Public can read trivia responses" ON public.trivia_responses;
CREATE POLICY "Public can read trivia responses" ON public.trivia_responses FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "Auth users can modify trivia responses" ON public.trivia_responses;
CREATE POLICY "Auth users can modify trivia responses" ON public.trivia_responses FOR ALL TO authenticated USING (true);

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
