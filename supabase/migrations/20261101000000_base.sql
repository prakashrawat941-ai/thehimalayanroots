-- The Himalayan Roots: run in the Supabase SQL editor (or via `supabase db push`).
-- Row Level Security is enabled on every table. Roles are stored in public.profiles,
-- never in user-editable auth metadata.

create extension if not exists "pgcrypto";

-- ---------- profiles ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '' check (char_length(full_name) <= 120),
  phone text check (phone is null or char_length(phone) <= 20),
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 120));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Users may edit their own profile but never their role.
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'Not allowed to change role';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_role on public.profiles;
create trigger protect_profile_role
  before update on public.profiles
  for each row execute function public.protect_profile_role();

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin" on public.profiles
  for update using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- ---------- bookings ----------
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  listing_kind text not null check (listing_kind in ('homestays', 'experiences', 'trekking', 'workation')),
  listing_slug text not null check (char_length(listing_slug) <= 120),
  listing_title text not null check (char_length(listing_title) <= 200),
  start_date date not null,
  end_date date not null,
  guests int not null check (guests between 1 and 30),
  total_inr int not null check (total_inr >= 0),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled', 'completed')),
  notes text check (notes is null or char_length(notes) <= 1000),
  created_at timestamptz not null default now(),
  check (end_date >= start_date)
);
create index if not exists bookings_user_idx on public.bookings (user_id, created_at desc);
create index if not exists bookings_status_idx on public.bookings (status, created_at desc);
alter table public.bookings enable row level security;

-- Regular users may only cancel their own pending/confirmed bookings; admins can change status.
create or replace function public.guard_booking_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_admin() then
    return new;
  end if;
  if new.id is distinct from old.id
     or new.user_id is distinct from old.user_id
     or new.listing_kind is distinct from old.listing_kind
     or new.listing_slug is distinct from old.listing_slug
     or new.listing_title is distinct from old.listing_title
     or new.start_date is distinct from old.start_date
     or new.end_date is distinct from old.end_date
     or new.guests is distinct from old.guests
     or new.total_inr is distinct from old.total_inr
     or new.notes is distinct from old.notes then
    raise exception 'Only the booking status can be changed';
  end if;
  if not (new.status = 'cancelled' and old.status in ('pending', 'confirmed')) then
    raise exception 'You can only cancel an active booking';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_booking_update on public.bookings;
create trigger guard_booking_update
  before update on public.bookings
  for each row execute function public.guard_booking_update();

drop policy if exists "bookings_select_own_or_admin" on public.bookings;
create policy "bookings_select_own_or_admin" on public.bookings
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "bookings_insert_own" on public.bookings;
create policy "bookings_insert_own" on public.bookings
  for insert with check (user_id = auth.uid() and status = 'pending');

drop policy if exists "bookings_update_own_or_admin" on public.bookings;
create policy "bookings_update_own_or_admin" on public.bookings
  for update using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

-- ---------- trip plans ----------
create table if not exists public.trip_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  region text not null check (region in ('Garhwal', 'Kumaon', 'Both')),
  travel_month text not null check (char_length(travel_month) <= 20),
  days int not null check (days between 1 and 30),
  travellers int not null check (travellers between 1 and 30),
  budget_inr int not null check (budget_inr >= 0),
  interests text[] not null default '{}',
  itinerary jsonb not null default '[]',
  notes text check (notes is null or char_length(notes) <= 1000),
  created_at timestamptz not null default now()
);
create index if not exists trip_plans_user_idx on public.trip_plans (user_id, created_at desc);
alter table public.trip_plans enable row level security;

drop policy if exists "trip_plans_select_own_or_admin" on public.trip_plans;
create policy "trip_plans_select_own_or_admin" on public.trip_plans
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "trip_plans_insert_own" on public.trip_plans;
create policy "trip_plans_insert_own" on public.trip_plans
  for insert with check (user_id = auth.uid());

drop policy if exists "trip_plans_delete_own" on public.trip_plans;
create policy "trip_plans_delete_own" on public.trip_plans
  for delete using (user_id = auth.uid());

-- ---------- first admin ----------
-- After signing up, promote yourself from the SQL editor (runs as the postgres role):
--   update public.profiles set role = 'admin' where id = '<your-auth-user-uuid>';

-- ---------- cab requests ----------
create table if not exists public.cab_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  pickup_place_id text not null check (char_length(pickup_place_id) <= 300),
  pickup_address text not null check (char_length(pickup_address) <= 400),
  pickup_lat double precision not null check (pickup_lat between 6 and 37.5),
  pickup_lng double precision not null check (pickup_lng between 68 and 98),
  pickup_details jsonb not null,
  drop_place_id text not null check (char_length(drop_place_id) <= 300),
  drop_address text not null check (char_length(drop_address) <= 400),
  drop_lat double precision not null check (drop_lat between 6 and 37.5),
  drop_lng double precision not null check (drop_lng between 68 and 98),
  drop_details jsonb not null,
  pickup_at timestamptz not null,
  passengers int not null check (passengers between 1 and 12),
  vehicle text not null check (vehicle in ('hatchback', 'sedan', 'suv', 'tempo')),
  notes text check (notes is null or char_length(notes) <= 500),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled', 'completed')),
  created_at timestamptz not null default now()
);
create index if not exists cab_requests_user_idx on public.cab_requests (user_id, created_at desc);
alter table public.cab_requests enable row level security;

drop policy if exists "cab_requests_select_own_or_admin" on public.cab_requests;
create policy "cab_requests_select_own_or_admin" on public.cab_requests
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "cab_requests_insert_own" on public.cab_requests;
create policy "cab_requests_insert_own" on public.cab_requests
  for insert with check (user_id = auth.uid() and status = 'pending');

drop policy if exists "cab_requests_update_admin" on public.cab_requests;
create policy "cab_requests_update_admin" on public.cab_requests
  for update using (public.is_admin()) with check (public.is_admin());
