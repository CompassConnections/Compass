-- user_notifications was still readable with the anon key, so anyone could pull every member's
-- notifications, the same data the websocket topic `user-notifications/<uid>` is now restricted to
-- its owner for. The web reads them through the `get-notifications` endpoint and every write comes
-- from the service-role backend, so nothing depends on the client grant.
--
-- The revoke is what closes this. The policy name is a best guess, in case prod has one: it does not
-- matter if it is named differently, as a policy cannot grant what the role has no privilege for.

drop policy if exists "public read" on user_notifications;

revoke select on table user_notifications from anon, authenticated;

notify pgrst, 'reload schema';
