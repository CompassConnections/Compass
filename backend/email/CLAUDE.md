# backend/email

React Email templates + send helpers. Templates render to HTML; Resend delivers them.

See [README.md](README.md) for the dev preview server (`yarn dev` → http://localhost:3001) and
[knowledge.md](knowledge.md) for the detailed walkthrough. Cross-package context is in the
[root CLAUDE.md](../../CLAUDE.md).

## Layout

```
backend/email/
├── emails/
│   ├── new-message.tsx, new-match.tsx, new-endorsement.tsx, welcome.tsx, ...
│   │       One React component per email. Default-exported, with previewProps for the dev server.
│   ├── functions/
│   │   ├── helpers.tsx       sendNewEndorsementEmail, sendWelcomeEmail, ...  ← import these from API
│   │   ├── send-email.ts     Low-level Resend wrapper
│   │   ├── create-emails.ts  Bulk creation helper
│   │   └── mock.ts, send-test-email.ts
│   ├── utils.tsx             Shared layout / styling components
│   └── static/               Image assets (only used by the dev preview server)
└── tests/
```

## Adding a new email

1. Create `emails/<name>.tsx` exporting a React component as default. Use
   `@react-email/components` primitives for email-safe HTML.
2. Add `previewProps` so the dev preview server renders it without real data.
3. Add a `send<Name>Email(...)` helper in `emails/functions/helpers.tsx`. API handlers call this helper, not
   the template directly.
4. Trigger from a backend handler:
   ```ts
   import {sendNewEndorsementEmail} from 'email/functions/helpers'
   await sendNewEndorsementEmail(privateUser, creator, onUser, text)
   ```

## Build / test

```bash
yarn --cwd=backend/email typecheck
yarn --cwd=backend/email lint[-fix]
yarn --cwd=backend/email test
```

You typically don't need to start the email dev preview server yourself — the human runs it when iterating
on a template.
