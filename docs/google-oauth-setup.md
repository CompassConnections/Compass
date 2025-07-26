# Google OAuth Setup Guide

## Prerequisites

1. A Google Cloud Platform (GCP) account
2. A GCP project with the Google+ API enabled
3. OAuth consent screen configured

## Step 1: Create OAuth Credentials

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" and select "OAuth client ID"

## Step 2: Configure OAuth Consent Screen

1. If you haven't configured the consent screen, click "Configure Consent Screen"
2. Choose "External" user type and click "Create"
3. Fill in the required app information:
   - App name (e.g., "My App")
   - User support email (your email)
   - Developer contact information (your email)
4. Click "Save and Continue"
5. Skip the "Scopes" step (we'll use the default scopes)
6. Add test users (your email) if you're in testing mode
7. Click "Save and Continue"

## Step 3: Create OAuth Client ID

1. Go back to "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Select "Web application" as the application type
4. Enter a name (e.g., "Web Client")
5. Under "Authorized JavaScript origins", add:
   - `http://localhost:3000`
   - `http://localhost:3001`
6. Under "Authorized redirect URIs", add:
   - `http://localhost:3000/api/auth/callback/google`
   - `http://localhost:3001/api/auth/callback/google`
7. Click "Create"

## Step 4: Set Up Environment Variables

Create or update your `.env.local` file with the following variables:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here  # Generate with: openssl rand -base64 32
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
DATABASE_URL=file:./dev.db
```

## Step 5: Update Database Schema

Run the following command to update your database schema:

```bash
npx prisma db push
```

## Step 6: Restart Your Development Server

```bash
npm run dev
```

## Testing Google OAuth

1. Visit the login page at `http://localhost:3000/login`
2. Click the "Sign in with Google" button
3. You should be redirected to Google's sign-in page
4. After signing in, you'll be redirected back to your app

## Troubleshooting

- If you get a "redirect_uri_mismatch" error, double-check the Authorized Redirect URIs in your Google Cloud Console
- Make sure the Google+ API is enabled in your GCP project
- Check your browser's console and network tab for any errors
- Ensure your `.env.local` file has the correct values and is in the root of your project

## Production Deployment

When deploying to production:
1. Update the `NEXTAUTH_URL` to your production URL
2. Add your production domain to the Authorized JavaScript origins and redirect URIs in the Google Cloud Console
3. Ensure your production environment has the same environment variables set
4. Consider using a more secure database than SQLite for production
