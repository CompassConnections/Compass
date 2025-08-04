# BayesBond

This repository provides the source code for [BayesBond](https://bayesbond.vercel.app), a web application where rational thinkers can bond and form deep 1-1 
relationships in a fully transparent and efficient way. It just got released—please share it with anyone who would benefit from it!

To contribute, please submit a pull request or issue, or fill out this [form](https://forms.gle/tKnXUMAbEreMK6FC6) for suggestions and collaborations.

## Features

- Extremely detailed profiles for deep connections
- Radically transparent: user base fully searchable
- Free, ad-free, not for profit
- Supported by donation
- Open source
- Democratically governed

The full description is available [here](https://martinbraquet.com/meeting-rational).

## To Do

- [x] Authentication (user/password and Google Sign In)
- [x] Set up PostgreSQL in Production with supabase or prisma console (can stick with SQLite in dev / local)
- [x] Set up hosting (vercel)
- [x] Ask for detailed info per profile upon registration (intellectual interests, location, cause areas, personality type, conflict style, desired type of connection, prompt answers, gender, etc.)
- [x] Set up page listing all the profiles
- [x] Search through all the profile variables
- [ ] (Set up chat / direct messaging)
- [ ] Set up domain name (https://bayesbond.com)

#### Secondary To Do

Any action item is open to anyone for collaboration, but the following ones are particularly easy to do for first-time contributors.

- [ ] Clean up terms and conditions
- [ ] Clean up privacy notice
- [ ] Clean up learn more page
- [x] Add dark theme
- [ ] Cover with tests (almost nothing is covered right now)

## Implementation

The web app is coded in Typescript using React as front-end and Prisma as back-end. It includes:

- [NextAuth.js v4](https://next-auth.js.org/)
- [Prisma Postgres](https://www.prisma.io/postgres)
- [Prisma ORM](https://www.prisma.io/orm)
- Vercel

## Development

After cloning the repo and navigating into it, install dependencies:

```
npm install
```

You now need to configure your database connection via an environment variable.

First, create an `.env` file:

```bash
cp .env.example .env
```

To ensure your authentication works properly, you'll also need to set the `AUTH_SECRET` [env var for NextAuth.js]
(https://next-auth.js.org/configuration/options). You can generate such a random 32-character string with:
```bash
npx auth secret
```

In the end, your entire `.env` file should look similar to this (but using _your own values_ for the env vars):
```bash
DATABASE_URL="file:./dev.db"
AUTH_SECRET="gTwLSXFeNWFRpUTmxlRniOfegXYw445pd0k6JqXd7Ag="
```

Run the following commands to set up your local development database and Prisma schema:
```bash
npx prisma migrate dev --name init
```
Note that your local database will be made of synthetic data, not real users. This is fine for development and testing.

Start the development server:

```bash
npm run dev
```

Once the server is running, visit http://localhost:3000 to start using the app. Now you can start contributing by 
making changes and submitting pull requests!

See [development.md](docs/development.md) for additional instructions, such as adding new profile features.