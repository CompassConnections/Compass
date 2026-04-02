import {defineConfig, devices} from '@playwright/test'
import 'tsconfig-paths/register'
import {execSync} from 'child_process'
import {config} from 'dotenv'

// Load static env vars from .env.test
config({path: '.env.test', quiet: true})

// Dynamically pull Supabase vars
function getSupabaseEnv() {
  try {
    const raw = execSync('npx supabase status --output json 2>/dev/null', {encoding: 'utf-8'})
    const status = JSON.parse(raw)
    if (!status.API_URL) throw new Error('No supabase API URL')
    if (!status.ANON_KEY) throw new Error('No supabase ANON_KEY')
    if (!status.DB_URL) throw new Error('No supabase DB_URL')
    return {
      NEXT_PUBLIC_SUPABASE_URL: status.API_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: status.ANON_KEY,
      DATABASE_URL: status.DB_URL,
    }
  } catch (e) {
    console.error(e)
    throw new Error('Failed to get Supabase status. Is it running?')
  }
}

if (process.env.DIRECT_SUPABASE_SETUP_IN_PLAYWRIGHT !== 'true') {
  const supabaseEnv = getSupabaseEnv()
  
  // Inject into process.env so Playwright and your app code can read them
  Object.assign(process.env, supabaseEnv)
}

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // No retries by default (even in CI) because it slows the CI pipeline and masks real bugs
  // If there is a known intermittent browser timing issue for some tests, it's fine to give 1 retry to those flaky tests
  retries: process.env.CI ? 0 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', {outputFolder: `tests/reports/playwright-report`, open: 'on-failure'}]],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    // headless: false,
  },
  projects: [
    {
      name: 'main',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],
  timeout: 120000,
  expect: {
    timeout: 120000,
  },
})
