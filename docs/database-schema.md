# Compass Database Schema Documentation

## Overview

This document provides comprehensive documentation for the Compass database schema, which is built on PostgreSQL using Supabase. The schema is designed to support a transparent dating platform that facilitates deep, authentic connections based on shared values, interests, and personality compatibility.

## Database Structure

The database consists of multiple interconnected tables that store user profiles, messaging data, compatibility scores, events, and other community features. All tables use appropriate indexing and Row Level Security (RLS) policies for performance and security.

## Core Tables

### Users Table

The primary table storing basic user information.

```sql
CREATE TABLE users (
    created_time TIMESTAMPTZ DEFAULT now() NOT NULL,
    data JSONB NOT NULL,
    id TEXT DEFAULT random_alphanumeric(12) NOT NULL,
    name TEXT NOT NULL,
    name_username_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('english', (name || ' '::text) || username)
    ) STORED,
    username TEXT NOT NULL,
    CONSTRAINT users_pkey PRIMARY KEY (id)
);
```

**Columns:**

- `created_time`: Timestamp when user account was created
- `data`: JSONB field containing additional user metadata
- `id`: Unique identifier for the user
- `name`: User's display name
- `name_username_vector`: Generated tsvector for full-text search on name and username
- `username`: Unique username for the user

**Indexes:**

- Primary key on `id`
- Index on `username`
- Index on `created_time`
- Index on `name`
- GIN index on `name_username_vector` for full-text search

### Profiles Table

Contains detailed profile information for users.

```sql
CREATE TABLE profiles (
    age INTEGER NULL,
    bio JSONB,
    bio_length integer null,
    born_in_location TEXT,
    city TEXT,
    city_latitude NUMERIC(9, 6),
    city_longitude NUMERIC(9, 6),
    comments_enabled BOOLEAN DEFAULT TRUE NOT NULL,
    company TEXT,
    country TEXT,
    created_time TIMESTAMPTZ DEFAULT now() NOT NULL,
    diet TEXT[],
    disabled BOOLEAN DEFAULT FALSE NOT NULL,
    drinks_per_month INTEGER,
    education_level TEXT,
    ethnicity TEXT[],
    gender TEXT,
    geodb_city_id TEXT,
    has_kids INTEGER,
    headline TEXT,
    height_in_inches float4,
    id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL,
    image_descriptions jsonb,
    is_smoker BOOLEAN,
    last_modification_time TIMESTAMPTZ DEFAULT now() NOT NULL,
    looking_for_matches BOOLEAN DEFAULT TRUE NOT NULL,
    allow_direct_messaging BOOLEAN DEFAULT TRUE NOT NULL,
    allow_interest_indicating BOOLEAN DEFAULT TRUE NOT NULL,
    occupation TEXT,
    occupation_title TEXT,
    photo_urls TEXT[],
    pinned_url TEXT,
    political_beliefs TEXT[],
    political_details TEXT,
    pref_age_max INTEGER NULL,
    pref_age_min INTEGER NULL,
    pref_gender TEXT[],
    pref_relation_styles TEXT[],
    pref_romantic_styles TEXT[],
    raised_in_city TEXT,
    raised_in_country TEXT,
    raised_in_geodb_city_id TEXT,
    raised_in_lat NUMERIC(9, 6),
    raised_in_lon NUMERIC(9, 6),
    raised_in_radius INTEGER,
    raised_in_region_code TEXT,
    referred_by_username TEXT,
    region_code TEXT,
    relationship_status TEXT[],
    religion TEXT[],
    religious_belief_strength INTEGER,
    religious_beliefs TEXT,
    twitter TEXT,
    university TEXT,
    user_id TEXT NOT NULL,
    visibility profile_visibility DEFAULT 'member'::profile_visibility NOT NULL,
    wants_kids_strength INTEGER DEFAULT 0,
    website TEXT,
    CONSTRAINT profiles_pkey PRIMARY KEY (id)
);
```

**Columns:**

- `age`: User's age
- `bio`: JSONB field containing detailed biography information
- `bio_length`: Length of biography text
- `born_in_location`: Location where user was born
- `city`: Current city of residence
- `city_latitude`/`city_longitude`: Geographic coordinates of current city
- `comments_enabled`: Whether comments are enabled on profile
- `company`: Current company user works for
- `country`: Current country of residence
- `created_time`: Timestamp when profile was created
- `diet`: Array of dietary preferences
- `disabled`: Whether profile is disabled
- `drinks_per_month`: Number of alcoholic drinks consumed per month
- `education_level`: Highest level of education achieved
- `ethnicity`: Array of ethnic backgrounds
- `gender`: Gender identity
- `geodb_city_id`: ID of city in geolocation database
- `has_kids`: Whether user has children (0 = no, 1 = yes)
- `headline`: Short headline describing user
- `height_in_inches`: User's height in inches
- `id`: Auto-generated primary key
- `image_descriptions`: JSONB containing descriptions of uploaded images
- `is_smoker`: Whether user smokes
- `last_modification_time`: Timestamp of last profile update
- `looking_for_matches`: Whether user is actively seeking connections
- `allow_direct_messaging`: Whether direct messaging is allowed
- `allow_interest_indicating`: Whether other users can indicate interest
- `occupation`: User's occupation
- `occupation_title`: Specific job title
- `photo_urls`: Array of URLs to uploaded photos
- `pinned_url`: URL to pinned photo
- `political_beliefs`: Array of political affiliations
- `political_details`: Detailed political views
- `pref_age_max`/`pref_age_min`: Preferred age range for matches
- `pref_gender`: Array of preferred genders for matches
- `pref_relation_styles`: Array of preferred relationship styles
- `pref_romantic_styles`: Array of preferred romantic styles
- `raised_in_city`/`country`: Location where user was raised
- `raised_in_geodb_city_id`: ID of birth city in geolocation database
- `raised_in_lat`/`lon`: Geographic coordinates of birth city
- `raised_in_radius`: Radius around birth location
- `raised_in_region_code`: Region code of birth location
- `referred_by_username`: Username of referring user
- `region_code`: Current region code
- `relationship_status`: Array indicating relationship preferences
- `religion`: Array of religious affiliations
- `religious_belief_strength`: Strength of religious beliefs (scale)
- `religious_beliefs`: Detailed religious views
- `twitter`: Twitter handle
- `university`: University attended
- `user_id`: Foreign key to users table
- `visibility`: Visibility level ('public' or 'member')
- `wants_kids_strength`: Desire for children (0-10 scale)
- `website`: Personal website URL

**Relationships:**

- Foreign key constraint on `user_id` referencing `users.id` with CASCADE delete

**Indexes:**

- Primary key on `id`
- Index on `user_id`
- Unique index on `user_id`
- Index on `last_modification_time`
- Index on `bio_length`
- Spatial indexes on latitude/longitude coordinates
- GIN indexes on array fields (diet, political_beliefs, etc.)
- Indexes on various profile attributes for filtering

**Triggers:**

- Automatically updates `last_modification_time` on profile updates

### Private Users Table

Stores sensitive user information with restricted access.

```sql
CREATE TABLE private_users (
  data JSONB NOT NULL,
  id TEXT NOT NULL,
  CONSTRAINT private_users_pkey PRIMARY KEY (id)
);
```

**Columns:**

- `data`: JSONB field containing private user data
- `id`: Primary key matching user ID

**Relationships:**

- Foreign key constraint on `id` referencing `users.id` with CASCADE delete

**Security:**

- Row Level Security (RLS) policies restrict access to user's own data only

## Messaging Tables

### Private User Messages Table

Stores direct messages between users.

```sql
CREATE TABLE private_user_messages (
  channel_id TEXT NOT NULL,
  content TEXT NOT NULL,
  created_time TIMESTAMPTZ DEFAULT now () NOT NULL,
  data JSONB NOT NULL,
  id TEXT NOT NULL,
  reply_id TEXT,
  sender_id TEXT NOT NULL,
  updated_time TIMESTAMPTZ DEFAULT now () NOT NULL,
  CONSTRAINT private_user_messages_pkey PRIMARY KEY (id)
);
```

**Columns:**

- `channel_id`: Identifier for the message thread/channel
- `content`: Message text content
- `created_time`: Timestamp when message was sent
- `data`: JSONB field for additional message metadata
- `id`: Unique message identifier
- `reply_id`: Identifier of message being replied to (if applicable)
- `sender_id`: ID of user who sent the message
- `updated_time`: Timestamp of last message update

**Indexes:**

- Primary key on `id`
- Indexes on `channel_id`, `sender_id`, and timestamps for efficient querying

### Private User Message Channels Table

Manages message threads/channels between users.

```sql
CREATE TABLE private_user_message_channels (
  created_time TIMESTAMPTZ DEFAULT now () NOT NULL,
  data JSONB NOT NULL,
  id TEXT NOT NULL,
  CONSTRAINT private_user_message_channels_pkey PRIMARY KEY (id)
);
```

## Compatibility System Tables

### Compatibility Questions Table

Stores predefined compatibility questions for matching users.

```sql
CREATE TABLE compatibility_prompts (
  id TEXT NOT NULL,
  created_time TIMESTAMPTZ NOT NULL DEFAULT now (),
  question TEXT NOT NULL,
  explanation TEXT NOT NULL,
  importance_score INTEGER NOT NULL DEFAULT 1,
  category TEXT,
  is_required BOOLEAN NOT NULL DEFAULT FALSE,
  display_order INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT compatibility_prompts_pkey PRIMARY KEY (id)
);
```

### Compatibility Answers Table

Stores user responses to compatibility questions.

```sql
CREATE TABLE compatibility_answers (
  id TEXT NOT NULL,
  created_time TIMESTAMPTZ NOT NULL DEFAULT now (),
  prompt_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  answer TEXT,
  importance INTEGER NOT NULL,
  explanation TEXT,
  CONSTRAINT compatibility_answers_pkey PRIMARY KEY (id)
);
```

### Compatibility Scores Table

Pre-calculated compatibility scores between users.

```sql
CREATE TABLE compatibility_scores (
  user_id_1 TEXT NOT NULL,
  user_id_2 TEXT NOT NULL,
  score NUMERIC(5, 4) NOT NULL,
  updated_time TIMESTAMPTZ NOT NULL DEFAULT now (),
  CONSTRAINT compatibility_scores_pkey PRIMARY KEY (user_id_1, user_id_2)
);
```

## Social Features Tables

### Profile Likes Table

Tracks when users "like" other profiles.

```sql
CREATE TABLE profile_likes (
  user_id TEXT NOT NULL,
  target_user_id TEXT NOT NULL,
  created_time TIMESTAMPTZ NOT NULL DEFAULT now (),
  CONSTRAINT profile_likes_pkey PRIMARY KEY (user_id, target_user_id)
);
```

### Profile Ships Table

Tracks "ships" (strong compatibility matches) between users.

```sql
CREATE TABLE profile_ships (
  user_id TEXT NOT NULL,
  target_user_id TEXT NOT NULL,
  created_time TIMESTAMPTZ NOT NULL DEFAULT now (),
  CONSTRAINT profile_ships_pkey PRIMARY KEY (user_id, target_user_id)
);
```

### Profile Stars Table

Allows users to "star" favorite profiles.

```sql
CREATE TABLE profile_stars (
  user_id TEXT NOT NULL,
  target_user_id TEXT NOT NULL,
  created_time TIMESTAMPTZ NOT NULL DEFAULT now (),
  CONSTRAINT profile_stars_pkey PRIMARY KEY (user_id, target_user_id)
);
```

### Profile Comments Table

Stores comments on user profiles.

```sql
CREATE TABLE profile_comments (
  id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  on_user_id TEXT NOT NULL,
  content TEXT NOT NULL,
  created_time TIMESTAMPTZ NOT NULL DEFAULT now (),
  updated_time TIMESTAMPTZ NOT NULL DEFAULT now (),
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT profile_comments_pkey PRIMARY KEY (id)
);
```

## Events System Tables

### Events Table

Stores community events.

```sql
CREATE TABLE events (
  id TEXT NOT NULL,
  created_time TIMESTAMPTZ NOT NULL DEFAULT now (),
  creator_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  location TEXT,
  location_lat NUMERIC(9, 6),
  location_lng NUMERIC(9, 6),
  max_attendees INTEGER,
  visibility TEXT NOT NULL DEFAULT 'public',
  data JSONB NOT NULL,
  CONSTRAINT events_pkey PRIMARY KEY (id)
);
```

### User Events Table

Tracks user attendance at events.

```sql
CREATE TABLE user_events (
  user_id TEXT NOT NULL,
  event_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'going',
  created_time TIMESTAMPTZ NOT NULL DEFAULT now (),
  CONSTRAINT user_events_pkey PRIMARY KEY (user_id, event_id)
);
```

## Notification System Tables

### User Notifications Table

Stores user notifications.

```sql
CREATE TABLE user_notifications (
  id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  data JSONB NOT NULL,
  created_time TIMESTAMPTZ NOT NULL DEFAULT now (),
  updated_time TIMESTAMPTZ NOT NULL DEFAULT now (),
  seen BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT user_notifications_pkey PRIMARY KEY (id)
);
```

## Moderation Tables

### Reports Table

Stores user reports for moderation.

```sql
CREATE TABLE reports (
  id TEXT NOT NULL,
  created_time TIMESTAMPTZ NOT NULL DEFAULT now (),
  user_id TEXT NOT NULL,
  target_id TEXT NOT NULL,
  target_type TEXT NOT NULL,
  reason TEXT NOT NULL,
  comment TEXT,
  dismissed BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT reports_pkey PRIMARY KEY (id)
);
```

## Search and Filtering

The database includes extensive indexing for efficient searching and filtering:

1. **Full-text Search**:
   - tsvector columns for name, bio, and other text fields
   - GIN indexes for efficient full-text queries

2. **Spatial Indexes**:
   - Latitude/longitude indexes for location-based searches
3. **Array Indexes**:
   - GIN indexes on array fields (diet, political beliefs, etc.)
4. **Range Indexes**:
   - B-tree indexes on numeric ranges (age, compatibility scores)

## Security

### Row Level Security (RLS)

All tables implement RLS policies to ensure data privacy:

- **Public Read**: Anonymous users can read public profiles
- **Private Access**: Users can only access their own private data
- **Member Access**: Authenticated users have broader access

### Authentication

User authentication is managed through Firebase Auth, with user IDs synchronized between Firebase and the database.

## Performance Optimization

### Indexing Strategy

1. **Primary Keys**: All tables have primary key constraints with automatic indexes
2. **Foreign Keys**: Indexed foreign key relationships for join performance
3. **Query Patterns**: Indexes optimized for common query patterns (recent activity, filtering, searching)
4. **Composite Indexes**: Multi-column indexes for complex filtering scenarios

### Caching Considerations

- Timestamp-based caching invalidation using `last_modification_time`
- Materialized views for expensive computed fields
- Strategic denormalization for frequently accessed data

## Data Integrity

### Constraints

1. **Foreign Key Constraints**: Maintain referential integrity between related tables
2. **Check Constraints**: Validate data correctness at the database level
3. **Unique Constraints**: Prevent duplicate records where inappropriate
4. **Not Null Constraints**: Ensure required fields are always populated

### Triggers

1. **Timestamp Updates**: Automatic updating of modification timestamps
2. **Search Index Updates**: Real-time updates to full-text search indexes
3. **Data Validation**: Pre-insert/update validation of data consistency

## Migration Strategy

Database schema changes are managed through migration files in `/backend/supabase/migrations/` with the following naming convention:

- `YYYYMMDD_description.sql` for major changes
- Sequential numbering ensures proper application order

## Backup and Recovery

Regular database backups are performed with:

- Point-in-time recovery capabilities
- Cross-region replication for disaster recovery
- Automated backup retention policies

## Monitoring

Database performance is monitored through:

- Query performance analysis
- Index usage statistics
- Connection pool utilization
- Storage capacity tracking

---

_Last Updated: March 2026_
