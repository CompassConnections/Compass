-- deleted_users took inserts from anyone holding the anon key, which let a visitor write fake rows
-- into the account-deletion reasons. The only writer is `delete-me`, through the service-role
-- backend, which RLS does not apply to.

drop policy if exists "anyone can insert" on deleted_users;

revoke insert on table deleted_users from anon, authenticated;

notify pgrst, 'reload schema';
