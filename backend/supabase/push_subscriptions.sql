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
CREATE INDEX IF not exists user_id_idx ON push_subscriptions (user_id);

CREATE INDEX IF not exists endpoint_idx ON push_subscriptions (endpoint);

CREATE INDEX IF not exists endpoint_user_id_idx ON push_subscriptions (endpoint, user_id);