/**
 * Writes `packageClassList` into `ios/App/App/capacitor.config.json`.
 *
 * This should be `npx cap sync ios`'s job, and it is not: `copyCapacitorConfig` writes the loaded
 * Capacitor config (which never carries `packageClassList`), and the `generateIOSPackageJSON` call
 * that is meant to add the key afterwards does not survive in this project — `cap copy ios` strips
 * a key that is already present. Its internal `writePluginJSON` is invoked without `await`, so any
 * failure is an unhandled rejection nobody sees.
 *
 * Why it matters, and why the failure is so quiet: `CapacitorBridge.registerPlugins()` decodes that
 * file into `RegistrationList`, whose `packageClassList` is **non-optional**. With the key absent the
 * decode throws, the surrounding `catch` logs to the native console and moves on, and the bridge
 * registers only its four built-ins. The app then launches and renders perfectly — but every plugin
 * call fails with `"X" plugin is not implemented on ios`, which reads like a build or linking
 * problem rather than a one-line JSON omission.
 *
 * Uses the CLI's own discovery so the list cannot drift from what `cap sync` installs.
 */
import {createRequire} from 'node:module'

const require = createRequire(import.meta.url)
const {loadConfig} = require('@capacitor/cli/dist/config.js')
const {getPlugins} = require('@capacitor/cli/dist/plugin.js')
const {getIOSPlugins} = require('@capacitor/cli/dist/ios/common.js')
const {generateIOSPackageJSON} = require('@capacitor/cli/dist/util/iosplugin.js')

const config = await loadConfig()
const plugins = await getIOSPlugins(await getPlugins(config, 'ios'))
await generateIOSPackageJSON(config, plugins)

const written = require(`${config.ios.nativeTargetDirAbs}/capacitor.config.json`).packageClassList

// An empty list is the exact shape of the bug this script exists to prevent, and it is invisible
// until someone installs the build and taps something. Fail the build instead.
if (!written?.length) {
  console.error('ios: packageClassList is empty — no native plugins would register at runtime.')
  process.exit(1)
}
console.log(`ios: registered ${written.length} plugin classes — ${written.join(', ')}`)
