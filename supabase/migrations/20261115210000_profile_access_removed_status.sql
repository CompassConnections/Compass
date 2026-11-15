-- A third state for `profile_access.status`: 'removed' (docs/profile-visibility.md).
--
-- Taking someone out of your circle used to delete their row. It now keeps it as 'removed', which is what
-- lets the API tell a first addition (the other person is notified, emailed and pushed) from putting back
-- someone who was just taken out (they are not). Without that, adding and removing in a loop could be
-- used to send a member a stream of messages. A 'removed' row counts as not in the circle everywhere:
-- only 'approved' opens the fields kept for it. Blocking still deletes the row.
--
-- A separate migration rather than an edit to 20261115120000: that one was already applied to dev with the
-- two-value check.

alter table profile_access
  drop constraint if exists profile_access_status_check;

alter table profile_access
  add constraint profile_access_status_check check (status in ('requested', 'approved', 'removed'));
