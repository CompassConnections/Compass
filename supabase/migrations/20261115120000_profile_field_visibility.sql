-- Per-field profile visibility (docs/profile-visibility.md).
--
-- A member chooses, field by field, who sees it: everyone, members, the people they have approved, or
-- nobody. `profiles.visibility` stays as the profile-wide default (a field may be wider or narrower
-- than it); this adds the exceptions
-- and the approvals, and closes the three places the database itself hands profile content to the anon
-- key (the profile RPC, the option join tables, the search text).

-- 1. The per-field choices -------------------------------------------------------------------------------
--
-- {"photos": "member", "neurotype": "connected", "political_beliefs": "only_me"}
-- Keys are field keys from common/src/profiles/visibility.ts (PROFILE_FIELDS), values an audience
-- (public, member, connected, only_me). Only the fields that differ from `visibility` are stored, wider or
-- narrower: an absent key follows `visibility`.
-- There is no per-section value anywhere; sections exist in the form only.

alter table profiles
    add column if not exists field_visibility jsonb not null default '{}'::jsonb;

comment on column profiles.field_visibility is 'Per-field audience exceptions, keyed by field. An absent key follows profiles.visibility.';

-- 2. Approvals ---------------------------------------------------------------------------------------------
--
-- `owner_id` lets `viewer_id` see the fields the owner set to `connected`. One-directional: it shows
-- nothing of the viewer's to the owner. A direct approval inserts 'approved'; a request inserts
-- 'requested' and the owner's approval updates it. Revoking and blocking delete the row.
-- Declining is silent: the row stays 'requested' with `decided_time` set, so the requester sees no change
-- and cannot simply ask again the next day (the API allows a new request 30 days after `decided_time`).

create table if not exists profile_access
(
    owner_id     text        not null references users (id) on delete cascade,
    viewer_id    text        not null references users (id) on delete cascade,
    status       text        not null check (status in ('requested', 'approved')),
    created_time timestamptz not null default now(),
    decided_time timestamptz,
    primary key (owner_id, viewer_id),
    constraint profile_access_not_self check (owner_id <> viewer_id)
);

create index if not exists profile_access_viewer_idx on profile_access (viewer_id) where status = 'approved';

-- It says who trusts whom, so it is read only by the API's service role. The browser's Supabase client is
-- anon-only: RLS with no policy, and the default grants dropped too, because TRUNCATE ignores RLS.
alter table profile_access
    enable row level security;

revoke all on table profile_access from anon, authenticated;

-- 3. The profile RPC ---------------------------------------------------------------------------------------
--
-- Reached with the anon key, so it cannot know who is asking and may only return what is public to
-- everyone. It returned the whole row of a public profile; it now does so only when that profile has no
-- per-field exception at all. Any exception means the row comes back as its identity columns, and the
-- client reads the profile through the API, which knows the viewer and redacts field by field. Keeping
-- the field map out of SQL is deliberate: a second copy here is a copy that drifts. A members-only
-- profile with a field set to public is one of those cases: the RPC stays closed for it, and the API
-- returns the public field.

create or replace function get_profile_by_user_id(uid text) returns setof profiles
    language plpgsql
    stable security definer
    set search_path to 'public'
as
$$
declare
    full_row     profiles;
    redacted_row profiles;
    banned       boolean;
begin
    select * into full_row from profiles where user_id = uid limit 1;
    if not found then
        return;
    end if;

    select is_banned_from_posting into banned from users where id = uid;

    if full_row.visibility <> 'member'
        and not full_row.disabled
        and not coalesce(banned, false)
        and full_row.field_visibility = '{}'::jsonb then
        -- The search vectors are built from the whole profile and are nobody's to read.
        full_row.search_text := null;
        full_row.search_tsv := null;
        return next full_row;
        return;
    end if;

    -- Fields are copied across one by one rather than nulled out of a copy, so a column added to
    -- `profiles` later is excluded by default instead of leaking until someone remembers this file.
    redacted_row.user_id := full_row.user_id;
    redacted_row.visibility := full_row.visibility;
    redacted_row.disabled := full_row.disabled;
    return next redacted_row;
end;
$$;

-- 4. The option join tables --------------------------------------------------------------------------------
--
-- `profile_interests`, `profile_causes` and `profile_work` were readable by anyone holding the anon key,
-- for any profile id — and ids are sequential, so a members-only profile's tags could be read by counting.
-- They now answer only where that field is public (its own choice, else the profile-wide default), on a
-- profile that is enabled and not banned.
-- A SECURITY DEFINER helper, because anon has no SELECT on `profiles` for the policy to read it with.
-- The API reads these tables as the service role and is not affected.

create or replace function profile_field_is_public(pid bigint, field text) returns boolean
    language sql
    stable security definer
    set search_path to 'public'
as
$$
select exists (select 1
               from profiles p
                        join users u on u.id = p.user_id
               where p.id = pid
                 and not p.disabled
                 and not coalesce(u.is_banned_from_posting, false)
                 -- The field's own choice when it has one, the profile-wide default otherwise: a
                 -- members-only profile may still have a public field, and a public one a hidden field.
                 and coalesce(p.field_visibility ->> field, p.visibility::text) = 'public');
$$;

revoke all on function profile_field_is_public(bigint, text) from public;
grant execute on function profile_field_is_public(bigint, text) to anon, authenticated, service_role;

drop policy if exists "public read" on profile_interests;
create policy "public read" on profile_interests for select using (profile_field_is_public(profile_id, 'interests'));

drop policy if exists "public read" on profile_causes;
create policy "public read" on profile_causes for select using (profile_field_is_public(profile_id, 'causes'));

drop policy if exists "public read" on profile_work;
create policy "public read" on profile_work for select using (profile_field_is_public(profile_id, 'work'));

-- 5. Keyword search ----------------------------------------------------------------------------------------
--
-- `search_text` / `search_tsv` are what a keyword search matches against, so a hidden field left in them
-- is a field anyone can test for by searching. They are now built only from the fields ordinary members
-- may read: a field set to `connected` or `only_me` is left out. `bio_text` is unchanged — it is the
-- plain-text bio the API measures and excerpts, and every reader of it checks the bio's audience itself.
-- The field keys below are the ones in PROFILE_FIELDS; keep the two in step.

create or replace function rebuild_profile_search(profile_id_param bigint) returns void
    language plpgsql
as
$_$
declare
    fv                     jsonb;
    bio_part               text;
    interests_part         text;
    causes_part            text;
    work_part              text;
    headline_part          text;
    occupation_part        text;
    occupation_title_part  text;
    company_part           text;
    university_part        text;
    city_part              text;
    country_part           text;
    born_in_location_part  text;
    raised_in_city_part    text;
    raised_in_country_part text;
    political_details_part text;
    religious_beliefs_part text;
    keywords_part          text;
    searchable             text;
begin
    select coalesce(field_visibility, '{}'::jsonb) into fv from profiles where id = profile_id_param;

    -- Bio text
    select string_agg(distinct trim(both '"' from value::text), ' ')
    into bio_part
    from profiles p,
         jsonb_path_query(p.bio, '$.**.text') as t(value)
    where p.id = profile_id_param;

    -- Interests text
    select string_agg(i.name, ' ')
    into interests_part
    from profile_interests pi
             join interests i on i.id = pi.option_id
    where pi.profile_id = profile_id_param;

    -- Causes text
    select string_agg(i.name, ' ')
    into causes_part
    from profile_causes pc
             join causes i on i.id = pc.option_id
    where pc.profile_id = profile_id_param;

    -- Work text
    select string_agg(i.name, ' ')
    into work_part
    from profile_work pw
             join work i on i.id = pw.option_id
    where pw.profile_id = profile_id_param;

    -- Direct text fields from profiles table
    select headline,
           occupation,
           occupation_title,
           company,
           university,
           city,
           country,
           born_in_location,
           raised_in_city,
           raised_in_country,
           political_details,
           religious_beliefs
    into
        headline_part, occupation_part, occupation_title_part, company_part,
        university_part, city_part, country_part, born_in_location_part,
        raised_in_city_part, raised_in_country_part, political_details_part, religious_beliefs_part
    from profiles
    where id = profile_id_param;

    -- Keywords array
    select string_agg(keyword, ' ')
    into keywords_part
    from profiles p,
         unnest(p.keywords) as keyword
    where p.id = profile_id_param;

    -- A field kept from ordinary members contributes nothing to what they can search.
    searchable := concat_ws(' ',
                            case when coalesce(fv ->> 'bio', 'member') in ('public', 'member') then bio_part end,
                            case
                                when coalesce(fv ->> 'interests', 'member') in ('public', 'member')
                                    then interests_part end,
                            case when coalesce(fv ->> 'causes', 'member') in ('public', 'member') then causes_part end,
                            case when coalesce(fv ->> 'work', 'member') in ('public', 'member') then work_part end,
                            case
                                when coalesce(fv ->> 'headline', 'member') in ('public', 'member')
                                    then headline_part end,
                            case
                                when coalesce(fv ->> 'occupation', 'member') in ('public', 'member')
                                    then concat_ws(' ', occupation_part, occupation_title_part) end,
                            case
                                when coalesce(fv ->> 'company', 'member') in ('public', 'member') then company_part end,
                            case
                                when coalesce(fv ->> 'university', 'member') in ('public', 'member')
                                    then university_part end,
                            case
                                when coalesce(fv ->> 'location', 'member') in ('public', 'member')
                                    then concat_ws(' ', city_part, country_part) end,
                            case
                                when coalesce(fv ->> 'raised_in', 'member') in ('public', 'member')
                                    then concat_ws(' ', born_in_location_part, raised_in_city_part,
                                                   raised_in_country_part) end,
                            case
                                when coalesce(fv ->> 'political_beliefs', 'member') in ('public', 'member')
                                    then political_details_part end,
                            case
                                when coalesce(fv ->> 'religion', 'member') in ('public', 'member')
                                    then religious_beliefs_part end,
                            case
                                when coalesce(fv ->> 'keywords', 'member') in ('public', 'member')
                                    then keywords_part end);

    update profiles
    set bio_text    = bio_part,
        search_text = searchable,
        search_tsv  = to_tsvector('english', searchable)
    where id = profile_id_param;
end;
$_$;

-- Same columns as before, plus `field_visibility` (hiding a field has to take it out of the index at once)
-- and `keywords` (which the function has always read but the trigger never fired on).
create or replace trigger trg_profiles_rebuild_search
    after insert or update of headline, occupation, occupation_title, company, university, city, country,
        born_in_location, raised_in_city, raised_in_country, political_details, religious_beliefs, bio,
        keywords, field_visibility
    on profiles
    for each row
execute function trg_profiles_rebuild_search();

-- 6. The feed setting ----------------------------------------------------------------------------------------
--
-- `profiles.feed_visibility` (none / basic / full) is retired: the public feed now carries whichever of
-- a profile's fields are public (docs/feed.md). The column and its enum are left in place on purpose —
-- the API version still running while this migration is applied selects the column, and older app builds
-- still send it — and can be dropped by a later migration once nothing does. The partial index that was
-- built for the old feed query no longer matches the new one, so it is dropped here; the feed reads
-- newest-first through `profiles_active_idx`.

drop index if exists profiles_feed_idx;
