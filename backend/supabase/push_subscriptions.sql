create table push_subscriptions (
    id serial primary key,
    user_id TEXT references users(id), -- optional if per-user
    endpoint text not null unique,
    keys jsonb not null,
    created_at timestamptz default now()
);

-- Row Level Security
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
