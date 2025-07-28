# BayesBond

This repository provides the source code for BayesBond, a web application where thinkers can bond and form deep relationships. It's in active development and will hopefully be live soon.

To contribute, please submit a pull request or issue, or fill out this [form](https://forms.gle/tKnXUMAbEreMK6FC6) for suggestions and collaborations.

## Features

- 

## To Do

- [x] Authentication (user/password and Google Sign In)
- [x] Set up PostgreSQL in Production with supabase (can stick with SQLite in dev / local)
- [ ] Set up hosting (vercel)
- [ ] Set up domain name and
- [ ] Ask for detailed info per profile upon registration (intellectual interests, location, cause areas, personality type, conflict style, desired type of connection, prompt answers, gender, etc.)
- [ ] Set up page listing all the profiles
- [ ] Search through all the profile variables
- [ ] (Set up chat / direct messaging)

#### Secondary To Do

Any action item is open to anyone for collaboration, but the following ones are particularly easy to do for first-time contributors.

- [ ] Clean up terms and conditions
- [ ] Clean up privacy notice
- [ ] Clean up learn more page
- [ ] Add dark theme
- [ ] Cover with tests

## Implementation

The web app is coded in Typescript using React as front-end and prisma as back-end. It includes:

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

To ensure your authentication works properly, you'll also need to set [env vars for NextAuth.js](https://next-auth.js.org/configuration/options):

```bash
AUTH_SECRET="RANDOM_32_CHARACTER_STRING"
```

You can generate a random 32 character string for the `AUTH_SECRET` secret with this command:

```
npx auth secret
```

In the end, your entire `.env` file should look similar to this (but using _your own values_ for the env vars):

```bash
DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=..."
AUTH_SECRET="gTwLSXFeNWFRpUTmxlRniOfegXYw445pd0k6JqXd7Ag="
```

Run the following commands to set up your database and Prisma schema:

```bash
npx prisma migrate dev --name init
```

Start the development server:

```bash
npm run dev
```

Once the server is running, visit http://localhost:3000 to start using the app.