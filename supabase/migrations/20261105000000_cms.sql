-- The Himalayan Roots CMS: roles, media library, site settings, homepage sections, listings
-- (destinations, homestays, experiences, treks, workations), reviews, ads, team, contact
-- messages and an append-only audit log. Every table has RLS; writes require a staff role.

-- ---------- roles ----------
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('user', 'host', 'editor', 'admin'));

-- Fix: the base trigger blocked *every* role change made without an admin JWT, including the documented
-- "promote yourself from the SQL editor" step, so no first admin could ever be created. Only API requests
-- (anon / authenticated) from non-admins are blocked now; the SQL editor and service role may promote.
-- SECURITY INVOKER so current_user is the real caller, not the function owner.
create or replace function public.protect_profile_role()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  if new.role is distinct from old.role and current_user in ('anon', 'authenticated') and not public.is_admin() then
    raise exception 'Not allowed to change role';
  end if;
  return new;
end;
$$;

-- Editors and admins manage content. Admins additionally manage users, bookings and the audit log.
create or replace function public.is_staff()
returns boolean language sql security definer set search_path = public stable as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role in ('editor', 'admin'));
$$;

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------- media library ----------
create table if not exists public.media (
  id uuid primary key default gen_random_uuid(),
  path text unique check (path is null or char_length(path) <= 300),          -- Storage object path; null for bundled files
  url text not null check (char_length(url) <= 1000 and (url like 'https://%' or url like '/%')),
  alt text not null default '' check (char_length(alt) <= 300),
  caption text check (caption is null or char_length(caption) <= 300),
  width int not null check (width > 0),
  height int not null check (height > 0),
  blur text check (blur is null or (char_length(blur) <= 4000 and blur like 'data:image/%')),
  credit text check (credit is null or char_length(credit) <= 200),
  license text check (license is null or char_length(license) <= 60),
  license_url text check (license_url is null or license_url like 'https://%'),
  source_url text check (source_url is null or source_url like 'https://%'),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists media_created_idx on public.media (created_at desc);

-- ---------- site settings (single row) ----------
create table if not exists public.site_settings (
  id int primary key default 1 check (id = 1),
  site_name text not null default 'The Himalayan Roots' check (char_length(site_name) between 2 and 80),
  tagline text not null default '' check (char_length(tagline) <= 200),
  description text not null default '' check (char_length(description) <= 300),
  logo_media_id uuid references public.media (id) on delete set null,
  favicon_media_id uuid references public.media (id) on delete set null,
  colors jsonb not null default '{}' check (jsonb_typeof(colors) = 'object'),
  social jsonb not null default '{}' check (jsonb_typeof(social) = 'object'),
  contact jsonb not null default '{}' check (jsonb_typeof(contact) = 'object'),
  about jsonb not null default '{}' check (jsonb_typeof(about) = 'object'),
  footer_note text not null default '' check (char_length(footer_note) <= 300),
  updated_at timestamptz not null default now()
);
insert into public.site_settings (id) values (1) on conflict (id) do nothing;

-- ---------- homepage sections ----------
create table if not exists public.home_sections (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('hero', 'intro', 'regions', 'destinations', 'banner', 'split', 'listings', 'mosaic', 'reviews', 'promo', 'features', 'ad', 'cta')),
  position int not null default 0,
  enabled boolean not null default true,
  eyebrow text not null default '' check (char_length(eyebrow) <= 80),
  title text not null default '' check (char_length(title) <= 200),
  accent text not null default '' check (char_length(accent) <= 120),
  body text not null default '' check (char_length(body) <= 2000),
  cta_label text not null default '' check (char_length(cta_label) <= 60),
  cta_url text not null default '' check (cta_url = '' or cta_url like '/%' or cta_url like 'https://%'),
  cta2_label text not null default '' check (char_length(cta2_label) <= 60),
  cta2_url text not null default '' check (cta2_url = '' or cta2_url like '/%' or cta2_url like 'https://%'),
  media_id uuid references public.media (id) on delete set null,
  data jsonb not null default '{}' check (jsonb_typeof(data) = 'object' and pg_column_size(data) <= 20000),
  updated_at timestamptz not null default now()
);
create index if not exists home_sections_order_idx on public.home_sections (position);

-- ---------- listings: destinations (villages), homestays, experiences, treks, workations ----------
create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('villages', 'homestays', 'experiences', 'trekking', 'workation')),
  slug text not null check (char_length(slug) <= 120 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 2 and 200),
  tagline text not null default '' check (char_length(tagline) <= 300),
  region text not null check (region in ('Garhwal', 'Kumaon')),
  location text not null default '' check (char_length(location) <= 200),
  district text check (district is null or char_length(district) <= 100),
  state text not null default 'Uttarakhand' check (char_length(state) <= 100),
  lat double precision check (lat is null or lat between -90 and 90),
  lng double precision check (lng is null or lng between -180 and 180),
  description text not null default '' check (char_length(description) <= 10000),
  highlights text[] not null default '{}' check (cardinality(highlights) <= 30),
  attractions text[] not null default '{}' check (cardinality(attractions) <= 50),
  facilities text[] not null default '{}' check (cardinality(facilities) <= 50),
  tags text[] not null default '{}' check (cardinality(tags) <= 20),
  travel_info text check (travel_info is null or char_length(travel_info) <= 4000),
  best_season text check (best_season is null or char_length(best_season) <= 300),
  how_to_reach text check (how_to_reach is null or char_length(how_to_reach) <= 4000),
  price int not null default 0 check (price between 0 and 10000000),
  price_unit text not null default 'free' check (price_unit in ('person', 'night', 'free')),
  details jsonb not null default '{}' check (jsonb_typeof(details) = 'object'),
  cover_media_id uuid references public.media (id) on delete set null,
  palette text not null default 'pine' check (palette in ('dawn', 'pine', 'snow', 'dusk', 'meadow')),
  status text not null default 'draft' check (status in ('draft', 'published')),
  featured boolean not null default false,
  position int not null default 0,
  host_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (kind, slug)
);
create index if not exists listings_public_idx on public.listings (kind, status, position);

create table if not exists public.listing_media (
  listing_id uuid not null references public.listings (id) on delete cascade,
  media_id uuid not null references public.media (id) on delete cascade,
  position int not null default 0,
  primary key (listing_id, media_id)
);

-- ---------- reviews ----------
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  name text not null check (char_length(name) between 2 and 120),
  location text check (location is null or char_length(location) <= 120),
  photo_media_id uuid references public.media (id) on delete set null,
  rating int not null check (rating between 1 and 5),
  title text check (title is null or char_length(title) <= 160),
  body text not null check (char_length(body) between 10 and 2000),
  listing_id uuid references public.listings (id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists reviews_status_idx on public.reviews (status, featured, created_at desc);

-- ---------- advertisements ----------
create table if not exists public.ads (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 2 and 160),
  body text not null default '' check (char_length(body) <= 300),
  media_id uuid references public.media (id) on delete set null,
  placement text not null check (placement in ('home_top', 'home_middle', 'home_bottom', 'listing_sidebar')),
  url text not null check (char_length(url) <= 1000 and (url like 'https://%' or url like '/%')),
  starts_at timestamptz,
  ends_at timestamptz,
  enabled boolean not null default true,
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (starts_at is null or ends_at is null or ends_at > starts_at)
);
create index if not exists ads_placement_idx on public.ads (placement, enabled, position);

-- ---------- team ----------
create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  role text not null default '' check (char_length(role) <= 120),
  bio text not null default '' check (char_length(bio) <= 1000),
  photo_media_id uuid references public.media (id) on delete set null,
  position int not null default 0,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- contact form ----------
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  email text not null check (char_length(email) <= 254 and email like '%_@_%'),
  phone text check (phone is null or char_length(phone) <= 20),
  subject text check (subject is null or char_length(subject) <= 160),
  message text not null check (char_length(message) between 10 and 4000),
  status text not null default 'new' check (status in ('new', 'read', 'archived')),
  created_at timestamptz not null default now()
);
create index if not exists contact_messages_status_idx on public.contact_messages (status, created_at desc);

-- ---------- audit log (append-only) ----------
create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid,
  actor_role text,
  action text not null check (action in ('insert', 'update', 'delete')),
  entity text not null,
  entity_id text not null default '',
  changes jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists audit_logs_created_idx on public.audit_logs (created_at desc);
create index if not exists audit_logs_entity_idx on public.audit_logs (entity, entity_id);

-- Written by trigger as the table owner, so it cannot be skipped or forged from the API.
create or replace function public.audit_row()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  cur jsonb := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
  prev jsonb := case when tg_op = 'INSERT' then null else to_jsonb(old) end;
  diff jsonb;
begin
  if tg_op = 'UPDATE' then
    select coalesce(jsonb_object_agg(key, jsonb_build_object('from', prev -> key, 'to', value)), '{}')
      into diff from jsonb_each(cur)
      where (prev -> key) is distinct from value and key not in ('updated_at', 'blur');
    if diff = '{}' then return new; end if;
  else
    diff := cur - 'blur';
  end if;
  insert into public.audit_logs (actor_id, actor_role, action, entity, entity_id, changes)
  values (auth.uid(), (select role from public.profiles where id = auth.uid()), lower(tg_op), tg_table_name,
          coalesce(cur ->> 'id', cur ->> 'listing_id', ''), diff);
  return coalesce(new, old);
end;
$$;

do $$
declare t text;
begin
  foreach t in array array['media', 'site_settings', 'home_sections', 'listings', 'listing_media', 'reviews', 'ads', 'team_members'] loop
    execute format('drop trigger if exists audit_%1$s on public.%1$s', t);
    execute format('create trigger audit_%1$s after insert or update or delete on public.%1$s for each row execute function public.audit_row()', t);
  end loop;
  -- Operational tables: audit changes and removals (status moves, role changes), not creation.
  foreach t in array array['profiles', 'bookings', 'cab_requests', 'contact_messages'] loop
    execute format('drop trigger if exists audit_%1$s on public.%1$s', t);
    execute format('create trigger audit_%1$s after update or delete on public.%1$s for each row execute function public.audit_row()', t);
  end loop;
  foreach t in array array['media', 'site_settings', 'home_sections', 'listings', 'reviews', 'ads', 'team_members'] loop
    execute format('drop trigger if exists touch_%1$s on public.%1$s', t);
    execute format('create trigger touch_%1$s before update on public.%1$s for each row execute function public.touch_updated_at()', t);
  end loop;
end;
$$;

-- ---------- row level security ----------
alter table public.media enable row level security;
alter table public.site_settings enable row level security;
alter table public.home_sections enable row level security;
alter table public.listings enable row level security;
alter table public.listing_media enable row level security;
alter table public.reviews enable row level security;
alter table public.ads enable row level security;
alter table public.team_members enable row level security;
alter table public.contact_messages enable row level security;
alter table public.audit_logs enable row level security;

-- Public read of published content; staff write.
drop policy if exists "media_read" on public.media;
create policy "media_read" on public.media for select using (true);
drop policy if exists "media_staff_write" on public.media;
create policy "media_staff_write" on public.media for all using (public.is_staff()) with check (public.is_staff());

drop policy if exists "settings_read" on public.site_settings;
create policy "settings_read" on public.site_settings for select using (true);
drop policy if exists "settings_staff_update" on public.site_settings;
create policy "settings_staff_update" on public.site_settings for update using (public.is_staff()) with check (public.is_staff());

drop policy if exists "sections_read" on public.home_sections;
create policy "sections_read" on public.home_sections for select using (enabled or public.is_staff());
drop policy if exists "sections_staff_write" on public.home_sections;
create policy "sections_staff_write" on public.home_sections for all using (public.is_staff()) with check (public.is_staff());

drop policy if exists "listings_read" on public.listings;
create policy "listings_read" on public.listings for select
  using (status = 'published' or public.is_staff() or (host_id is not null and host_id = auth.uid()));
drop policy if exists "listings_staff_write" on public.listings;
create policy "listings_staff_write" on public.listings for all using (public.is_staff()) with check (public.is_staff());

drop policy if exists "listing_media_read" on public.listing_media;
create policy "listing_media_read" on public.listing_media for select
  using (exists (select 1 from public.listings l where l.id = listing_id and (l.status = 'published' or public.is_staff())));
drop policy if exists "listing_media_staff_write" on public.listing_media;
create policy "listing_media_staff_write" on public.listing_media for all using (public.is_staff()) with check (public.is_staff());

drop policy if exists "reviews_read" on public.reviews;
create policy "reviews_read" on public.reviews for select
  using (status = 'approved' or public.is_staff() or user_id = auth.uid());
-- Signed-in travellers may submit a review; it always starts pending and unfeatured.
drop policy if exists "reviews_submit" on public.reviews;
create policy "reviews_submit" on public.reviews for insert
  with check (auth.uid() is not null and user_id = auth.uid() and status = 'pending' and featured = false and photo_media_id is null);
drop policy if exists "reviews_staff_write" on public.reviews;
create policy "reviews_staff_write" on public.reviews for all using (public.is_staff()) with check (public.is_staff());

drop policy if exists "ads_read" on public.ads;
create policy "ads_read" on public.ads for select using (
  (enabled and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at > now())) or public.is_staff());
drop policy if exists "ads_staff_write" on public.ads;
create policy "ads_staff_write" on public.ads for all using (public.is_staff()) with check (public.is_staff());

drop policy if exists "team_read" on public.team_members;
create policy "team_read" on public.team_members for select using (enabled or public.is_staff());
drop policy if exists "team_staff_write" on public.team_members;
create policy "team_staff_write" on public.team_members for all using (public.is_staff()) with check (public.is_staff());

-- Anyone may send a message; only staff can read or manage them.
drop policy if exists "contact_submit" on public.contact_messages;
create policy "contact_submit" on public.contact_messages for insert with check (status = 'new');
drop policy if exists "contact_staff_read" on public.contact_messages;
create policy "contact_staff_read" on public.contact_messages for select using (public.is_staff());
drop policy if exists "contact_staff_update" on public.contact_messages;
create policy "contact_staff_update" on public.contact_messages for update using (public.is_staff()) with check (public.is_staff());
drop policy if exists "contact_admin_delete" on public.contact_messages;
create policy "contact_admin_delete" on public.contact_messages for delete using (public.is_admin());

-- Audit log: admins read; nobody writes through the API (no insert/update/delete policies).
drop policy if exists "audit_admin_read" on public.audit_logs;
create policy "audit_admin_read" on public.audit_logs for select using (public.is_admin());

-- Cab requests: admins manage status (policy already exists in base migration), and may delete.
drop policy if exists "bookings_admin_delete" on public.bookings;
create policy "bookings_admin_delete" on public.bookings for delete using (public.is_admin());

-- ---------- storage ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 10485760, array['image/webp', 'image/jpeg', 'image/png', 'image/avif'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- Files are served through public URLs; listing and writing the bucket is staff-only.
drop policy if exists "media_bucket_staff_select" on storage.objects;
create policy "media_bucket_staff_select" on storage.objects for select using (bucket_id = 'media' and public.is_staff());
drop policy if exists "media_bucket_staff_insert" on storage.objects;
create policy "media_bucket_staff_insert" on storage.objects for insert with check (bucket_id = 'media' and public.is_staff());
drop policy if exists "media_bucket_staff_update" on storage.objects;
create policy "media_bucket_staff_update" on storage.objects for update using (bucket_id = 'media' and public.is_staff());
drop policy if exists "media_bucket_staff_delete" on storage.objects;
create policy "media_bucket_staff_delete" on storage.objects for delete using (bucket_id = 'media' and public.is_staff());
