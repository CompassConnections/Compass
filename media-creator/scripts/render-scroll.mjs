// Renders the ProfileScrollStory b-roll for one profile.
//
//   npm run render:scroll euniiiiiiiiiice   -> out/compass-profile-scroll-euniiiiiiiiiice.mp4
//
// The username is the only argument, because it is the only thing that changes: the
// scene reads every page-specific number from public/profile-<username>/manifest.json,
// written by scripts/capture-profile.mjs. Extra flags are passed through to Remotion:
//
//   npm run render:scroll euniiiiiiiiiice -- --crf 30
import {execFileSync} from 'node:child_process'
import {existsSync, mkdirSync} from 'node:fs'
import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const [username, ...passThrough] = process.argv.slice(2)

if (!username || username.startsWith('-')) {
  console.error('Usage: npm run render:scroll <username> [-- <remotion flags>]')
  console.error('  e.g. npm run render:scroll euniiiiiiiiiice')
  process.exit(1)
}

const artwork = join(HERE, '..', 'public', `profile-${username}`)
if (!existsSync(join(artwork, 'manifest.json'))) {
  console.error(`No capture for "${username}" — ${artwork}/manifest.json is missing.`)
  console.error(`Capture it first (with a dev server up, or against production):`)
  console.error(`  node scripts/capture-profile.mjs https://www.compassmeet.com/${username}`)
  process.exit(1)
}

const output = join('out', `compass-profile-scroll-${username}.mp4`)
mkdirSync('out', {recursive: true})

console.log(`→ ${output}`)
execFileSync(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  [
    'remotion',
    'render',
    'ProfileScrollStory',
    output,
    `--props=${JSON.stringify({username})}`,
    // Long renders here can trip the 30s delayRender on BrandFonts — registered for the
    // OG card, but bundled into every composition.
    '--timeout=120000',
    ...passThrough,
  ],
  {stdio: 'inherit'},
)
