-- Make age self-updating: store the year someone was born, not how old they were the day they typed it
-- Created: 2026-08-12
--
-- `age` was entered once and then went stale — a profile filled in three years ago still claimed the
-- age of the person who filled it in. `birth_date` becomes the source of truth and `age` becomes a
-- derived cache of it.
--
-- We store the *year* and nothing finer. An exact date of birth is a credential in its own right —
-- the thing banks and support desks ask for — and no part of Compass needs one, so every birth date
-- here is the 1st of July of the birth year and the check constraint below makes that structural
-- rather than a convention: this table cannot hold anyone's real birthday, whatever a caller sends.
-- Mid-year is the anchor that minimises the error (a real birth date is on average six months either
-- side of it), so a displayed age is out by a year for at most six months around the real birthday.
--
-- Why keep the `age` column at all instead of computing it at read time: an age expression cannot be
-- a GENERATED column (it depends on `current_date`, which is not IMMUTABLE), and every read path we
-- have is `select *` — `get_profile_by_user_id()` in particular is declared `returns setof profiles`
-- and is what the browser reads a profile through. Computing age per read would mean spelling out an
-- ~85-column list in that function and re-editing it every time a profile field is added. Instead:
--
--   * a trigger recomputes `age` from `birth_date` on every write, so an edit is right immediately;
--   * `refresh_profile_ages()` bumps the rows whose birthday just passed, run once a day.
--
-- `age` is therefore never more than a day stale, every existing read, filter, index and stat keeps
-- working untouched, and nothing writes `age` by hand any more.

alter table profiles
    add column if not exists birth_date date;

alter table profiles
    drop constraint if exists profiles_birth_date_mid_year_check;
alter table profiles
    add constraint profiles_birth_date_mid_year_check
        check (birth_date is null or
               (extract(month from birth_date) = 7 and extract(day from birth_date) = 1));

-- The filters still run on `age` (see get-profiles.ts), but a birth_date index keeps the daily
-- refresh and any future date-range query off a sequential scan.
create index if not exists profiles_birth_date_idx on profiles (birth_date);

-- Full years elapsed. Kept in SQL rather than inlined so the trigger, the refresh and any ad-hoc
-- query all round the same way (`age()` counts whole years, so no birthday is ever off by one).
create or replace function profile_age(birth_date date)
    returns integer
    language sql
    stable
as
$$
select case
           when birth_date is null then null
           else extract(year from age(current_date, birth_date))::integer
           end;
$$;

-- `age` follows `birth_date` and can no longer be set independently: whichever of the two a writer
-- touches, the row ends up consistent. Rows with no birth_date keep whatever age they have — that is
-- only the handful the backfill below could not date.
create or replace function profiles_sync_age()
    returns trigger
    language plpgsql
as
$$
begin
    if new.birth_date is not null then
        new.age := profile_age(new.birth_date);
    end if;
    return new;
end;
$$;

drop trigger if exists profiles_sync_age_trigger on profiles;
create trigger profiles_sync_age_trigger
    before insert or update of birth_date, age
    on profiles
    for each row
execute function profiles_sync_age();

-- A birthday is not a profile edit. Without this guard the daily refresh below would bump
-- `last_modification_time` on every member whose birthday it is, pushing them to the top of
-- "recently updated" and making them look freshly edited to the search-alert diff. Comparing the row
-- with `age` masked out also means a genuinely no-op update stops touching the timestamp, which is
-- what the column claims to mean anyway.
create or replace function update_last_modification_time()
    returns trigger
    language plpgsql
as
$$
begin
    if to_jsonb(new) - 'age' - 'last_modification_time'
        is not distinct from to_jsonb(old) - 'age' - 'last_modification_time' then
        return new;
    end if;
    new.last_modification_time = now();
    return new;
end;
$$;

-- Run daily. Returns how many rows it moved, so the caller can log it.
create or replace function refresh_profile_ages()
    returns integer
    language plpgsql
as
$$
declare
    updated integer;
begin
    with bumped as (
        update profiles
            set age = profile_age(birth_date)
            where birth_date is not null
                and age is distinct from profile_age(birth_date)
            returning 1)
    select count(*)::integer into updated from bumped;
    return updated;
end;
$$;

-- Backfill: an age of N stated at time T means a birth date somewhere in the year ending at
-- T - N years, which straddles two birth years. Take the one that still reads back as N — that is
-- the mid-year date at or before T - N years — and every profile keeps the age it is showing today
-- while gaining the ability to move on tomorrow. `last_modification_time` is the best available
-- estimate of when the age was last stated.
--
-- Guarded on `birth_date is null` so re-running never overwrites a date someone has since entered.
-- The sync trigger then recomputes `age` from the date it just wrote, which is the whole point: a
-- profile last touched three years ago comes out of this three years older than it went in.
update profiles
set birth_date = make_date(
        extract(year from last_modification_time)::integer - age -
        case when extract(month from last_modification_time) >= 7 then 0 else 1 end,
        7, 1)
where age is not null
  and birth_date is null;

-- New functions/columns visible to PostgREST immediately (Supabase also auto-reloads on DDL).
notify pgrst, 'reload schema';
