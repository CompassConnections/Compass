import {ArrowRightIcon, CheckIcon} from '@heroicons/react/24/outline'
import clsx from 'clsx'
import Router from 'next/router'
import {useState} from 'react'
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

      {/* The welcome used to replace the title for two seconds and then swap out. Now it is a
          permanent line above the title, so the screen reads the same whenever you look at it. */}
      {welcomeTitle && (
        <p className="mb-2 text-base sm:text-lg font-semibold text-primary-700">{welcomeTitle}</p>
      )}
      <h1 className="font-bold tracking-tight text-balance mb-5 text-[clamp(26px,4vw,36px)] text-ink-900">
        {title}
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
        {/* This is the one action the screen wants you to take, but it was rendering with `Button`'s
            default `gray-outline` — a hairline pill with `text-ink-700` copy, quieter than the
            underlined "Skip onboarding" sitting right below it. `cta` is the conversion style the
            sign-up button already uses, so the flow's forward action looks the same throughout.
            The arrow nudges right on hover to signal "next" rather than "submit". */}
        <Button
          onClick={onNext}
          size="xl"
          color="cta"
          className="group w-full gap-2 py-3.5 text-lg"
        >
          {continueText ?? t('common.continue', 'Continue')}
          <ArrowRightIcon
            className="w-5 h-5 transition-transform group-hover:translate-x-1"
            strokeWidth={2.5}
          />
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
  // One idea per step, said once. The first draft of these screens restated each point three times
  // (body, bold closer, footer) and previewed the next two steps' topics — a reader on Reddit called
  // it out as padding. Step 1 is only: nobody ranks or picks for you. How you find people is step 2,
  // how a score is built is step 3.
  const content = (
    <p>
      {t(
        'onboarding.step1.body1',
        'Compass is a directory. Every member is listed, no profile is ranked or boosted, and there is no algorithm choosing for you.',
      )}
    </p>
  )

  return (
    <OnboardingScreen
      step={1}
      title={t('onboarding.step1.title', 'No one decides who you see')}
      content={content}
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
          'Filter members by interests, values, location, and demographics, or search the words in their profiles.',
        )}
      </p>
      <p>
        {t(
          'onboarding.step2.body2',
          "Save a search and we'll notify you when someone new matches it.",
        )}
      </p>
    </>
  )

  return (
    <OnboardingScreen
      step={2}
      title={t('onboarding.step2.title', 'Search for the people you want to meet')}
      content={content}
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
      <p>
        {t(
          'onboarding.step3.body1',
          'Your score with someone comes from the compatibility questions, using three things you set yourself:',
        )}
      </p>
      <Bullets
        items={[
          t('onboarding.step3.item1', 'Your own answer'),
          t('onboarding.step3.item2', 'Which answers you would accept from them'),
          t('onboarding.step3.item3', 'How much the question matters to you'),
        ]}
      />
      <p>
        {t(
          'onboarding.step3.body2',
          'On any profile you can see, question by question, where you agree. The formula is open source, so you can read it and propose changes.',
        )}
      </p>
    </>
  )

  return (
    <OnboardingScreen
      step={3}
      title={t('onboarding.step3.title', 'A compatibility score you can check')}
      content={content}
      onNext={onNext}
      onSkip={onSkip}
      onBack={onBack}
      continueText={t('onboarding.step3.continue', 'Get started')}
    />
  )
}

/**
 * The one screen here that is about other people rather than about the product.
 *
 * It is last on purpose: the first three explain what Compass does differently, and this one is the
 * thing that is true of every platform where strangers talk. Three lines, no lecture — the depth lives
 * on `/safety`, and the job of this screen is only to make sure nobody meets their first person here
 * without having seen the three patterns once.
 */
// function Step4StayingSafe({onNext, onSkip, onBack}: OnboardingStepProps & {onBack: () => void}) {
//   const t = useT()
//   const content = (
//     <>
//       <p>
//         {t(
//           'onboarding.step4.body1',
//           'Almost everyone here is exactly who they say they are. A few are not, and they all behave the same way.',
//         )}
//       </p>
//       <Bullets
//         items={[
//           t(
//             'onboarding.step4.item1',
//             'They push to move to WhatsApp or Telegram within a few messages',
//           ),
//           t('onboarding.step4.item2', 'They always have a reason not to get on a video call'),
//           t('onboarding.step4.item3', 'Sooner or later, there is money involved'),
//         ]}
//       />
//       <p>
//         {t(
//           'onboarding.step4.body2',
//           'Meet in public, get yourself there and back, and tell a friend where you are going.',
//         )}{' '}
//         <Link
//           href="/safety"
//           target="_blank"
//           className="text-primary-600 hover:text-primary-800 underline underline-offset-4"
//         >
//           {t('safety.link', 'Read the safety guide')}
//         </Link>
//       </p>
//     </>
//   )
//
//   return (
//     <OnboardingScreen
//       step={4}
//       title={t('onboarding.step4.title', 'Meeting people you have not met yet.')}
//       content={content}
//       footerText={t(
//         'onboarding.step4.footer',
//         'Reporting an account is private — they never find out — and it is how we catch the ones doing this to twenty people at once.',
//       )}
//       onNext={onNext}
//       onSkip={onSkip}
//       onBack={onBack}
//       continueText={t('onboarding.step3.continue', 'Get started')}
//     />
//   )
// }

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
          <Step3CompatibilityInspect onNext={handleNext} onSkip={handleSkip} onBack={handleBack} />
        )
      // case 3:
      //   return <Step4StayingSafe onNext={handleComplete} onSkip={handleSkip} onBack={handleBack} />
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
