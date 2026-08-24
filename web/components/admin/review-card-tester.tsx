import {StarIcon} from '@heroicons/react/24/solid'
import {useState} from 'react'
import {Button} from 'web/components/buttons/button'
import {Col} from 'web/components/layout/col'
import {Row} from 'web/components/layout/row'
import {surface} from 'web/components/widgets/surface'
import {reviewEnvironment, showReviewCardNow} from 'web/hooks/use-review-prompt'

/**
 * Fires the native store review card on demand, bypassing every trigger and suppression rule.
 *
 * This tests the *plumbing* — is `@capacitor-community/in-app-review` actually compiled into this
 * build and reachable from the WebView — which is a question about the native project rather than
 * about when we ask. The policy half is unit-tested in `common/tests/unit/review-prompt.test.ts`,
 * where it can be tested properly.
 *
 * Nothing here writes a `review_prompts` row, on purpose: an admin testing the wiring must not spend
 * one of their own three yearly asks, and must not leave a row that the yield numbers are later read
 * out of.
 *
 * Not translated — same reason as the rest of /admin.
 */
export function ReviewCardTester() {
  const [state, setState] = useState<'idle' | 'running' | 'resolved' | 'failed'>('idle')
  const [error, setError] = useState<string | null>(null)

  // Read on click rather than at render: a static export is prerendered with no device attached, so
  // anything read in a render body is baked into HTML served to every platform.
  const [env, setEnv] = useState<ReturnType<typeof reviewEnvironment> | null>(null)

  const run = async () => {
    setEnv(reviewEnvironment())
    setState('running')
    setError(null)
    try {
      await showReviewCardNow()
      setState('resolved')
    } catch (e) {
      setState('failed')
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  return (
    <Col className={`${surface} gap-3 p-4`}>
      <Row className={'items-start gap-3'}>
        <StarIcon className={'text-primary-600 mt-0.5 h-5 w-5 flex-shrink-0'} />
        <Col className={'gap-1'}>
          <div className={'text-ink-900 font-medium'}>Store review card</div>
          <div className={'text-ink-500 text-sm'}>
            Fires the native card immediately, ignoring every trigger and cooldown. Records nothing.
          </div>
        </Col>
      </Row>

      <Row className={'items-center gap-3'}>
        <Button color="indigo-outline" onClick={run} loading={state === 'running'}>
          Show the card now
        </Button>
        {env && (
          <span className={'text-ink-400 text-xs'}>
            {env.isApp ? `native · ${env.platform}` : `browser · ${env.platform}`}
          </span>
        )}
      </Row>

      {state === 'resolved' && env && <Resolved platform={env.platform} />}
      {state === 'failed' && <Failed platform={env?.platform} error={error} />}
    </Col>
  )
}

/**
 * "It resolved" is worth strikingly different amounts on the two platforms, so this refuses to say
 * "success" on its own. iOS resolves unconditionally — the Swift plugin calls `call.resolve()` even
 * when it found no foreground window scene and therefore did nothing at all. Android only resolves
 * once Play has actually run the flow.
 */
function Resolved({platform}: {platform: string}) {
  return (
    <Col className={'border-canvas-200 gap-1 border-l-2 pl-3 text-sm'}>
      <div className={'text-ink-900 font-medium'}>The call resolved.</div>
      {platform === 'ios' ? (
        <div className={'text-ink-500'}>
          On iOS that means very little: the plugin resolves unconditionally, even when it found no
          foreground scene and did nothing. A <span className={'font-medium'}>debug</span> build
          shows the card every time and unthrottled; TestFlight never shows it; only a production
          build is throttled the way a member&rsquo;s is. If you saw a card, the plumbing works.
        </div>
      ) : platform === 'android' ? (
        <div className={'text-ink-500'}>
          On Android this is meaningful — Play ran the flow. It still does not mean a card appeared:
          the quota is silent, and a member who is out of asks gets nothing while the call resolves
          exactly like this.
        </div>
      ) : (
        <div className={'text-ink-500'}>
          Unexpected on this platform — the web implementation is supposed to throw.
        </div>
      )}
    </Col>
  )
}

function Failed({platform, error}: {platform?: string; error: string | null}) {
  return (
    <Col className={'border-canvas-200 gap-1 border-l-2 pl-3 text-sm'}>
      <div className={'text-ink-900 font-medium'}>The call threw.</div>
      <div className={'text-error font-mono text-xs break-all'}>{error}</div>
      {platform === 'android' ? (
        <div className={'text-ink-500'}>
          Expected on a sideloaded or debug build: Play cannot verify an install it did not make, so
          <span className={'font-mono text-xs'}> requestReviewFlow </span> fails outright. Test on
          the internal testing track, or via internal app sharing, on a device with the Play Store.
        </div>
      ) : platform === 'ios' ? (
        <div className={'text-ink-500'}>
          Unusual on iOS, where the plugin resolves unconditionally. A throw here points at the
          plugin not being in the build at all — check the pod in{' '}
          <span className={'font-mono text-xs'}>ios/App/Podfile</span> and the entry in{' '}
          <span className={'font-mono text-xs'}>capacitor.config.ts</span>&rsquo;s{' '}
          <span className={'font-mono text-xs'}>includePlugins</span>.
        </div>
      ) : (
        <div className={'text-ink-500'}>
          Expected in a browser — the plugin has no web implementation. This still confirms the JS
          side is wired up; run it inside the app to test the native half.
        </div>
      )}
    </Col>
  )
}
