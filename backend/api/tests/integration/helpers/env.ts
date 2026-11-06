// Overrides anything inherited from the shell or a .env file, so these tests cannot reach a remote database.
process.env.DATABASE_URL = 'postgresql://postgres:postgres@127.0.0.1:54322/compass_integration'
process.env.NEXT_PUBLIC_FIREBASE_ENV = 'DEV'
process.env.NEXT_PUBLIC_ISOLATED_ENV = 'true'
