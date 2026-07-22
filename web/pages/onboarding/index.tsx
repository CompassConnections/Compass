import {CheckIcon} from '@heroicons/react/24/outline'
import clsx from 'clsx'
import Router from 'next/router'
import {useEffect, useState} from 'react'
import {Button} from 'web/components/buttons/button'
import {Col} from 'web/components/layout/col'
import {CompassLoadingIndicator} from 'web/components/widgets/loading-indicator'
import {StepProgress} from 'web/components/widgets/step-progress'
import {surface} from 'web/components/widgets/surface'
import {useT} from 'web/lib/locale'

const TOTAL_STEPS = 3

interface OnboardingStepProps {
  onNext: () => void
  onSkip: () => void
}

interface OnboardingScreenProps {
  step: number
  title: string
  content: React.ReactNode
  footerText?: string
  onNext: () => void
  onSkip: () => void
  onBack?: () => void
  continueText?: string
  welcomeTitle?: string
}

/**
 * Bulleted list for the onboarding screens.
 *
 * The steps used to render bare `<li>`s inside a `space-y-2` `<ul>` with the browser's list markers
 * suppressed by the CSS reset — so they read as loose unrelated sentences rather than a list. A ticked
 * marker also says something the plain text does not: these are things you get, not things you must do.
 */
function Bullets({items}: {items: string[]}) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3">
          <span className="mt-0.5 w-5 h-5 rounded-full bg-primary-100 ring-1 ring-primary-200 flex items-center justify-center flex-shrink-0">
            <CheckIcon className="w-3 h-3 text-primary-700" strokeWidth={2.5} />
          </span>
          <span className="text-ink-700">{item}</span>
        </li>
      ))}
    </ul>
  )
}

/**
 * The shell every onboarding step renders into.
 *
 * **Left-aligned body, centred nothing.** Every screen here is multi-line paragraphs plus a list, and
 * the old layout centred the paragraphs while left-aligning the lists inside them — so the text block
 * changed alignment mid-screen. Centred ragged-both-edges copy at this length is hard to read anyway;
 * left-aligning all of it resolves the inconsistency in the direction that reads better.
 *
 * The screen is now a `surface` card on the page background rather than bare text floating in the
 * viewport, which gives the flow the same material as /home and /about.
 */
function OnboardingScreen({
  step,
  title,
  content,
  footerText,
  onNext,
  onSkip,
  onBack,
  continueText = undefined,
  welcomeTitle,
}: OnboardingScreenProps) {
  const t = useT()
  const [showWelcome, setShowWelcome] = useState(!!welcomeTitle)

  useEffect(() => {
    if (welcomeTitle) {
      const timer = setTimeout(() => {
        setShowWelcome(false)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [welcomeTitle])

  return (
    <div className={clsx(surface, 'w-full max-w-2xl p-6 sm:p-10')}>
      <StepProgress
        current={step}
        total={TOTAL_STEPS}
        label={t('common.step_progress', 'Step {current} of {total}', {
          current: step,
          total: TOTAL_STEPS,
        })}
        className="mb-8"
      />

      {/* Keyed on the swap so the welcome-to-title change animates rather than snapping. */}
      <h1
        key={showWelcome ? 'welcome' : 'title'}
        className={clsx(
          'animate-fade-up font-bold tracking-tight text-balance mb-5',
          showWelcome
            ? 'text-[clamp(30px,5vw,44px)] text-primary-700'
            : 'text-[clamp(26px,4vw,36px)] text-ink-900',
        )}
      >
        {showWelcome && welcomeTitle ? welcomeTitle : title}
      </h1>

      <div className="text-base sm:text-lg text-ink-700 leading-relaxed space-y-4">{content}</div>

      {footerText && (
        // Was `italic text-ink-500` — 3.5:1, and italic at 14px is the least legible thing on the
        // screen. Now a bounded aside that reads as a footnote through position and rule, not slant.
        <p className="mt-7 pl-4 border-l-2 border-primary-200 text-sm text-ink-600 leading-relaxed">
          {footerText}
        </p>
      )}

      <Col className="gap-4 mt-9">
        <Button onClick={onNext} size="lg" className="w-full">
          {continueText ?? t('common.continue', 'Continue')}
        </Button>
        <div className="flex items-center justify-between gap-4">
          {/* Back moved down here beside Skip. It used to sit alone above the title, where it read as
              page chrome rather than as one of this screen's two secondary actions. */}
          {onBack ? (
            <button
              onClick={onBack}
              className="text-sm font-medium text-ink-700 hover:text-ink-900 transition-colors"
            >
              ← {t('common.back', 'Back')}
            </button>
          ) : (
            <span />
          )}
          <button
            onClick={onSkip}
            className="text-sm font-medium text-ink-700 hover:text-ink-900 underline underline-offset-4 transition-colors"
          >
            {t('onboarding.skip', 'Skip onboarding')}
          </button>
        </div>
      </Col>
    </div>
  )
}

function Step1NoHiddenAlgorithms({onNext, onSkip}: OnboardingStepProps) {
  const t = useT()
  const content = (
    <>
      <p>{t('onboarding.step1.body1', 'Compass does not decide who you should see.')}</p>
      <p>
        {t(
          'onboarding.step1.body2',
          'There is no engagement algorithm, no swipe-ranking, no boosted profiles, and no attention optimization. You can browse the full database, apply your own filters, and see exactly why someone matches with you.',
        )}
      </p>
      <p className="font-semibold text-ink-900">
        {t('onboarding.step1.body3', 'You stay in control of discovery. Always.')}
      </p>
    </>
  )

  return (
    <OnboardingScreen
      step={1}
      title={t('onboarding.step1.title', 'No black box. No manipulation.')}
      content={content}
      footerText={t('onboarding.step1.footer', 'Transparency is a core principle, not a feature.')}
      onNext={onNext}
      onSkip={onSkip}
      welcomeTitle={t('onboarding.welcome', 'Welcome to Compass!')}
    />
  )
}

function Step2SearchBeatsSwiping({
  onNext,
  onSkip,
  onBack,
}: OnboardingStepProps & {onBack: () => void}) {
  const t = useT()
  const content = (
    <>
      <p>
        {t(
          'onboarding.step2.body1',
          'Instead of endless swiping, Compass lets you search intentionally.',
        )}
      </p>
      <p>{t('onboarding.step2.body2', 'Look for people by:')}</p>
      <Bullets
        items={[
          t('onboarding.step2.item1', 'Interests and keywords'),
          t('onboarding.step2.item2', 'Values and ideas'),
          t('onboarding.step2.item3', 'Compatibility answers'),
          t('onboarding.step2.item4', 'Location and intent'),
        ]}
      />
      <p>
        {t(
          'onboarding.step2.body3',
          'You can save searches and get notified when new people match them. No need to check the app every day.',
        )}
      </p>
    </>
  )

  return (
    <OnboardingScreen
      step={2}
      title={t('onboarding.step2.title', "Search, don't scroll.")}
      content={content}
      footerText={t('onboarding.step2.footer', 'Less noise. More signal.')}
      onNext={onNext}
      onSkip={onSkip}
      onBack={onBack}
    />
  )
}

function Step3CompatibilityInspect({
  onNext,
  onSkip,
  onBack,
}: OnboardingStepProps & {onBack: () => void}) {
  const t = useT()
  const content = (
    <>
      <p>{t('onboarding.step3.body1', "Matches aren't magic or mysterious.")}</p>
      <p>
        {t('onboarding.step3.body2', 'Your compatibility score comes from explicit questions:')}
      </p>
      <Bullets
        items={[
          t('onboarding.step3.item1', 'Your answer'),
          t('onboarding.step3.item2', 'What answers you accept from others'),
          t('onboarding.step3.item3', 'How important each question is to you'),
        ]}
      />
      <p>
        {t(
          'onboarding.step3.body3',
          'You can inspect, question, and improve the system. The full math is open source.',
        )}
      </p>
    </>
  )

  return (
    <OnboardingScreen
      step={3}
      title={t('onboarding.step3.title', 'Compatibility you can understand.')}
      content={content}
      footerText={t(
        'onboarding.step3.footer',
        'If you disagree with how it works, you can help change it.',
      )}
      onNext={onNext}
      onSkip={onSkip}
      onBack={onBack}
      continueText={t('onboarding.step3.continue', 'Get started')}
    />
  )
}

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0)

  const handleNext = () => {
    window.scrollTo(0, 0)
    setCurrentStep(currentStep + 1)
  }

  const handleBack = () => {
    window.scrollTo(0, 0)
    setCurrentStep(currentStep - 1)
  }

  const handleSkip = () => {
    Router.push('/signup')
  }

  const handleComplete = () => {
    Router.push('/signup')
    return <CompassLoadingIndicator />
  }

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <Step1NoHiddenAlgorithms onNext={handleNext} onSkip={handleSkip} />
      case 1:
        return (
          <Step2SearchBeatsSwiping onNext={handleNext} onSkip={handleSkip} onBack={handleBack} />
        )
      case 2:
        return (
          <Step3CompatibilityInspect
            onNext={handleComplete}
            onSkip={handleSkip}
            onBack={handleBack}
          />
        )
      default:
        return handleComplete()
    }
  }

  return (
    // <PageBase>
    //   <SEO
    //     title="Welcome to Compass - Onboarding"
    //     description="Get started with Compass - transparent dating without algorithms"
    //   />
    <Col className="min-h-screen items-center justify-center px-5 py-10">
      {/* Keyed on the step so each screen enters rather than swapping in place — the three screens are
          near-identical in shape, and without the transition a click reads as "nothing happened". */}
      <div key={currentStep} className="animate-fade-up w-full flex justify-center">
        {renderStep()}
      </div>
    </Col>
    // </PageBase>
  )
}
