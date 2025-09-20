
[![CI](https://github.com/CompassConnections/Compass/actions/workflows/ci.yml/badge.svg)](https://github.com/CompassConnections/Compass/actions/workflows/ci.yml)
[![CD](https://github.com/CompassConnections/Compass/actions/workflows/cd.yml/badge.svg)](https://github.com/CompassConnections/Compass/actions/workflows/cd.yml)
![Vercel](https://deploy-badge.vercel.app/vercel/bayesbond)

# Compass

This repository contains the source code for [Compass](https://compassmeet.com) — an open platform for forming deep, authentic 1-on-1 connections with clarity and efficiency.

**We can’t do this alone.** Whatever your skills—coding, design, writing, moderation, marketing, or even small donations—you can make a real difference. [Contribute](https://www.compassmeet.com/support) in any way you can and help our community thrive!

## Features

- Extremely detailed profiles for deep connections
- Radically transparent: user base fully searchable
- Free, ad-free, not for profit (supported by donations)
- Created, hosted, maintained, and moderated by volunteers
- Open source
- Democratically governed

You can find a lot of interesting info in the [About page](https://www.compassmeet.com/about) and the [FAQ](https://www.compassmeet.com/faq) as well.
A detailed description of the early vision is also available in this [blog post](https://martinbraquet.com/meeting-rational) (you can disregard the parts about rationality, as Compass shifted to a more general audience).

## To Do

No contribution is too small—whether it’s changing a color, resizing a button, tweaking a font, or improving wording. Bigger contributions like adding new profile fields, building modules, or improving onboarding are equally welcome. The goal is to make the platform better step by step, and every improvement counts. If you see something that could be clearer, smoother, or more engaging, **please jump in**!

Here are some examples of things that would be very useful. If you want to help but don’t know where to start, just ask us on [Discord](https://discord.gg/8Vd7jzqjun).

- [x] Authentication (user/password and Google Sign In)
- [x] Set up PostgreSQL in Production with supabase
- [x] Set up web hosting (vercel)
- [x] Set up backend hosting (google cloud)
- [x] Ask for detailed info upon registration (location, desired type of connection, prompt answers, gender, etc.)
- [x] Set up page listing all the profiles
- [x] Search through most profile variables
- [x] Set up chat / direct messaging
- [x] Set up domain name (compassmeet.com)
- [ ] Add mobile app (React Native on Android and iOS)
- [ ] Add better onboarding (tooltips, modals, etc.)
- [ ] Add modules to learn more about each other (personality test, conflict style, love languages, etc.)
- [ ] Add modules to improve interpersonal skills (active listening, nonviolent communication, etc.)
- [ ] Add calendar integration and scheduling
- [ ] Add events (group calls, in-person meetups, etc.)

#### Secondary To Do

Everything is open to anyone for collaboration, but the following ones are particularly easy to do for first-time contributors.

- [x] Clean up learn more page
- [x] Add dark theme
- [ ] Add profile features (intellectual interests, cause areas, personality type, conflict style, etc.)
- [ ] Add filters to search through remaining profile features (politics, religion, education level, etc.)
- [ ] Cover with tests (very important, just the test template and framework are ready)
- [ ] Make the app more user-friendly and appealing (UI/UX)
- [ ] Clean up terms and conditions (convert to Markdown)
- [ ] Clean up privacy notice (convert to Markdown)
- [ ] Add other authentication methods (GitHub, Facebook, Apple, phone, etc.)
- [ ] Add email verification
- [ ] Add password reset
- [ ] Add automated welcome email
- [ ] Security audit and penetration testing
- [ ] Make `deploy-api.sh` run automatically on push to `main` branch
- [ ] Create settings page (change email, password, delete account, etc.)
- [ ] Improve [financials](web/public/md/financials.md) page (donor / acknowledgments, etc.)
- [ ] Improve loading sign (e.g., animation of a compass moving around)
- [ ] Show compatibility score in profile page

## Implementation

The web app is coded in Typescript using React as front-end. It includes:

- [Supabase](https://supabase.com/) for the PostgreSQL database
- [Google Cloud](https://console.cloud.google.com) for hosting the backend API
- [Firebase](https://firebase.google.com/) for authentication and media storage
- [Vercel](https://vercel.com/) for hosting the front-end

## Development

Below are the steps to contribute. If you have any trouble or questions, please don't hesitate to open an issue or contact us on [Discord](https://discord.gg/8Vd7jzqjun)! We're responsive and happy to help.

### Installation

Fork the [repo](https://github.com/CompassConnections/Compass) on GitHub (button in top right). Then, clone your repo and navigating into it:
```bash
git clone https://github.com/<your-username>/Compass.git
cd Compass
```

Install `opentofu`, `docker`, and `yarn`. Try running this on Linux or macOS for a faster install:
```bash
./setup.sh
```
If it doesn't work, you can install them manually (google how to install `opentofu`, `docker`, and `yarn` for your OS).

Then, install the dependencies for this project:
```bash
yarn install
```

### Environment Variables

Almost all the features will work out of the box, so you can skip this step and come back later if you need to test the following services: email, geolocation.

We can't make the following information public, for security and privacy reasons:
- Database, otherwise anyone could access all the user data (including private messages)
- Firebase, otherwise anyone could remove users or modify the media files
- Email, analytics, and location services, otherwise anyone could use our paid plan

We separate all those services between production and local development, so that you can code freely without impacting the functioning of the platform.
Contributors should use the default keys for local development. Production uses a separate environment with stricter rules and private keys that are not shared.

If you do need one of the few remaining services, you need to set them up and store your own secrets as environment variables. To do so, simply open `.env` and fill in the variables according to the instructions in the file.

### Tests

Make sure the tests pass:
```bash
yarn test tests/jest/
```
TODO: make `yarn test` run all the tests, not just the ones in `tests/jest/`.

### Running the Development Server

Start the development server:
```bash
yarn dev
```

Once the server is running, visit http://localhost:3000 to start using the app. You can sign up and visit the profiles; you should see a few synthetic profiles.

### Contributing

Now you can start contributing by making changes and submitting pull requests!

See [development.md](docs/development.md) for additional instructions, such as adding new profile features.

### Submission

Add the original repo as upstream for syncing:
```bash
git remote add upstream https://github.com/CompassConnections/Compass.git
```

Create a new branch for your changes:
```bash
git checkout -b <branch-name>
```

Make changes, then stage and commit:
```bash
git add .
git commit -m "Describe your changes"
```

Push branch to your fork:
```bash
git push origin <branch-name>
```

Finally, open a Pull Request on GitHub from your `fork/<branch-name>` → `CompassConnections/Compass` main branch.

## Acknowledgements
This project is built on top of [manifold.love](https://github.com/sipec/polylove), an open-source dating platform licensed under the MIT License. We greatly appreciate their work and contributions to open-source, which have significantly aided in the development of some core features such as direct messaging, prompts, and email notifications. We invite the community to explore and contribute to other open-source projects like manifold.love as well, especially if you're interested in functionalities that deviate from Compass' ideals of deep, intentional connections.