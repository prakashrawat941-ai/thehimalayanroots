-- Critical booking security hardening.
-- Booking totals and listing metadata are derived from the published catalogue in PostgreSQL.
-- Clients must use create_booking(); direct INSERTs are intentionally denied.

drop policy if exists "bookings_insert_own" on public.bookings;

create or replace function public.create_booking(
  p_listing_kind text,
  p_listing_slug text,
  p_start_date date,
  p_end_date date,
  p_guests integer,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_user_id uuid := auth.uid();
  v_listing public.listings%rowtype;
  v_total numeric;
  v_nights integer;
  v_max_guests integer;
  v_capacity_text text;
  v_booking_id uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  if p_listing_kind not in ('homestays', 'experiences', 'trekking', 'workation')
     or p_listing_slug is null
     or char_length(p_listing_slug) > 120 then
    raise exception 'Invalid listing' using errcode = '22023';
  end if;

  if p_start_date is null or p_end_date is null
     or p_start_date < current_date
     or p_end_date < p_start_date
     or (p_end_date - p_start_date) > 365 then
    raise exception 'Invalid booking dates' using errcode = '22023';
  end if;

  if p_guests is null or p_guests < 1 or p_guests > 30 then
    raise exception 'Guest count must be between 1 and 30' using errcode = '22023';
  end if;

  if p_notes is not null and char_length(p_notes) > 1000 then
    raise exception 'Booking notes are too long' using errcode = '22023';
  end if;

  select * into v_listing
  from public.listings
  where kind = p_listing_kind
    and slug = p_listing_slug
    and status = 'published'
  for share;

  if not found then
    raise exception 'Listing is not available for booking' using errcode = 'P0002';
  end if;

  -- Enforce capacity for every listing carrying homestay capacity metadata,
  -- including workation listings that embed homestay details.
  v_capacity_text := v_listing.details #>> '{homestay,maxGuests}';
  if v_capacity_text is not null then
    if v_capacity_text !~ '^[0-9]+$' then
      raise exception 'Listing capacity metadata is invalid' using errcode = '22023';
    end if;

    v_max_guests := v_capacity_text::integer;
    if v_max_guests < 1 or p_guests > v_max_guests then
      raise exception 'Guest count exceeds the listing capacity' using errcode = '22023';
    end if;
  end if;

  v_nights := greatest(p_end_date - p_start_date, 1);

  if v_listing.price_unit = 'night' then
    v_total := v_listing.price::numeric * v_nights;
  elsif v_listing.price_unit = 'person' then
    v_total := v_listing.price::numeric * p_guests;
  elsif v_listing.price_unit = 'free' then
    v_total := 0;
  else
    raise exception 'Listing has an unsupported price unit' using errcode = '22023';
  end if;

  if v_total < 0 or v_total > 2147483647 then
    raise exception 'Calculated booking total is outside the supported range' using errcode = '22003';
  end if;

  insert into public.bookings (
    user_id, listing_kind, listing_slug, listing_title,
    start_date, end_date, guests, total_inr, status, notes
  ) values (
    v_user_id, v_listing.kind, v_listing.slug, v_listing.title,
    p_start_date, p_end_date, p_guests, v_total::integer, 'pending', nullif(btrim(p_notes), '')
  )
  returning id into v_booking_id;

  return v_booking_id;
end;
$$;

revoke all on function public.create_booking(text, text, date, date, integer, text) from public, anon, authenticated;
grant execute on function public.create_booking(text, text, date, date, integer, text) to authenticated;

-- Enforce the booking state machine in the database, including direct REST/API updates.
create or replace function public.guard_booking_update()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if new.id is distinct from old.id
     or new.user_id is distinct from old.user_id
     or new.listing_kind is distinct from old.listing_kind
     or new.listing_slug is distinct from old.listing_slug
     or new.listing_title is distinct from old.listing_title
     or new.start_date is distinct from old.start_date
     or new.end_date is distinct from old.end_date
     or new.guests is distinct from old.guests
     or new.total_inr is distinct from old.total_inr
     or new.notes is distinct from old.notes
     or new.created_at is distinct from old.created_at then
    raise exception 'Booking details cannot be changed after creation';
  end if;

  if new.status is not distinct from old.status then
    return new;
  end if;

  if public.is_admin() then
    if (old.status = 'pending' and new.status in ('confirmed', 'cancelled'))
       or (old.status = 'confirmed' and new.status in ('completed', 'cancelled')) then
      return new;
    end if;
    raise exception 'Invalid booking status transition: % -> %', old.status, new.status;
  end if;

  if new.status = 'cancelled' and old.status in ('pending', 'confirmed') then
    return new;
  end if;

  raise exception 'You can only cancel your own pending or confirmed booking';
end;
$$;
