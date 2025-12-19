-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ==========================================
-- 1. TABLES
-- ==========================================

-- USERS (Providers & Admins)
-- Note: Supabase Auth handles authentication. 
-- We'll use a public 'profiles' table to store roles and additional info if needed,
-- or just use app_metadata. For simplicity and requirements (create/delete users),
-- we will create a 'profiles' table linked to auth.users.
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
-- We will need buckets for: 'event-assets' (backgrounds, loops), 'guest-videos'.
insert into storage.buckets (id, name, public) values ('event-assets', 'event-assets', true);
insert into storage.buckets (id, name, public) values ('guest-videos', 'guest-videos', true);

-- ==========================================
-- 3. RLS POLICIES (Simplified for initial setup)
-- ==========================================
alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.guests enable row level security;

-- PROFILES
-- Superadmin can read/write all.
-- Users can read their own.
create policy "Public profiles are viewable by everyone" on public.profiles for select using (true);

-- EVENTS
-- Superadmin sees all.
-- Providers see their own owner_id.
-- Guests (public/anon) see specific fields if they know the ID (for the app).
create policy "Providers show their own events" on public.events for select using (auth.uid() = owner_id);

-- GUESTS
-- Public read access allows guests to find themselves by name.
create policy "Guests can be searched publicly" on public.guests for select using (true);


