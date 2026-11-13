-- Applications to the positions listed on /careers (common/src/careers.ts).
--
-- One row per member and position: applying again replaces the earlier answers rather than adding a second
-- row, so the page can show a member what they sent and let them correct it.
--
-- `position` is free text, not an enum: the list of open positions lives in code and changes without a
-- migration, and a closed position's applications should stay readable.

create table if not exists job_applications (
  id bigint generated always as identity primary key,
  created_time timestamptz not null default now(),
  updated_time timestamptz not null default now(),
  user_id text not null references users (id) on delete cascade,
  position text not null,
  about text not null,
  plan text not null,
  rate text not null,
  availability text not null,
  constraint job_applications_user_position_key unique (user_id, position)
);

-- Applications hold pay expectations and are read only by the API's service role. The browser's Supabase
-- client is anon-only, so anything anon can read is public: enable RLS with no policy, and drop the default
-- table grants too, because TRUNCATE ignores RLS.
alter table job_applications enable row level security;

revoke all on table job_applications from anon, authenticated;

revoke all on sequence job_applications_id_seq from anon, authenticated;
