BEGIN;
\i backend/supabase/functions.sql
\i backend/supabase/firebase.sql
\i backend/supabase/profiles.sql
\i backend/supabase/users.sql
\i backend/supabase/private_user_message_channels.sql
\i backend/supabase/private_user_message_channel_members.sql
\i backend/supabase/private_users.sql
\i backend/supabase/private_user_messages.sql
\i backend/supabase/private_user_seen_message_channels.sql
\i backend/supabase/compatibility_answers_free.sql
\i backend/supabase/profile_comments.sql
\i backend/supabase/compatibility_answers.sql
\i backend/supabase/profile_likes.sql
\i backend/supabase/compatibility_prompts.sql
\i backend/supabase/profile_ships.sql
\i backend/supabase/profile_stars.sql
\i backend/supabase/user_waitlist.sql
\i backend/supabase/user_events.sql
\i backend/supabase/user_notifications.sql
\i backend/supabase/functions_others.sql
\i backend/supabase/reports.sql
\i backend/supabase/bookmarked_searches.sql
COMMIT;
