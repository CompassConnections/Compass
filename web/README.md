# Web

This is the folder for the web application.

### Information

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