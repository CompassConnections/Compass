import clsx from 'clsx'
import {ReactNode, useEffect, useState} from 'react'
import {eyebrow} from 'web/components/widgets/surface'
import {useAPIGetter} from 'web/hooks/use-api-getter'
import {useCountUp} from 'web/hooks/use-count-up'
import {useSafeLayoutEffect} from 'web/hooks/use-safe-layout-effect'
import {useT} from 'web/lib/locale'

/**
 * The live number band at the top of the about page (A5 in docs/marketing-visuals.md).
 *
 * It opens the page with something that is not a card — ten of the page's blocks are the same bordered
 * tile, which is what made it read as flat.
 *
 * The country breakdown that used to sit beside it now lives on /stats
 * (`widgets/country-spread.tsx`): it is a distribution readout for someone who came to read numbers,
 * and this page only needed one claim about reach, which the member count already makes.
 *
 * **Never hardcoded.** Same reasoning as `MemberGrowth`: a number that quietly goes stale on a page
 * arguing for transparency is the failure worth engineering against. And for the same reason it
 * renders *nothing* on an empty or failed response rather than a zero or a skeleton — an empty frame
 * claims more than it shows.
 *
 * Deliberately kept away from the vote tally further down the page. Twelve voters next to a large
 * member count is the turnout tension A1 was placed on this page to manage, not to advertise.
 *
 * **The count-up is an argument, not decoration.** The measured numbers spin up — oversized, heavier,
 * slightly blurred, settling into place — and the price does not move at all. Once the others land, the
 * `$0` is the only thing left to look at, and it pulls focus by *failing* to climb: it lifts and drops
 * back twice, stuck. Everything about the platform grows except what it costs.
 */

const COUNT_MS = 1500
/** Stagger between the measured stats. Small — the point is a ripple, not a queue. */
const STAGGER_MS = 160
/** Beat between the last number settling and the price taking over. */
const HANDOFF_MS = 220

function formatCount(n: number) {
  return n >= 10000 ? `${Math.floor(n / 1000)}k` : n.toLocaleString('en-US')
}

function Stat({value, label}: {value: ReactNode; label: string}) {
  return (
    <div className="flex-1 min-w-[110px]">
      <div className="font-heading text-[clamp(30px,4vw,46px)] font-bold text-ink-900 leading-none tracking-tight tabular-nums">
        {value}
      </div>
      <div className={clsx(eyebrow, 'text-ink-700 mt-2.5')}>{label}</div>
    </div>
  )
}

/**
 * One measured number, counting up.
 *
 * The type styling rides the *raw* progress rather than the eased value: the number decelerates hard so
 * the last digits settle, but the scale/weight/blur have to keep moving while it does, or the type looks
 * finished while the digits are still churning.
 */
function CountingStat({
  target,
  label,
  delay,
  run,
}: {
  target: number
  label: string
  delay: number
  run: boolean
}) {
  const {value, progress} = useCountUp(target, {run, duration: COUNT_MS, delay})
  const spinning = run && progress < 1

  return (
    <Stat
      label={label}
      value={
        <span
          className={clsx('inline-block origin-left', run && !spinning && 'sb-settle')}
          style={
            spinning
              ? {
                  transform: `scale(${1 + 0.26 * (1 - progress)})`,
                  fontWeight: 400 + Math.round(300 * progress),
                  letterSpacing: `${0.03 * (1 - progress)}em`,
                  filter: `blur(${1.1 * (1 - progress)}px)`,
                  opacity: 0.5 + 0.5 * progress,
                }
              : undefined
          }
        >
          {formatCount(value)}
        </span>
      }
    />
  )
}

/**
 * A rule-bounded band rather than a row of cards. The point is to break the card rhythm, so borrowing
 * the card treatment would defeat it.
 */
export function StatBand() {
  const t = useT()
  const {data} = useAPIGetter('stats', {})

  // A callback ref held in state rather than `useRef`, because this component renders `null` until the
  // stats arrive: with a plain ref the observer effect runs once against a node that does not exist yet
  // and never re-runs when it appears, so the animation only ever played on a cache-warm client
  // navigation and never on a cold page load.
  const [node, setNode] = useState<HTMLDivElement | null>(null)
  const [armed, setArmed] = useState(false)
  const [run, setRun] = useState(false)
  const [settled, setSettled] = useState(false)

  // Same shape as `Reveal`: arm before first paint, and never arm at all under reduced motion — those
  // visitors get the final numbers with no animation rather than an animation we merely shortened.
  useSafeLayoutEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    setArmed(true)
  }, [])

  useEffect(() => {
    if (!armed || !node || run) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        setRun(true)
        observer.disconnect()
      },
      {rootMargin: '0px 0px -10% 0px', threshold: 0.01},
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [armed, node, run])

  // Countries used to be the second stat here and is now gone. Fifty-five countries across ~700 members is
  // *dispersion*, not reach — it is the figure that quietly says "nobody near you" while presenting itself
  // as an achievement, and it was the second thing on the page. Messages sits beside conversations instead
  // and answers the question a visitor is actually asking of a small platform: does anyone reply. The full
  // country breakdown still lives on /stats, where someone came to read numbers.
  const showConversations = !!data && data.conversations > 0
  const showMessages = !!data && data.messages > 0
  const lastDelay = STAGGER_MS * ((showConversations ? 1 : 0) + (showMessages ? 1 : 0))

  useEffect(() => {
    if (!run) return
    const id = setTimeout(() => setSettled(true), lastDelay + COUNT_MS + HANDOFF_MS)
    return () => clearTimeout(id)
  }, [run, lastDelay])

  if (!data?.profiles) return null

  // Reduced-motion and no-JS visitors never enter the dimmed pre-settle state.
  const priceLit = !armed || settled

  let delay = 0
  const next = () => (delay += STAGGER_MS)

  return (
    <div ref={setNode} className="border-y border-canvas-200 py-8 flex flex-wrap gap-x-10 gap-y-7">
      <style>{styles}</style>
      <CountingStat
        target={data.profiles}
        label={t('about.stat.members', 'Members')}
        delay={0}
        run={run}
      />
      {showConversations && (
        <CountingStat
          target={data.conversations}
          label={t('about.stat.conversations', 'Conversations')}
          delay={next()}
          run={run}
        />
      )}
      {showMessages && (
        <CountingStat
          target={data.messages}
          label={t('about.stat.messages', 'Messages')}
          delay={next()}
          run={run}
        />
      )}
      {/* Not a queried number, and deliberately so: it is the one claim here that is a policy rather
          than a measurement, and it is the whole argument of the "Completely Free" card. */}
      <Stat
        label={t('about.stat.price', 'Cost to use')}
        value={
          <span className="relative inline-block">
            {armed && settled && <span aria-hidden className="sb-zero-glow" />}
            <span
              className={clsx(
                'relative inline-block origin-left transition-colors duration-700',
                armed && settled && 'sb-zero-stuck',
                priceLit ? 'text-ink-900' : 'text-ink-900/40',
              )}
            >
              {t('about.stat.price_value', '$0')}
            </span>
          </span>
        }
      />
      {/* One line, and only one. An earlier draft added a sentence here about how thinly the membership is
          spread; it was cut because this is the page's second element and the reader has not yet been given
          a single reason to want in — self-criticism before value is just discouragement. The same point is
          made properly on the home page, attached to something to do about it. */}
      <p className="w-full text-sm text-ink-500">
        {t('about.stat.caption', 'Read live from the database, not from a press kit.')}
      </p>
    </div>
  )
}

/**
 * Kept as plain keyframes rather than Tailwind config entries: they are single-use and only meaningful
 * as a sequence, and the config's animation list is already long enough to be hard to read.
 */
const styles = `
.sb-settle{animation:sb-settle .42s cubic-bezier(.2,.9,.25,1) both}
@keyframes sb-settle{0%{transform:scale(1.07)}55%{transform:scale(.985)}100%{transform:scale(1)}}

/* Lifts and falls back twice, then gives up at its starting position — the "stuck at zero" beat. */
.sb-zero-stuck{animation:sb-zero-stuck 1.5s cubic-bezier(.3,.7,.3,1) both}
@keyframes sb-zero-stuck{
  0%{transform:translateY(0) scale(1)}
  18%{transform:translateY(0) scale(1.2)}
  34%{transform:translateY(-9px) scale(1.2)}
  50%{transform:translateY(0) scale(1.2)}
  64%{transform:translateY(-4px) scale(1.15)}
  78%{transform:translateY(0) scale(1.13)}
  100%{transform:translateY(0) scale(1)}
}

.sb-zero-glow{position:absolute;left:50%;top:50%;width:150%;padding-bottom:150%;transform:translate(-50%,-50%);
  border-radius:9999px;pointer-events:none;
  background:radial-gradient(circle,rgb(var(--color-primary-500)/.30),rgb(var(--color-primary-500)/0) 68%);
  animation:sb-zero-glow 1.5s ease-out both}
@keyframes sb-zero-glow{0%{opacity:0}22%{opacity:1}100%{opacity:0}}

@media (prefers-reduced-motion: reduce){
  .sb-settle,.sb-zero-stuck,.sb-zero-glow{animation:none}
}
`
