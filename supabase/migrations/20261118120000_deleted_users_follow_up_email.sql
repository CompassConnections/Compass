-- One follow-up email, asked for on the way out.
--
-- A member who deletes their account because they found someone on Compass may tick "email me once in
-- a few months to ask how it's going". Their address is kept here for that single message and for
-- nothing else; it is null for everyone who did not tick the box, which is everyone by default.
-- `follow_up_sent_time` is set when the message goes out, at which point the address is cleared.
--
-- The table has row level security on and no policies, so neither column is readable through
-- PostgREST.
alter table deleted_users
  add column if not exists follow_up_email text,
  add column if not exists follow_up_sent_time timestamptz;
