
[![CI](https://github.com/CompassMeet/Compass/actions/workflows/ci.yml/badge.svg)](https://github.com/CompassMeet/Compass/actions/workflows/ci.yml)
[![CD](https://github.com/CompassMeet/Compass/actions/workflows/cd.yml/badge.svg)](https://github.com/CompassMeet/Compass/actions/workflows/cd.yml)
![Vercel](https://deploy-badge.vercel.app/vercel/bayesbond)

# Compass

This repository provides the source code for [Compass](https://compassmeet.com), a web application where rational thinkers can bond and form deep 1-1 relationships in a fully transparent and efficient way. It just got released—please share it with anyone who would benefit from it!

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
- [x] (Set up chat / direct messaging)
- [x] Set up domain name (https://compassmeet.com)

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

Below are all the steps to contribute. If you have any trouble or questions, please don't hesitate to open an issue or contact us on [Discord](https://discord.gg/8Vd7jzqjun)!

### Installation

Clone the repo and navigating into it:
```bash
git clone git@github.com:CompassMeet/Compass.git
cd Compass
```

Install `opentofu`, `docker`, and `yarn`. Try running this on Linux or macOS for a faster install:
```bash
./setup.sh
```

Install the dependencies:
```bash
yarn install
```

### Environment Variables

Configure your database connection via an environment variable. Create an `.env` file:
```bash
cp .env.example .env
```

To ensure your authentication works properly, you'll also need to set the `AUTH_SECRET`. You can generate such a random 32-character string with:
```bash
npx auth secret
```

In the end, your `.env` file should look similar to this (but using _your own values_ for the secret):
```bash
DATABASE_URL="postgresql://postgres:password@localhost:5432/compass"
AUTH_SECRET="gTwLSXFeNWFRpUTmxlRniOfegXYw445pd0k6JqXd7Ag="
```

### Installing PostgreSQL

Run the following commands to set up your local development database and Prisma schema. Run only the section that corresponds to your operating system.

On macOS:
```bash
brew install postgresql
brew services start postgresql
```

On Linux:
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
````

On Windows, you can download PostgreSQL from the [official website](https://www.postgresql.org/download/windows/).

### Database Initialization

Create a database named `compass` and set the password for the `postgres` user:
```bash
sudo -u postgres psql
ALTER USER postgres WITH PASSWORD 'password';  
\q
```

Create the database
```bash
npx prisma generate
npx prisma db push
npx prisma db seed
```
Note that your local database will be made of synthetic data, not real users. This is fine for development and testing.

### Tests

Make sure the tests pass:
```bash
yarn test
```

### Running the Development Server

Start the development server:
```bash
yarn dev
```

Once the server is running, visit http://localhost:3000 to start using the app. You can sign up and visit the profiles; you should see 5 synthetic profiles.

Now you can start contributing by making changes and submitting pull requests!

See [development.md](docs/development.md) for additional instructions, such as adding new profile features.

# Acknowledgements
This project is built on top of [manifold.love](github.com/sipec/polylove), an open-source dating platform licensed under the MIT License. We greatly appreciate their work and contributions to open-source, which have significantly aided in the development of some core features such as direct messaging, prompts, and email notifications. We invite the community to explore and contribute to other open-source projects like manifold.love as well, especially if you're interested in functionalities that deviate from Compass' ideals of deep, intentional connections.