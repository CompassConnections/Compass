import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    // Add security headers
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-middleware-cache', 'no-cache');

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        // If there's a token, the user is authenticated
        return !!token;
      },
    },
    pages: {
      signIn: '/login',
    },
  }
);

// Configure which paths should be protected
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/auth/session',
  ],
};
