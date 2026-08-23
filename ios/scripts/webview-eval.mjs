/**
 * Evaluate JavaScript inside the iPhone's WKWebView from a terminal, over
 * `ios-webkit-debug-proxy`. No browser, no DevTools UI.
 *
 * Why this exists rather than "just open DevTools": on Linux the documented route is Chrome plus a
 * `chrome-devtools://` URL, and modern Chrome refuses to navigate to that scheme from a link *or* the
 * omnibox — it turns the paste into a Google search. Firefox cannot open the scheme at all. This
 * talks to the same debugging endpoint directly, which is also scriptable.
 *
 *   ios_webkit_debug_proxy                       # in another terminal, phone on USB
 *   node ios/scripts/webview-eval.mjs "location.href"
 *
 * Two protocol quirks are load-bearing, both discovered the hard way:
 *
 *  - **Everything must be target-wrapped.** Sending `Runtime.evaluate` at the top level answers
 *    `'Runtime' domain was not found`. Modern iOS nests real commands inside
 *    `Target.sendMessageToTarget` and replies via `Target.dispatchMessageFromTarget`.
 *  - **`awaitPromise` is not supported** — a promise-returning expression resolves to `{}`. Use
 *    synchronous XMLHttpRequest, or stash the result on `window` and read it back in a second call:
 *
 *      node ios/scripts/webview-eval.mjs "window.__r='?';Capacitor.Plugins.App.getInfo().then(i=>window.__r=i.build);'started'"
 *      node ios/scripts/webview-eval.mjs "window.__r"
 *
 * Requires a build with the WebView made inspectable — see `IOS_WEB_DEBUG` in ../README.md §5. A
 * stock TestFlight build is Release, where Capacitor leaves `isInspectable` false and the device
 * advertises nothing at all.
 */
import {createRequire} from 'node:module'

const require = createRequire(import.meta.url)
const WebSocket = require('ws')

const PROXY = process.env.IOS_DEBUG_PROXY ?? 'http://localhost:9222'
const expression = process.argv[2]

if (!expression) {
  console.error('usage: node ios/scripts/webview-eval.mjs "<javascript expression>"')
  process.exit(2)
}

let targets
try {
  targets = await (await fetch(`${PROXY}/json`)).json()
} catch {
  console.error(`No debug proxy at ${PROXY}. Start it with:  ios_webkit_debug_proxy`)
  process.exit(1)
}

const page = targets.find((t) => t.url?.startsWith('capacitor://')) ?? targets[0]
if (!page) {
  console.error(
    'Proxy is running but the phone advertises no inspectable page.\n' +
      '  - is the app in the foreground?\n' +
      '  - Settings > Safari > Advanced > Web Inspector enabled?\n' +
      '  - was this build made with IOS_WEB_DEBUG=1? (a stock Release build is never inspectable)',
  )
  process.exit(1)
}

const ws = new WebSocket(page.webSocketDebuggerUrl)
let targetId = null
let envelopeId = 1

const send = (method, params) =>
  ws.send(
    JSON.stringify({
      id: envelopeId++,
      method: 'Target.sendMessageToTarget',
      params: {targetId, message: JSON.stringify({id: envelopeId, method, params})},
    }),
  )

const finish = (text, code = 0) => {
  console.log(text)
  ws.close()
  process.exit(code)
}

ws.on('message', (raw) => {
  const msg = JSON.parse(raw.toString())

  if (msg.method === 'Target.targetCreated') {
    targetId = msg.params.targetInfo.targetId
    send('Runtime.enable', {})
    // The target needs a moment after Runtime.enable before it will accept an evaluation.
    setTimeout(() => send('Runtime.evaluate', {expression, returnByValue: true}), 300)
    return
  }

  if (msg.method !== 'Target.dispatchMessageFromTarget') return
  const inner = JSON.parse(msg.params.message)

  if (inner.result?.wasThrown || inner.result?.exceptionDetails) {
    finish(`EXCEPTION: ${JSON.stringify(inner.result).slice(0, 800)}`, 1)
  }
  if (inner.result?.result !== undefined) {
    const {value} = inner.result.result
    finish(typeof value === 'string' ? value : JSON.stringify(value ?? inner.result.result, null, 2))
  }
  if (inner.error) finish(`ERROR: ${JSON.stringify(inner.error).slice(0, 400)}`, 1)
})

ws.on('error', (e) => finish(`WebSocket error: ${e.message}`, 1))
setTimeout(() => finish('timed out waiting for the WebView', 1), 15000)
