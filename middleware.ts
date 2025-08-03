import {NextResponse} from 'next/server';
import type {NextRequest} from 'next/server';
import {Ratelimit} from '@upstash/ratelimit';
import {Redis} from '@upstash/redis';

// Initialize Redis connection
const redis = Redis.fromEnv();

// Create a rate limiter that allows 5 requests per 60 seconds
const rateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.fixedWindow(100, '60 s'),
});

// Define which routes to apply rate limiting to
const RATE_LIMITED_PATHS = [
  '/api/', // All API routes
];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const ip = request.ip || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anonymous';

  // console.log('middleware', path, ip)


  // Only apply rate limiting to specified paths
  if (RATE_LIMITED_PATHS.some(prefix => path.startsWith(prefix))) {
    const {success, limit, remaining, reset} = await rateLimit.limit(ip);
    if (!success) {
      return new NextResponse(
        JSON.stringify({message: 'Too many requests. Try again in 60 seconds.'}),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString(),
          },
        }
      );
    }
  }

  return NextResponse.next();
}

// Configure which routes to run the middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js|woff|woff2|ttf|eot)$).*)',
  ],
};
