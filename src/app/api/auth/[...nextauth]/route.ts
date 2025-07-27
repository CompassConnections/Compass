import NextAuth from 'next-auth';
import { authConfig } from '@/auth';

// Initialize NextAuth with the configuration
export const {
  handlers: { GET, POST },
} = NextAuth({
  ...authConfig,
  // Enable debug logs in development
  debug: process.env.NODE_ENV === 'development',
  // Ensure cookies are secure in production
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax', // CSRF protection
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
});

export { GET, POST};