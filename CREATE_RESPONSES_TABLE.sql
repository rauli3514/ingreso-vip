-- Tabla para almacenar las respuestas de los invitados (RSVP)
create table public.invitation_responses (
  id uuid default gen_random_uuid() primary key,
  event_id uuid references public.events(id) on delete cascade not null,
  invitation_id uuid references public.event_invitations(id) on delete cascade not null,
  
  full_name text not null,
  attending boolean not null, -- true: Sí, false: No
  type text not null, -- 'ceremony', 'party', 'song'
  
  message text, -- Mensaje, canción sugerida, o restricción alimentaria
  email text, -- Opcional, por si queremos capturar contacto
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS
alter table public.invitation_responses enable row level security;

-- Políticas de Seguridad

-- 1. INSERT: Permitir a cualquiera insertar respuestas (público)
-- Como la invitación es pública, no requerimos autenticación para responder.
create policy "Anyone can insert responses"
  on public.invitation_responses for insert
  with check (true);

-- 2. SELECT: Solo usuarios autenticados (Admins/Clientes) pueden ver las respuestas de sus eventos
-- (Simplificado: usuarios autenticados pueden ver, idealmente filtrar por event_id propio)
create policy "Authenticated users can view responses"
  on public.invitation_responses for select
  using (auth.role() = 'authenticated');

-- 3. DELETE: Solo autenticados pueden borrar
create policy "Authenticated users can delete responses"
  on public.invitation_responses for delete
  using (auth.role() = 'authenticated');
