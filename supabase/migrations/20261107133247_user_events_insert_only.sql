-- user_events is written by the browser through the anon key (web/lib/service/analytics.ts) and read only by
-- the backend's service role. Clients may insert and nothing else: no reading, updating or deleting rows.
--
-- RLS already allows only the "anyone can insert" policy, but the table-level grants were ALL, which includes
-- TRUNCATE, and TRUNCATE ignores RLS. Cut the grants down to the one privilege clients need.

revoke all on table user_events from anon, authenticated;
grant insert on table user_events to anon;

-- `id` is an identity column, so inserts need no privilege on its sequence.
revoke all on sequence user_events_id_seq from anon, authenticated;
