create table push_subscriptions (
    id serial primary key,
    user_id TEXT references users(id) on delete cascade,
    endpoint text not null unique,
    keys jsonb not null,
    created_at timestamptz default now()
);

-- Row Level Security
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Indexes
DROP INDEX IF EXISTS user_id_idx;
CREATE INDEX user_id_idx ON push_subscriptions (user_id);

DROP INDEX IF EXISTS endpoint_idx;
CREATE INDEX endpoint_idx ON push_subscriptions (endpoint);

DROP INDEX IF EXISTS endpoint_user_id_idx;
CREATE INDEX endpoint_user_id_idx ON push_subscriptions (endpoint, user_id);