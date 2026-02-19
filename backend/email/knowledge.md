# Email Knowledge

## Overview

The email module provides React Email components for sending beautiful, responsive emails from the application. We use the React Email for templates and Resend for delivery.

## Structure

- `emails/` - Contains all email templates and helper functions
  - `functions/` - Helper functions for sending emails
    - `helpers.tsx` - Core email sending functions
    - `send-email.ts` - Low-level email sending utilities
  - `static/` - This folder is useless. Includes image assets for the dev preview server.

## Usage

### Sending Emails

Import the helper functions from the email module to send emails:

```typescript
import {sendNewEndorsementEmail} from 'email/functions/helpers'

// Example usage
await sendNewEndorsementEmail(privateUser, creator, onUser, text)
```

### Creating New Email Templates

1. Create a new React component in the `emails/` directory
2. Use components from `@react-email/components` for email-safe HTML
3. Add preview props
4. Export the component as default
5. Add a helper function in `functions/helpers.tsx` to send the email

### Development

You may run typechecks but you don't need to start the email dev server. Assume the human developer is responsible for that.
