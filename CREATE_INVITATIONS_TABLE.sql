-- Create table for Event Invitations
create table if not exists public.event_invitations (
  id uuid default gen_random_uuid() primary key,
  event_id uuid references public.events(id) on delete cascade not null,
  
  -- Design & Style
  theme_id text not null default 'elegant',
  custom_css jsonb, -- For specific overrides if needed
  
  -- Content Sections
  hero_section jsonb default '{"title": "Nos Casamos", "subtitle": "", "show_date": true}'::jsonb,
  countdown_section jsonb default '{"show": true, "target_date": null}'::jsonb,
  ceremony_section jsonb default '{"show": true}'::jsonb,
  party_section jsonb default '{"show": true}'::jsonb,
  gallery_section jsonb default '{"show": true, "images": []}'::jsonb,
  dress_code_section jsonb default '{"show": true}'::jsonb,
  gifts_section jsonb default '{"show": true}'::jsonb,
  
  -- General Data
  cover_image_url text,
  music_playlist_url text,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  unique(event_id)
);

-- RLS Policies
alter table public.event_invitations enable row level security;

-- Policy: Everyone can view invitations (public read)
create policy "Public invitations are viewable by everyone"
  on public.event_invitations for select
  using (true);

-- Policy: Only event owners or admins can update their invitation
create policy "Users can update their own event invitations"
  on public.event_invitations for update
  using (
    exists (
      select 1 from public.events
      where events.id = event_invitations.event_id
      and (events.owner_id = auth.uid() or exists (select 1 from public.users where id = auth.uid() and role = 'superadmin'))
    )
  );

-- Policy: Only event owners or admins can insert
create policy "Users can insert their own event invitations"
  on public.event_invitations for insert
  with check (
    exists (
      select 1 from public.events
      where events.id = event_invitations.event_id
      and (events.owner_id = auth.uid() or exists (select 1 from public.users where id = auth.uid() and role = 'superadmin'))
    )
  );
