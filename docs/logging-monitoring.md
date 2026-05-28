# Logging and Monitoring Guide

## Overview

Compass implements a comprehensive logging and monitoring system to ensure application reliability, performance tracking, and debugging capabilities. This guide explains the architecture, usage patterns, and best practices for logging and monitoring within the application.

## Logging Architecture

### Logger Components

The logging system consists of two main components:

1. **Common Logger** (`common/src/logger.ts`) - Client and shared logging
2. **Structured Logger** (`backend/shared/src/monitoring/log.ts`) - Backend structured logging

### Log Levels

The system supports four log levels in order of severity:

- **DEBUG** (`debug`) - Detailed diagnostic information, only in development
- **INFO** (`info`) - General operational information
- **WARN** (`warn`) - Potentially harmful situations
- **ERROR** (`error`) - Error events that might still allow the application to continue

### Log Context

All logs can include contextual information such as:

- Endpoint/route information
- User IDs
- Trace IDs for request correlation
- Arbitrary key-value pairs

## Usage Patterns

### Basic Logging

```typescript
import {logger} from 'common/logger'

// Info level logging
logger.info('User login successful', {userId: 'user123', endpoint: '/login'})

// Warning level logging
logger.warn('Rate limit approaching', {userId: 'user123', requests: 95})

// Error level logging
logger.error('Database connection failed', new Error('Connection timeout'), {
  service: 'database',
})

// Debug level logging (only in development)
logger.debug('Processing user data', {userId: 'user123', step: 'validation'})
```

### API Error Logging

Specialized function for consistent API error logging:

```typescript
import {logApiError} from 'common/logger'

try {
  await apiCall()
} catch (err) {
  logApiError('/api/users', err, {userId: 'user123'})
}
```

### Structured Backend Logging

Backend services use structured logging for better parsing and analysis:

```typescript
import {log} from 'shared/monitoring/log'

// Structured logging with context
log.info('Processing payment', {
  userId: 'user123',
  amount: 29.99,
  currency: 'USD',
})

// Error logging with stack traces
log.error('Payment processing failed', new Error('Insufficient funds'), {
  userId: 'user123',
  orderId: 'order456',
})
```

## Monitoring Metrics

### Available Metrics

The system tracks various metrics categorized by subsystem:

#### HTTP Metrics

- `http/request_count` - Total HTTP requests
- `http/request_latency` - Request processing time distribution

#### WebSocket Metrics

- `ws/open_connections` - Currently open WebSocket connections
- `ws/connections_established` - Total WebSocket connections established
- `ws/connections_terminated` - Total WebSocket connections terminated
- `ws/broadcasts_sent` - Total WebSocket broadcasts sent

#### Database Metrics

- `pg/query_count` - Total database queries
- `pg/connections_established` - Total database connections established
- `pg/connections_terminated` - Total database connections terminated

#### Application Metrics

- `app/bet_count` - Total bets placed
- `app/contract_view_count` - Total contract views

### Recording Metrics

```typescript
import {metrics} from 'shared/monitoring/metrics'

// Increment a counter metric
metrics.inc('http/request_count', {endpoint: '/api/users'})

// Record a timing metric
const start = Date.now()
// ...operation...
const latency = Date.now() - start
metrics.push('http/request_latency', latency, {endpoint: '/api/users'})

// Set a gauge value
metrics.set('ws/open_connections', currentConnections)
```

## Context Propagation

### Request Context

HTTP requests automatically propagate context through AsyncLocalStorage:

```typescript
// In request handler
withMonitoringContext(
  {
    endpoint: req.path,
    traceId: generateTraceId(),
  },
  () => {
    // All logging and metrics within this scope
    // will include the context
    log.info('Processing request')
    metrics.inc('http/request_count')
  },
)
```

### Job Context

Background jobs should establish context at the beginning:

```typescript
import {withMonitoringContext} from 'shared/monitoring/context'

// In job processor
const jobId = 'daily-cleanup-123'
withMonitoringContext(
  {
    job: 'daily-cleanup',
    traceId: jobId,
  },
  async () => {
    log.info('Starting cleanup job')
    // ...job processing...
  },
)
```

## Best Practices

### Log Message Guidelines

1. **Be Descriptive**: Write clear, human-readable messages
2. **Include Context**: Add relevant identifiers and metadata
3. **Avoid Sensitive Data**: Never log passwords, tokens, or PII
4. **Use Consistent Naming**: Follow established patterns for keys

### Error Handling

1. **Always Log Errors**: Include the full error object for stack traces
2. **Correlate Events**: Use trace IDs to connect related logs
3. **Handle Silent Failures**: Log even when catching and continuing

### Performance Considerations

1. **Avoid Heavy Processing**: Don't stringify large objects in hot paths
2. **Use Appropriate Levels**: DEBUG only for development
3. **Batch Metrics**: Aggregate where possible to reduce overhead

## Integration with External Systems

### Google Cloud Logging

In production on Google Cloud Platform, logs are automatically formatted for Cloud Logging:

```json
{
  "severity": "INFO",
  "message": "User login successful",
  "userId": "user123",
  "endpoint": "/login"
}
```

### Monitoring Dashboards

Metrics are exported to monitoring systems for visualization:

- Request rates and latencies
- Error rates and patterns
- Resource utilization
- Business metrics

## Troubleshooting

### Common Issues

1. **Missing Logs**: Check environment log level configuration
2. **Performance Impact**: Reduce debug logs in production
3. **Context Loss**: Ensure AsyncLocalStorage context propagation

### Debugging Tips

1. **Enable Debug Level**: Set appropriate environment variables
2. **Use Trace IDs**: Correlate distributed requests
3. **Check Both Systems**: Look at both application logs and metrics

## Future Improvements

Planned enhancements include:

- Distributed tracing integration (OpenTelemetry)
- More granular business metrics
- Alerting based on anomaly detection
- Enhanced log aggregation and search capabilities

---

_Last Updated: March 2026_
