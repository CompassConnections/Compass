-- Required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm; -- Trigram matching for text search
CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; -- UUID generation (if needed)
CREATE EXTENSION IF NOT EXISTS btree_gin;
-- Additional GIN operators (if needed)

-- Supabase roles
DO
$$
    BEGIN
        IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN
            CREATE ROLE anon NOLOGIN;
        END IF;

        IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN
            CREATE ROLE authenticated NOLOGIN;
        END IF;

        IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'service_role') THEN
            CREATE ROLE service_role NOLOGIN;
        END IF;
    END
$$;

-- Grant roles to test_user so it can grant permissions
-- GRANT anon TO test_user;
-- GRANT authenticated TO test_user;
-- GRANT service_role TO test_user;