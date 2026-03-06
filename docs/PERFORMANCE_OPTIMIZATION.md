# Performance Optimization Guide

## Overview

This guide provides strategies and best practices for optimizing the performance of the Compass application. It covers
frontend, backend, database, and infrastructure optimization techniques to ensure a fast, responsive user experience.

## Frontend Performance

### React Performance

#### Component Optimization

1. **Memoization**: Use `React.memo` for components that render frequently with the same props

```typescript
const ExpensiveComponent = React.memo(({data}: { data: UserProfile }) => {
    // Expensive rendering logic
    return <div>{/* ... */} < /div>
})
```

2. **useMemo and useCallback**: Memoize expensive computations and callback functions

```typescript
// Memoize expensive calculations
const processedData = useMemo(() => expensiveTransform(data), [data])

// Memoize callbacks to prevent unnecessary re-renders
const handleClick = useCallback(() => {
  handleUserAction(userId)
}, [userId])
```

3. **Virtual Scrolling**: For large lists, implement virtual scrolling

```typescript
// Use react-window or similar libraries for large data sets
import {FixedSizeList as List} from 'react-window'

const VirtualizedList = ({items}: { items: Profile[] }) => (
    <List
        height = {600}
itemCount = {items.length}
itemSize = {120}
itemData = {items}
    >
    {Row}
    < /List>
)
```

#### Bundle Size Optimization

1. **Code Splitting**: Split code by routes and features

```typescript
// Dynamic imports for route-based code splitting
const ProfilePage = lazy(() => import('./ProfilePage'))

// Conditional loading based on feature flags
const AdvancedFeature = lazy(() =>
  process.env.NODE_ENV === 'development'
    ? import('./AdvancedFeatureDev')
    : import('./AdvancedFeatureProd'),
)
```

2. **Tree Shaking**: Import only what you need

```typescript
// ❌ Bad - imports entire library
import _ from 'lodash'

// ✅ Good - imports only needed functions
import {debounce, throttle} from 'lodash'
// or even better with specific packages
import debounce from 'lodash/debounce'
```

3. **Analyze Bundle Size**: Regularly check bundle size

```bash
# Use webpack-bundle-analyzer or similar tools
yarn build && npx webpack-bundle-analyzer .next/static/chunks
```

#### Image Optimization

1. **Next.js Image Component**: Always use the optimized Next.js Image component

```typescript
import Image from 'next/image'

<Image
    src = {user.avatarUrl}
alt = {`${user.name}'s profile`
}
width = {100}
height = {100}
placeholder = "blur"
blurDataURL = {blurDataUrl}
/>
```

2. **Responsive Images**: Serve appropriately sized images

```typescript
<Image
    src = {photo.url}
alt = "Profile photo"
sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
style = {
{
    width: '100%', height
:
    'auto'
}
}
/>
```

### Data Fetching Optimization

#### API Request Optimization

1. **Batch Requests**: Combine multiple API calls when possible

```typescript
// ❌ Multiple sequential requests
const user = await api('get-user', {id: userId})
const profile = await api('get-profile', {userId})
const preferences = await api('get-preferences', {userId})

// ✅ Batch requests where supported
const userData = await api('get-user-data', {userId, include: ['profile', 'preferences']})
```

2. **Caching Strategies**: Implement proper caching

```typescript
// Use React Query or similar for intelligent caching
const {data: userProfile, isLoading} = useQuery(['user', userId], () => fetchUser(userId), {
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
})
```

3. **Pagination**: Implement pagination for large data sets

```typescript
const usePaginatedProfiles = (page: number, limit: number) => {
  return useAPIGetter('get-profiles', {
    page,
    limit,
    orderBy: 'lastActive',
  })
}
```

## Backend Performance

### Database Optimization

#### Query Optimization

1. **Indexing**: Ensure proper database indexes

```sql
-- Composite indexes for common query patterns
CREATE INDEX idx_profiles_age_gender ON profiles (age, gender);

CREATE INDEX idx_profiles_location ON profiles (city_latitude, city_longitude);

CREATE INDEX idx_profiles_last_active ON profiles (last_modification_time DESC);
```

2. **Query Planning**: Analyze slow queries

```sql
-- Use EXPLAIN ANALYZE to identify bottlenecks
EXPLAIN ANALYZE
SELECT
  *
FROM
  profiles
WHERE
  age BETWEEN 25 AND 35
  AND gender = 'female';
```

3. **Connection Pooling**: Configure appropriate connection pools

```typescript
// In database configuration
const pgPromiseConfig = {
  capSQL: true,
  noWarnings: IS_PROD,
  connect: {
    poolSize: 20,
    idleTimeoutMillis: 30000,
  },
}
```

#### API Optimization

1. **Response Size**: Minimize payload size

```typescript
// Select only needed fields
const profileSummary = await pg.one(
  `
  SELECT id, name, age, city, photo_url 
  FROM profiles 
  WHERE user_id = $1
`,
  [userId],
)
```

2. **Compression**: Enable gzip compression

```typescript
// In Express configuration
import compression from 'compression'

app.use(compression())
```

3. **Rate Limiting**: Implement rate limiting to prevent abuse

```typescript
// In API handlers
export const rateLimitedHandler: APIHandler<'expensive-endpoint'> = withRateLimit(
  expensiveOperation,
  {
    name: 'expensive-operation',
    limit: 10,
    windowMs: 60000,
  },
)
```

### Caching Strategies

#### Redis Caching

```typescript
import redis from 'redis'

const client = redis.createClient()

async function getCachedProfile(userId: string) {
  const cacheKey = `profile:${userId}`
  const cached = await client.get(cacheKey)

  if (cached) {
    return JSON.parse(cached)
  }

  const profile = await fetchProfileFromDB(userId)
  await client.setex(cacheKey, 300, JSON.stringify(profile)) // 5 minute cache
  return profile
}
```

#### CDN Optimization

1. **Static Asset Caching**: Set appropriate cache headers

```typescript
// In Express middleware
app.use(
  '/static',
  express.static('public', {
    maxAge: '1y',
    etag: true,
  }),
)
```

2. **Image CDN**: Use image CDN services for dynamic optimization

```typescript
// Cloudinary or similar services
const optimizedImageUrl = cloudinary.url(photoId, {
  width: 300,
  height: 300,
  crop: 'fill',
  quality: 'auto',
  format: 'auto',
})
```

## Database Performance

### Indexing Strategy

1. **Analyze Query Patterns**: Identify frequently used query filters

```sql
-- Monitor slow query logs
-- CREATE EXTENSION pg_stat_statements;
SELECT
  query,
  calls,
  total_time,
  mean_time
FROM
  pg_stat_statements
ORDER BY
  total_time DESC
LIMIT
  10;
```

2. **Composite Indexes**: Create indexes for multi-column queries

```sql
-- For queries filtering by age and gender
CREATE INDEX idx_profiles_demographics ON profiles (age, gender, looking_for_matches)
WHERE
  looking_for_matches = true
  AND disabled = false;
```

3. **Partial Indexes**: Index subset of data for better performance

```sql
-- Only index active users
CREATE INDEX idx_profiles_active ON profiles (last_modification_time DESC)
WHERE
  looking_for_matches = true
  AND disabled = false;

-- Index by location for nearby searches
CREATE INDEX idx_profiles_location_active ON profiles (city_latitude, city_longitude)
WHERE
  looking_for_matches = true
  AND disabled = false;
```

### Connection Pooling Optimization

Proper database connection pooling is crucial for performance and stability under load:

1. **Configure Appropriate Pool Sizes**:

```typescript
// Backend connection pool configuration
const client = newClient({
  query_timeout: 30000, // 30 seconds timeout
  max: 30, // Pool size tuned for production load
})

// Pool timeout configuration
pool.idleTimeoutMillis = 30000 // Close idle connections after 30 seconds
pool.connectionTimeoutMillis = 10000 // Timeout for acquiring connection
```

2. **Handle Pool Exhaustion Gracefully**:

```typescript
// Proper error handling for connection pool issues
if (error.message && error.message.includes('MaxClientsInSessionMode')) {
  throw APIErrors.serviceUnavailable('Service temporarily unavailable due to high demand')
}
```

3. **Monitor Pool Metrics**:

```typescript
// Track connection pool health
metrics.set('pg/pool_connections', pool.waitingCount, {state: 'waiting'})
metrics.set('pg/pool_connections', pool.idleCount, {state: 'idle'})
metrics.set('pg/pool_connections', pool.totalCount, {state: 'total'})
```

See [DATABASE_CONNECTION_POOLING.md](DATABASE_CONNECTION_POOLING.md) for detailed connection pooling best practices.

### Query Optimization

1. **Avoid N+1 Queries**: Batch related data fetches

```typescript
// ❌ N+1 query pattern
const profiles = await Promise.all(
  userIds.map((id) => pg.one('SELECT * FROM profiles WHERE user_id = $1', [id])),
)

// ✅ Single batch query
const profiles = await pg.many(
  `
  SELECT * FROM profiles WHERE user_id = ANY($1)
`,
  [userIds],
)
```

2. **Use Joins Appropriately**: Leverage database joins for related data

```sql
SELECT
  p.*,
  u.name as username,
  COUNT(l.id) as like_count
FROM
  profiles p
  JOIN users u ON p.user_id = u.id
  LEFT JOIN profile_likes l ON p.user_id = l.target_user_id
WHERE
  p.looking_for_matches = true
GROUP BY
  p.id,
  u.name
```

2. **Composite Indexes**: Create indexes for multi-column queries

```sql
-- For queries filtering by age and gender
CREATE INDEX idx_profiles_demographics ON profiles (age, gender, looking_for_matches)
WHERE
  looking_for_matches = true
  AND disabled = false;
```

3. **Partial Indexes**: Index subset of data for better performance

```sql
-- Only index active users
CREATE INDEX idx_profiles_active ON profiles (last_modification_time DESC)
WHERE
  looking_for_matches = true
  AND disabled = false;

-- Index by location for nearby searches
CREATE INDEX idx_profiles_location_active ON profiles (city_latitude, city_longitude)
WHERE
  looking_for_matches = true
  AND disabled = false;
```

### Query Optimization

1. **Avoid N+1 Queries**: Batch related data fetches

```typescript
// ❌ N+1 query pattern
const profiles = await Promise.all(
  userIds.map((id) => pg.one('SELECT * FROM profiles WHERE user_id = $1', [id])),
)

// ✅ Single batch query
const profiles = await pg.many(
  `
  SELECT * FROM profiles WHERE user_id = ANY($1)
`,
  [userIds],
)
```

2. **Use Joins Appropriately**: Leverage database joins for related data

```sql
SELECT
  p.*,
  u.name as username,
  COUNT(l.id) as like_count
FROM
  profiles p
  JOIN users u ON p.user_id = u.id
  LEFT JOIN profile_likes l ON p.user_id = l.target_user_id
WHERE
  p.looking_for_matches = true
GROUP BY
  p.id,
  u.name
```

## Infrastructure Optimization

### Deployment Optimization

#### Vercel Optimization

1. **Incremental Static Regeneration**: Use ISR for dynamic content

```typescript
export const getStaticProps: GetStaticProps = async () => {
  const profiles = await fetchFeaturedProfiles()
  return {
    props: {profiles},
    revalidate: 300, // Revalidate every 5 minutes
  }
}
```

2. **Edge Functions**: Move computation closer to users

```typescript
// Use Edge Runtime for global API endpoints
export const config = {
  runtime: 'edge',
}

export default async function handler(req: Request) {
  // Light-weight processing
  return new Response(JSON.stringify({status: 'ok'}))
}
```

#### Google Cloud Optimization

1. **Load Balancing**: Distribute traffic efficiently

```yaml
# terraform configuration for load balancer
  resource "google_compute_backend_service" "api_backend" {
    name        = "api-backend"
    protocol    = "HTTP"
    timeout_sec = 30

  # Health checks
    health_checks = [google_compute_health_check.api.self_link]

  # Load balancing algorithm
    balancing_mode = "UTILIZATION"
}
```

2. **Auto-scaling**: Scale resources based on demand

```yaml
# Container scaling configuration
resources:
  limits:
    cpu: '1'
    memory: '512Mi'
  requests:
    cpu: '250m'
    memory: '128Mi'

autoscaling:
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70
```

## Monitoring Performance

### Key Performance Indicators

1. **Core Web Vitals**: Track Largest Contentful Paint (LCP), First Input Delay (FID), Cumulative Layout Shift (CLS)
2. **API Response Times**: Monitor endpoint latencies
3. **Database Query Times**: Track slow queries
4. **Error Rates**: Monitor 5xx error rates
5. **Resource Usage**: CPU, memory, and network utilization

### Performance Monitoring Tools

1. **Browser Performance APIs**: Use Performance API for client-side metrics

```typescript
// Measure page load performance
if ('performance' in window) {
  const perfData = performance.timing
  const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart
  logMetric('page_load_time', pageLoadTime)
}
```

2. **Custom Metrics Collection**: Implement application-specific performance tracking

```typescript
// Track specific user interactions
const start = performance.now()
await submitForm(data)
const duration = performance.now() - start
metrics.record('form_submission_time', duration)
```

## Performance Testing

### Load Testing

Use tools like Artillery or k6 for load testing:

```yaml
# artillery configuration
config:
  target: 'https://api.compassmeet.com'
  phases:
    - duration: 60
      arrivalRate: 20
  defaults:
    headers:
      Authorization: 'Bearer {{ $processEnvironment.JWT_TOKEN }}'

scenarios:
  - name: 'Browse Profiles'
    flow:
      - get:
          url: '/get-profiles'
          qs:
            limit: 20
```

### Benchmarking

Create benchmark tests for critical operations:

```typescript
// Jest benchmark test
describe('Profile Search Performance', () => {
  it('should return results within 500ms', async () => {
    const start = Date.now()
    const results = await searchProfiles(searchParams)
    const duration = Date.now() - start

    expect(duration).toBeLessThan(500)
    expect(results).toHaveLength(20)
  })
})
```

## Best Practices Summary

### Frontend

- Minimize bundle size through code splitting and tree shaking
- Use React.memo and useMemo for expensive components
- Implement proper image optimization
- Cache API responses intelligently
- Lazy load non-critical features

### Backend

- Optimize database queries with proper indexing
- Implement connection pooling
- Use caching strategically
- Compress responses
- Implement rate limiting

### Database

- Analyze query performance regularly
- Create appropriate indexes
- Avoid N+1 query patterns
- Use partial indexes for filtered data
- Monitor slow query logs

### Infrastructure

- Use CDN for static assets
- Implement proper caching headers
- Configure auto-scaling
- Monitor key performance metrics
- Run regular load testing

## Common Pitfalls to Avoid

1. **Premature Optimization**: Focus on actual bottlenecks, not perceived ones
2. **Over-fetching Data**: Only request data you actually need
3. **Blocking Operations**: Avoid synchronous operations that block the event loop
4. **Memory Leaks**: Clean up event listeners and subscriptions
5. **Inefficient Re-renders**: Use profiling tools to identify unnecessary re-renders

---

_Last Updated: March 2026_
