import {
  JobApplication,
  MAX_APPLICATION_ABOUT_LENGTH,
  MAX_APPLICATION_AVAILABILITY_LENGTH,
  MAX_APPLICATION_PLAN_LENGTH,
  MAX_APPLICATION_RATE_LENGTH,
  PositionId,
} from 'common/careers'
import {debug} from 'common/logger'
import Link from 'next/link'
import {FormEvent, useEffect, useState} from 'react'
import toast from 'react-hot-toast'
import {Button} from 'web/components/buttons/button'
import {ExpandingInput} from 'web/components/widgets/expanding-input'
import {surface} from 'web/components/widgets/surface'
import {useAPIGetter} from 'web/hooks/use-api-getter'
import {useUser} from 'web/hooks/use-user'
import {api} from 'web/lib/api'
import {useLocale, useT} from 'web/lib/locale'
import {promptSignIn} from 'web/lib/util/signup'

type Answers = Pick<JobApplication, 'about' | 'plan' | 'rate' | 'availability'>

const EMPTY: Answers = {about: '', plan: '', rate: '', availability: ''}

const fieldClass = 'w-full !leading-normal py-3 text-ink-900 placeholder:text-ink-500'

function Field(props: {
  id: keyof Answers
  label: string
  hint?: string
  max: number
  rows: number
  value: string
  onChange: (value: string) => void
}) {
  const {id, label, hint, max, rows, value, onChange} = props
  const hintId = `application-${id}-hint`
  return (
    <div>
      <label htmlFor={`application-${id}`} className="block font-semibold text-ink-900">
        {label}
      </label>
      {hint && (
        <p id={hintId} className="mt-1 text-sm text-ink-800">
          {hint}
        </p>
      )}
      <ExpandingInput
        id={`application-${id}`}
        aria-describedby={hint ? hintId : undefined}
        className={`${fieldClass} mt-2`}
        rows={rows}
        maxLength={max}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {/* Shown only near the limit: a counter under each of four fields is noise until it matters. */}
      {value.length > max * 0.9 && (
        <p className="mt-1 text-right text-caption text-ink-800" aria-live="polite">
          {value.length} / {max}
        </p>
      )}
    </div>
  )
}

/**
 * The application form under a position on `/careers`.
 *
 * Applying needs an account, on purpose: the applicant has then seen the product they would promote,
 * and the application arrives tied to a profile instead of to whatever name a visitor typed. A
 * logged-out visitor gets the two ways in; `/signin` brings them back here.
 */
export function ApplicationForm(props: {position: PositionId; positionTitle: string}) {
  const {position, positionTitle} = props
  const t = useT()
  const {locale} = useLocale()
  const user = useUser()

  // `undefined` props hold the request back until we know someone is signed in.
  const {data} = useAPIGetter('get-my-job-applications', user ? {} : undefined)
  const existing = data?.applications.find((a) => a.position === position)

  const [answers, setAnswers] = useState<Answers>(EMPTY)
  const [sent, setSent] = useState<JobApplication | undefined>(undefined)
  const [submitting, setSubmitting] = useState(false)

  // Fill in what they sent before, unless they have already started typing while it loaded.
  useEffect(() => {
    if (!existing) return
    setSent((current) => current ?? existing)
    setAnswers((current) =>
      Object.values(current).some((v) => v !== '')
        ? current
        : {
            about: existing.about,
            plan: existing.plan,
            rate: existing.rate,
            availability: existing.availability,
          },
    )
  }, [existing?.updatedTime])

  const set = (key: keyof Answers) => (value: string) => setAnswers((a) => ({...a, [key]: value}))

  const complete = Object.values(answers).every((v) => v.trim() !== '')

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!complete || submitting) return
    setSubmitting(true)
    const wasUpdate = !!sent
    try {
      const {application} = await api('apply-to-position', {position, ...answers})
      setSent(application)
      toast.success(
        wasUpdate
          ? t('careers.form.toast.updated', 'Application updated')
          : t('careers.form.toast.sent', 'Application sent'),
      )
    } catch (err) {
      debug('apply-to-position failed', err)
      toast.error(
        t(
          'careers.form.toast.failed',
          'Your application was not sent. Check your connection and send it again.',
        ),
      )
    } finally {
      setSubmitting(false)
    }
  }

  const heading = (
    <h3 className="text-title text-ink-900">
      {t('careers.form.title', 'Apply for {position}', {position: positionTitle})}
    </h3>
  )

  // Auth still resolving: render nothing instead of flashing the sign-in prompt at a member.
  if (user === undefined) return null

  if (user === null) {
    return (
      <div className={`${surface} p-6 sm:p-8`}>
        {heading}
        <p className="mt-3 max-w-prose text-ink-800">
          {t(
            'careers.form.signed_out',
            'You need an account to apply, so you can see what you would be promoting.',
          )}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-lg bg-cta px-4 py-2 font-semibold text-white transition-colors hover:bg-cta-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas-50"
          >
            {t('careers.form.create_account', 'Create an account')}
          </Link>
          <Button color="gray-outline" size="lg" onClick={() => promptSignIn()}>
            {t('careers.form.sign_in', 'Sign in')}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className={`${surface} p-6 sm:p-8`}>
      {heading}
      {sent && (
        <p
          role="status"
          className="mt-3 rounded-md border-l-4 border-green-500 bg-canvas-100 px-4 py-3 text-ink-900"
        >
          {t(
            'careers.form.sent_on',
            'Application sent on {date}. You can change your answers and send it again.',
            {
              date: new Date(sent.updatedTime).toLocaleDateString(locale, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              }),
            },
          )}
        </p>
      )}
      <div className="mt-6 flex flex-col gap-6">
        <Field
          id="about"
          label={t('careers.form.about.label', 'About you')}
          hint={t(
            'careers.form.about.hint',
            'A few lines about who you are, with links to anything you have grown or written.',
          )}
          max={MAX_APPLICATION_ABOUT_LENGTH}
          rows={4}
          value={answers.about}
          onChange={set('about')}
        />
        <Field
          id="plan"
          label={t('careers.form.plan.label', 'Your first month')}
          hint={t(
            'careers.form.plan.hint',
            'What would you try in your first month to bring the right people to Compass? Under 300 words.',
          )}
          max={MAX_APPLICATION_PLAN_LENGTH}
          rows={6}
          value={answers.plan}
          onChange={set('plan')}
        />
        <Field
          id="rate"
          label={t('careers.form.rate.label', 'Your hourly rate')}
          hint={t('careers.form.rate.hint', 'Include the currency.')}
          max={MAX_APPLICATION_RATE_LENGTH}
          rows={1}
          value={answers.rate}
          onChange={set('rate')}
        />
        <Field
          id="availability"
          label={t('careers.form.availability.label', 'Hours per week and time zone')}
          max={MAX_APPLICATION_AVAILABILITY_LENGTH}
          rows={1}
          value={answers.availability}
          onChange={set('availability')}
        />
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <Button type="submit" color="cta" size="lg" disabled={!complete} loading={submitting}>
          {sent
            ? t('careers.form.update', 'Update application')
            : t('careers.form.send', 'Send application')}
        </Button>
        {!complete && (
          <p className="text-sm text-ink-800">
            {t('careers.form.incomplete', 'Fill in all four answers to send.')}
          </p>
        )}
      </div>
    </form>
  )
}
