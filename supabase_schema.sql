-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ==========================================
-- 1. TABLES
-- ==========================================

-- USERS (Providers & Admins)
create type user_role as enum ('superadmin', 'provider', 'admin');

create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  role user_role default 'provider',
  is_active boolean default true,
  created_at timestamptz default now()
);

-- EVENTS
create type event_status as enum ('pending', 'active', 'disabled', 'closed');
create type table_assignment_type as enum ('none', 'partial', 'full');

create table public.events (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamptz default now(),
  owner_id uuid references public.profiles(id) not null,
  
  name text not null,
  date date not null,
  
  guest_count_total int default 0,
  table_assignment table_assignment_type default 'none',
  table_count int default 0,
  guests_per_table_default int default 10,
  
  has_living_room boolean default false,
  has_after_party boolean default false,
  
  status event_status default 'pending',
  
  -- Settings / Theme
  theme_background_url text, -- image or video url
  theme_font_family text default 'Outfit',
  theme_custom_logo_url text,
  
  -- Admin specific
  is_approved boolean default false
);

-- GUESTS
create table public.guests (
  id uuid default uuid_generate_v4() primary key,
  event_id uuid references public.events(id) on delete cascade not null,
  
  first_name text not null,
  last_name text not null,
  display_name text, -- Computed or manual
  
  table_info text, -- "Mesa 1", "Living", etc.
  
  assigned_video_url text,
  
  status text default 'pending', -- 'pending', 'arrived'
  arrived_at timestamptz,
  
  created_at timestamptz default now()
);

-- ==========================================
-- 2. STORAGE
-- ==========================================
insert into storage.buckets (id, name, public) values ('event-assets', 'event-assets', true);
insert into storage.buckets (id, name, public) values ('guest-videos', 'guest-videos', true);

-- ==========================================
-- 3. RLS POLICIES
-- ==========================================
alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.guests enable row level security;

-- PROFILES
create policy "Public profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can insert their own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update their own profile" on public.profiles for update using (auth.uid() = id);

-- EVENTS
create policy "Carriers show their own events permissions" on public.events for select using (auth.uid() = owner_id);
create policy "Authenticated users can create events" on public.events for insert with check (auth.uid() = owner_id);
create policy "Owners can update their events" on public.events for update using (auth.uid() = owner_id);
create policy "Owners can delete their events" on public.events for delete using (auth.uid() = owner_id);

-- GUESTS
create policy "Guests can be searched publicly" on public.guests for select using (true);
create policy "Owners can manage guests" on public.guests for all using (
  exists (select 1 from public.events where id = event_id and owner_id = auth.uid())
);

-- ==========================================
-- 4. TRIGGERS
-- ==========================================
-- Automatically create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'provider');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
