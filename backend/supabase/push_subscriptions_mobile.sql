create table push_subscriptions_mobile (
    id serial primary key,
    user_id text not null,
    token text not null unique,
    platform text not null, -- 'android' or 'ios'
    created_at timestamptz default now(),
    constraint push_subscriptions_mobile_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
);

-- Row Level Security
ALTER TABLE push_subscriptions_mobile ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF not exists user_id_idx ON push_subscriptions_mobile (user_id);

CREATE INDEX IF not exists platform_idx ON push_subscriptions_mobile (platform);

CREATE INDEX IF not exists platform_user_id_idx ON push_subscriptions_mobile (platform, user_id);