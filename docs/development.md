# Documentation for development

> [!WARNING]  
> TODO: This document is a work in progress. Please help us improve it!

See those other useful documents as well:
- [knowledge.md](knowledge.md) for high-level architecture and design decisions.
- [README.md](../backend/api/README.md) for the backend API
- [README.md](../backend/email/README.md) for the email routines and how to set up a local server for quick email rendering
- [README.md](../web/README.md) for the frontend / web server
- [TESTING.md](TESTING.md) for testing guidance and direction

### Adding a new profile field

A profile field is any variable associated with a user profile, such as age, politics, diet, etc. You may want to add a new profile field if it helps people find better matches.

To do so, you can add code in a similar way as in [this commit](https://github.com/CompassConnections/Compass/commit/940c1f5692f63bf72ddccd4ec3b00b1443801682) for the `religion` field. If you also want people to filter by that profile field, you'll also need to add it to the search filters, as done in [this commit](https://github.com/CompassConnections/Compass/commit/a4bb184e95553184a4c8773d7896e4b570508fe5) (for the `religion` field as well). 

Note that you will also need to add a column to the `profiles` table in the dev database before running the code; you can do so via this SQL command (change the type if not `TEXT`):
```sql
ALTER TABLE profiles ADD COLUMN profile_field TEXT;
```

Store it in `add_profile_field.sql` in the [migrations](../backend/supabase/migrations) folder and run [migrate.sh](../scripts/migrate.sh) from the root folder:
```bash
./scripts/migrate.sh backend/supabase/migrations/add_profile_field.sql
```

Then sync the database types from supabase to the local files (which assist Typescript in typing):
```bash
yarn regen-types dev
```

That's it!

### Adding a new language

Adding a new language is very easy, especially with translating tools like large language models (ChatGPT, etc.) which you can use as first draft.

- Add the language to the LOCALES dictionary in [constants.ts](../common/src/constants.ts) (the key is the locale code, the value is the original language name (not in English)).
- Duplicate [fr.json](../web/messages/fr.json) and rename it to the locale code (e.g., `de.json` for German). Translate all the strings in the new file (keep the keys identical). In order to fit the bottom navigation bar on mobile, make sure the values for those keys are less than 10 characters: "nav.home", "nav.messages", "nav.more", "nav.notifs", "nav.people".
- Duplicate the [fr](../web/public/md/fr) folder and rename it to the locale code (e.g., `de` for German). Translate all the markdown files in the new folder.

That's all, no code needed!