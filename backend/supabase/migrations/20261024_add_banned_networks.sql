-- Migration: add_banned_networks
-- Created: 2026-10-24
--
-- Networks and devices that confirmed abusers signed up from. A new signup matching one is held for
-- review (or, on a device match, locked out) — see backend/shared/src/moderation/banned-networks.ts.
--
-- Rows come from two places:
-- - `ban-user` with reason `confirmed_abuse` adds the banned account's signup IP and device token,
--   with `source_user_id` set, and removes them again when that ban is lifted or downgraded.
-- - Hand-added entries (`source_user_id` null, a `note` saying why). The first of these replace the
--   list that used to be hardcoded in backend/api/src/create-user-and-profile.ts.
--
-- IPv4 is stored as the exact /32, IPv6 as the /64 around the address: mobile carriers hand each
-- device a /64 and rotate the rest, so the exact address is never seen twice.

create table if not exists banned_networks
(
    id             bigint generated always as identity primary key,

    network        cidr,
    device_token   text,

    -- The banned account this row was taken from. Null for hand-added entries.
    source_user_id text references users (id) on delete set null,

    note           text,

    created_at     timestamptz not null default now(),

    -- Null = never. Addresses get reassigned, so rows copied from a ban expire (see
    -- BANNED_IP_TTL_DAYS); device tokens do not.
    expires_at     timestamptz,

    constraint banned_networks_one_identifier
        check ((network is null) <> (device_token is null))
);

create index if not exists banned_networks_network
    on banned_networks using gist (network inet_ops);

create index if not exists banned_networks_device_token
    on banned_networks (device_token)
    where device_token is not null;

create index if not exists banned_networks_source_user_id
    on banned_networks (source_user_id)
    where source_user_id is not null;

-- Only the API's service-role connection reads or writes this.
alter table banned_networks
    enable row level security;

revoke all on banned_networks from anon, authenticated;

-- The list previously hardcoded in create-user-and-profile.ts, plus 197.211.63.217 and 198.57.27.9.
insert into banned_networks (network, note)
values ('24.176.214.250/32', 'Hand-curated repeat abuser'),
       ('2607:fb90:bd95:dbcd::/64', 'Hand-curated repeat abuser'),
       ('2607:fb91:389:ddd0::/64', 'Hand-curated repeat abuser'),
       ('2607:fb90:ed9a:4c8f::/64', 'Hand-curated repeat abuser'),
       ('2607:fb90:bd36:517a::/64', 'Hand-curated repeat abuser'),
       ('197.211.63.217/32', 'Hand-added 2026-10-24'),
       ('198.57.27.9/32', 'Hand-added 2026-10-27: public proxy (GlobalTeleHost, AS62563)');

insert into banned_networks (device_token, note)
values ('fa807d664415', 'Hand-curated repeat abuser'),
       ('dcf208a11839', 'Hand-curated repeat abuser'),
       ('bbf18707c15d', 'Hand-curated repeat abuser'),
       ('4c2d15a6cc0c', 'Hand-curated repeat abuser'),
       ('0da6b4ea79d3', 'Hand-curated repeat abuser');
