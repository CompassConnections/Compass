# Troubleshooting Guide

## Overview

This guide helps developers diagnose and resolve common issues encountered when working with the Compass codebase. It covers setup problems, development environment issues, testing challenges, and deployment concerns.

## Development Environment Setup

### Node.js Version Issues

**Problem**: Version compatibility errors when running `yarn install` or `yarn dev`

**Solution**:

1. Check required Node.js version in `backend/api/package.json` (should be >=20.9.0)
2. Use `nvm` to manage Node versions:

```bash
# Install nvm if not already installed
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install and use correct Node version
nvm install 20.9.0
nvm use 20.9.0
```

### Yarn Installation Problems

**Problem**: Commands like `yarn dev` fail with module not found errors

**Solution**:

1. Ensure Yarn is installed globally:

```bash
npm install --global yarn
```

2. Install dependencies with frozen lockfile:

```bash
yarn install --frozen-lockfile
```

3. If issues persist, clean install:

```bash
rm -rf node_modules yarn.lock
yarn install
```

### Docker Installation Issues

**Problem**: Supabase or Firebase emulators fail to start

**Solution**:

1. Verify Docker installation:

```bash
docker --version
```

2. Start Docker daemon (Linux):

```bash
sudo systemctl start docker
sudo usermod -aG docker $USER
# Log out and back in
```

3. For snap-installed Docker issues, use native Docker:

```bash
sudo snap remove docker
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
# Log out and back in
```

## Database and Emulators

### Supabase Issues

**Problem**: `yarn dev:isolated` fails to start Supabase services

**Solution**:

1. Check if Supabase CLI is installed:

```bash
npx supabase --version
```

2. Stop conflicting processes:

```bash
supabase stop --no-backup
```

3. Reset and restart:

```bash
yarn test:db:reset
```

4. Check Supabase status:

```bash
supabase status
```

### Firebase Emulator Problems

**Problem**: Authentication or storage emulator fails to start

**Solution**:

1. Verify Java 21+ installation:

```bash
java -version
```

2. Kill stale emulator processes:

```bash
pkill -f "firebase emulators"
pkill -f "java.*emulator"
```

3. Start emulators:

```bash
yarn emulate
```

### Port Conflicts

**Problem**: Services fail to start with "port already in use" errors

**Solution**:

1. Check which process is using the port:

```bash
lsof -i :54321  # Supabase
lsof -i :9099   # Firebase Auth
lsof -i :8088   # Backend API
lsof -i :3000   # Next.js
```

2. Kill conflicting processes:

```bash
kill -9 <PID>
```

3. Alternative ports can be configured in `.env` files

## Testing Issues

### Jest Test Failures

**Problem**: Tests fail with import or module errors

**Solution**:

1. Run tests with verbose output to see specific errors:

```bash
yarn test --verbose
```

2. Clear Jest cache:

```bash
yarn test --clearCache
```

3. Run specific test files to isolate issues:

```bash
yarn test path/to/specific.test.ts
```

### Playwright E2E Test Problems

**Problem**: E2E tests fail to run or browsers won't start

**Solution**:

1. Install Playwright browsers:

```bash
npx playwright install
```

2. Run E2E tests in headed mode for debugging:

```bash
yarn test:e2e:dev --headed
```

3. Check if services are running:

```bash
# Should show running services
curl http://localhost:9099  # Firebase Auth
curl http://localhost:8088/health  # Backend API
curl http://localhost:3000  # Next.js
```

### Test Data Issues

**Problem**: Tests fail due to data conflicts or missing fixtures

**Solution**:

1. Reset test database:

```bash
yarn test:db:reset
```

2. Ensure unique test data per test:

```typescript
// Always use unique identifiers
const testId = crypto.randomUUID()
const email = `test+${testId}@test.compass`
const username = `user_${testId}`
```

3. Clean up test data in afterEach:

```typescript
afterEach(async () => {
  await deleteUser(email, password) // only the one this test created
})
```

## API and Backend Issues

### Authentication Errors

**Problem**: API calls return 401 Unauthorized

**Solution**:

1. Verify Firebase authentication:

```bash
# Check if Firebase is properly configured
firebase login
```

2. Check JWT token validity:

```bash
# In browser console
console.log(firebase.auth().currentUser.getIdToken())
```

3. Verify environment variables in `.env`:

```bash
NEXT_PUBLIC_FIREBASE_ENV=DEV
```

### Database Connection Errors

**Problem**: "Connection refused" or timeout errors

**Solution**:

1. Check if database services are running:

```bash
docker ps | grep supabase
```

2. Verify database URL in `.env`:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres
```

3. Test database connection:

```bash
psql postgresql://postgres:postgres@localhost:54322/postgres
```

### Rate Limiting Issues

**Problem**: API calls return 429 Too Many Requests

**Solution**:

1. Check rate limiting configuration:

```bash
# In development, you can adjust limits
API_RATE_LIMIT_PER_MIN_AUTHED=1000
API_RATE_LIMIT_PER_MIN_UNAUTHED=100
```

2. Add delays between repeated API calls in tests:

```typescript
await new Promise((resolve) => setTimeout(resolve, 100))
```

## Frontend Issues

### Build Errors

**Problem**: `yarn build` fails with TypeScript or compilation errors

**Solution**:

1. Run type checking separately:

```bash
yarn typecheck
```

2. Check for unused variables or imports:

```bash
yarn lint
```

3. Clear Next.js cache:

```bash
yarn clear-nextjs-cache
```

### Hot Reload Issues

**Problem**: Code changes don't reflect in development server

**Solution**:

1. Restart development server:

```bash
yarn dev
```

2. Check for syntax errors that prevent hot reload:

```bash
# Watch for compilation errors in terminal
```

3. Clear browser cache:

```bash
# Hard refresh (Ctrl+F5 or Cmd+Shift+R)
```

### Styling Problems

**Problem**: CSS or Tailwind classes not applying correctly

**Solution**:

1. Check Tailwind configuration in `tailwind.config.js`
2. Verify CSS imports in `_app.tsx`:

```typescript
import '../styles/globals.css'
```

3. Restart development server to regenerate CSS

## Mobile Development Issues

### Android Build Failures

**Problem**: `yarn build-sync-android` fails

**Solution**:

1. Ensure Android Studio and SDK are installed
2. Check environment variables:

```bash
ANDROID_HOME=/path/to/android/sdk
```

3. Sync Gradle dependencies:

```bash
cd android
./gradlew clean
./gradlew build
```

### Capacitor Plugin Issues

**Problem**: Native plugins not working

**Solution**:

1. Update Capacitor plugins:

```bash
npx cap sync
```

2. Check plugin compatibility with target platform versions

## Common Error Messages and Solutions

### "Module not found" Errors

**Cause**: Missing dependencies or incorrect import paths
**Solution**:

1. Reinstall dependencies: `yarn install --force`
2. Check import paths for typos
3. Ensure files exist at referenced locations

### "TypeError: Cannot read property of undefined"

**Cause**: Attempting to access properties on null/undefined values
**Solution**:

1. Add proper null checks:

```typescript
user?.profile?.name ?? 'Anonymous'
```

2. Initialize objects properly:

```typescript
const [userData, setUserData] = useState<User | null>(null)
```

### "Network error" or "Connection refused"

**Cause**: Services not running or incorrect URLs
**Solution**:

1. Verify all services are running with `yarn dev` or `yarn dev:isolated`
2. Check environment variables for correct URLs
3. Test service connectivity individually

## Performance Issues

### Slow Development Server

**Problem**: Pages take a long time to load locally

**Solution**:

1. Use isolated development mode:

```bash
yarn dev:isolated
```

2. Check for memory leaks with:

```bash
yarn disk-space-info
```

3. Monitor resource usage in Activity Monitor/Task Manager

### Large Bundle Sizes

**Problem**: Production builds are too large

**Solution**:

1. Analyze bundle size:

```bash
yarn build && npx webpack-bundle-analyzer .next/static/chunks
```

2. Implement code splitting for large components
3. Remove unused dependencies

## Debugging Techniques

### Console Logging

1. **Structured Logging**: Use the application logger:

```typescript
import {logger} from 'common/logger'
logger.info('Processing user data', {userId: auth.uid, step: 'validation'})
```

2. **Debug Statements**: Use debug mode in development:

```typescript
import {debug} from 'common/logger'
debug('Variable state:', variable)
```

### Browser Debugging

1. **React DevTools**: Install browser extension for component inspection
2. **Network Tab**: Monitor API calls and response times
3. **Console Tab**: Check for JavaScript errors

### Backend Debugging

1. **Add Logging**: Insert strategic log statements in API handlers
2. **Use Debugger**: Run API with debug mode:

```bash
yarn debug
```

3. **Database Query Analysis**: Use `EXPLAIN ANALYZE` for slow queries

## Environment-Specific Issues

### Production vs Development Differences

**Problem**: Code works in development but fails in production

**Solution**:

1. Check environment variables and secrets management
2. Verify build process differences (minification, etc.)
3. Test with production-like data sets

### CI/CD Pipeline Failures

**Problem**: GitHub Actions fail unexpectedly

**Solution**:

1. Check workflow logs for specific error messages
2. Ensure all secrets are properly configured in repository settings
3. Verify Node.js and dependency versions match local environment

## Best Practices for Issue Resolution

1. **Reproduce Consistently**: Create minimal reproduction cases
2. **Check Recent Changes**: Use git history to identify problematic changes
3. **Isolate Variables**: Test one change at a time
4. **Read Error Messages Carefully**: Often contain specific hints about the root cause
5. **Search Existing Issues**: Check GitHub issues and Discord discussions
6. **Ask for Help**: Reach out to the community on Discord or GitHub

## Getting Further Help

If you're unable to resolve an issue:

1. **Check Existing Issues**: https://github.com/CompassConnections/Compass/issues
2. **Ask on Discord**: https://discord.gg/8Vd7jzqjun
3. **Email Support**: hello@compassmeet.com
4. **Create a GitHub Issue**: Include:
   - Detailed error messages
   - Steps to reproduce
   - Environment information (OS, Node version, etc.)
   - Screenshots or code snippets if relevant

---

_Last Updated: March 2026_
