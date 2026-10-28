import clsx from 'clsx'
import {useT} from 'web/lib/locale'

export type HouseRule = {title: string; text: string}

/**
 * The four rules for writing to someone on Compass, in one place so the onboarding, the about page
 * and the home page state the same thing in the same words.
 *
 * Framed as behaviour, not character. "Altruistic, introspective, not into looks" is who we hope
 * joins, but it is unverifiable and reads as gatekeeping, which scares off the shy genuine people
 * who worry they are not deep enough. What someone does in a first message is enforceable and sounds
 * fair, and each rule names its consequence — the enforcement is real (see
 * `common/src/moderation/first-message.ts` and `docs/first-messages.md`), and a rule without one
 * reads as a suggestion.
 */
export function useHouseRules(): HouseRule[] {
  const t = useT()
  return [
    {
      title: t('house_rules.read.title', 'React to what they wrote.'),
      text: t(
        'house_rules.read.text',
        'Your first message must pick up something specific from the profile: a value, a vision for their relationship, a prompt answer, a cause.',
      ),
    },
    {
      title: t('house_rules.values.title', 'Be curious about what they value.'),
      text: t(
        'house_rules.values.text',
        'Ask what matters to them, what they believe and what they want from a relationship, not only what they do on weekends.',
      ),
    },
    {
      title: t('house_rules.once.title', 'Never send the same opener twice.'),
      text: t(
        'house_rules.once.text',
        'A first message that matches one you already sent to someone else puts your account on hold for review.',
      ),
    },
    {
      title: t('house_rules.looks.title', 'Don’t open on looks.'),
      text: t('house_rules.looks.text', 'Comments on someone’s appearance get reported.'),
    },
  ]
}

/**
 * The rules as a numbered list. Numbered rather than ticked: the onboarding's `Bullets` marks
 * things you get, and these are things you do.
 */
export function HouseRulesList({className, dense}: {className?: string; dense?: boolean}) {
  const rules = useHouseRules()
  return (
    <ol className={clsx(dense ? 'space-y-3' : 'space-y-5', className)}>
      {rules.map((rule, i) => (
        <li key={rule.title} className="flex items-start gap-3">
          <span
            className={clsx(
              'flex flex-shrink-0 items-center justify-center rounded-full bg-primary-100 font-semibold tabular-nums text-primary-700 ring-1 ring-primary-200',
              dense ? 'mt-0.5 h-6 w-6 text-xs' : 'h-8 w-8 text-sm',
            )}
          >
            {i + 1}
          </span>
          <div className="min-w-0">
            <div className="font-semibold leading-snug text-ink-900">{rule.title}</div>
            <div
              className={clsx(
                'text-ink-600 leading-relaxed',
                dense ? 'mt-0.5 text-sm' : 'mt-1 text-sm',
              )}
            >
              {rule.text}
            </div>
          </div>
        </li>
      ))}
    </ol>
  )
}
