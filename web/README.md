# Web

This is the folder for the web application.

### Information

##### Setup

This is the setup for deployment on Vercel, which you only need to do if you create a new platform from scratch, not if you are contributing to Compass

Set up a Vercel account and link it to your GitHub repository.

Add the following environment variables and the ones in `.env` in the Vercel dashboard:

```bash
NEXT_PUBLIC_VERCEL=1
```

##### `next` version

The `next` version is 14.1.0, as we get the following error with 15.1.2 and above when accessing `/[username]` pages on Vercel:

```
Cannot find module 'next/dist/compiled/source-map'
Require stack:
- /var/task/node_modules/next/dist/compiled/next-server/server.runtime.prod.js
- /var/task/web/___next_launcher.cjs
Did you forget to add it to "dependencies" in `package.json`?
Node.js process exited with exit status: 1. The logs above can help with debugging the issue.
```

TODO: investigate, find a fix and upgrade.
