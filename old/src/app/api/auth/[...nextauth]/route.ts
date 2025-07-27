import NextAuth from 'next-auth';
import { authConfig } from '@/auth.config';

// Merge the auth config with additional options
const handler = NextAuth({
  ...authConfig,
  // Debug mode in development
  debug: process.env.NODE_ENV === 'development',
  // Trust the host header (only in development)
  trustHost: true,
  // Cookie settings (already defined in authConfig, but can be overridden here if needed)
});

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = handler;

export { GET, POST, auth, signIn, signOut };

export default handler;