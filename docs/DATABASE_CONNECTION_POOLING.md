# Database Connection Pooling Guide

## Overview

This guide explains the database connection pooling configuration and best practices for the Compass application. Proper connection pooling is critical for application performance and stability, especially under high load conditions.

## Understanding the Problem

The error `MaxClientsInSessionMode: max clients reached - in Session mode max clients are limited to pool_size` indicates that the application has exhausted the database connection pool. This can happen due to:

1. **Connection Leaks**: Database connections not properly released back to the pool
2. **High Concurrent Load**: Too many simultaneous requests exceeding pool capacity
3. **Long-Running Queries**: Connections held for extended periods
4. **Improper Timeout Configuration**: Connections hanging indefinitely

## Current Configuration

### Main Connection Pool

```typescript
const client = newClient({
  instanceId: getInstanceId(),
  password: password,
  query_timeout: 30000, // 30 seconds - reduced from 1 hour
  max: 30, // Increased from 20 to handle more concurrent connections
})

// Pool configuration
pool.idleTimeoutMillis = 30000 // Close idle connections after 30 seconds
pool.connectionTimeoutMillis = 10000 // Timeout for acquiring connection (10 seconds)
```

### Short Timeout Connection Pool

```typescript
const shortTimeoutPgpClient = newClient({
  instanceId: getInstanceId(),
  password: getSupabasePwd(),
  query_timeout: 30000, // 30 seconds
  max: 10, // Smaller pool for short timeout operations
})

// Pool configuration
pool.idleTimeoutMillis = 15000 // 15 seconds idle timeout
pool.connectionTimeoutMillis = 5000 // 5 seconds connection timeout
```

## Best Practices

### 1. Always Use Connection Pooling

Never create direct database connections outside of the pooling system:

```typescript
// ✅ Correct - Use the connection pool
const pg = createSupabaseDirectClient()
const result = await pg.one('SELECT * FROM users WHERE id = $1', [userId])

// ❌ Incorrect - Creates direct connections that aren't pooled
import {Client} from 'pg'
const client = new Client(connectionString)
await client.connect()
```

### 2. Handle Transactions Properly

Ensure transactions are always committed or rolled back:

```typescript
// ✅ Correct - Proper transaction handling
const result = await pg.tx(async (tx) => {
  try {
    await tx.none('INSERT INTO users (name) VALUES ($1)', ['John'])
    await tx.none('INSERT INTO profiles (user_id, bio) VALUES ($1, $2)', ['user123', 'Bio'])
    return {success: true}
  } catch (error) {
    // Transaction will be automatically rolled back
    throw error
  }
})

// ❌ Incorrect - Potential connection leak
const tx = await pg.tx()
try {
  await tx.none('INSERT INTO users (name) VALUES ($1)', ['John'])
  // If this throws, connection might not be properly released
} finally {
  // Always close the transaction
  await tx.done()
}
```

### 3. Use Appropriate Timeouts

Set reasonable timeouts to prevent hanging connections:

```typescript
// For regular operations
const pg = createSupabaseDirectClient() // 30-second timeout

// For operations that should be fast
const pg = createShortTimeoutDirectClient() // 30-second timeout with smaller pool
```

### 4. Monitor Pool Metrics

Use the built-in metrics to monitor pool health:

```typescript
// Monitored metrics:
// pg/connections_established - Total connections established
// pg/connections_terminated - Total connections closed
// pg/connections_acquired - Connections acquired from pool
// pg/connections_released - Connections returned to pool
// pg/pool_connections - Current pool state (waiting, idle, expired, total)
```

## Troubleshooting Connection Issues

### 1. Check Pool Utilization

Monitor the pool connection metrics to identify if you're consistently hitting limits:

```bash
# In logs, look for:
# pg/pool_connections with state: waiting > 0
# This indicates contention for connections
```

### 2. Identify Long-Running Queries

Check for queries that hold connections too long:

```sql
-- Find long-running queries in PostgreSQL
SELECT
  pid,
  now () - pg_stat_activity.query_start AS duration,
  query,
  state
FROM
  pg_stat_activity
WHERE
  (now () - pg_stat_activity.query_start) > interval '30 seconds';
```

### 3. Handle Pool Exhaustion Gracefully

Implement proper error handling for pool exhaustion:

```typescript
try {
  const result = await pg.one('SELECT * FROM users WHERE id = $1', [userId])
  return result
} catch (error) {
  if (error.message && error.message.includes('MaxClientsInSessionMode')) {
    // Pool exhaustion - return appropriate error
    throw new APIError(503, 'Service temporarily unavailable due to high demand')
  }
  throw error
}
```

## Scaling Considerations

### Vertical Scaling

Increase pool size for higher concurrency:

```typescript
max: 50 // For high-traffic environments
```

### Horizontal Scaling

Consider splitting workloads across multiple connection pools:

```typescript
// High-priority operations
const priorityPool = createSupabaseDirectClient()

// Background jobs
const backgroundPool = createShortTimeoutDirectClient()
```

## Monitoring and Alerts

Set up alerts for:

- High pool waiting counts (`pg/pool_connections{state="waiting"} > 5`)
- Low idle connections (`pg/pool_connections{state="idle"} < 2`)
- High connection termination rate (`rate(pg/connections_terminated[5m]) > 10`)

## Configuration Tuning

Adjust based on your environment:

### Development Environment

```typescript
max: 10 // Lower concurrency needs
query_timeout: 30000
```

### Production Environment

```typescript
max: 30 - 50 // Higher concurrency needs
query_timeout: 30000
idleTimeoutMillis: 30000
```

### High-Traffic Scenario

```typescript
max: 100 // Very high concurrency
query_timeout: 15000 // Shorter timeouts
idleTimeoutMillis: 15000
connectionTimeoutMillis: 5000
```

## Common Pitfalls to Avoid

1. **Creating Multiple Pool Instances**: Always reuse the singleton pattern
2. **Ignoring Timeouts**: Always set appropriate query timeouts
3. **Not Monitoring Pool State**: Regularly check pool metrics
4. **Holding Connections Too Long**: Minimize time spent per connection
5. **Not Handling Errors Properly**: Always catch and handle pool-related errors

---

_Last Updated: March 2026_
