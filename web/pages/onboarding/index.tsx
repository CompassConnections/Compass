import {useState} from 'react'
import {Col} from 'web/components/layout/col'
import Router from 'next/router'
import {Button} from 'web/components/buttons/button'
import {CompassLoadingIndicator} from "web/components/widgets/loading-indicator";
import {useT} from "web/lib/locale";

interface OnboardingStepProps {
  onNext: () => void
  onSkip: () => void
}

interface OnboardingScreenProps {
  title: string
  content: React.ReactNode
  footerText?: string
  onNext: () => void
  onSkip: () => void
  onBack?: () => void
  continueText?: string
  welcomeTitle?: string
}

function OnboardingScreen({
                            title,
                            content,
                            footerText,
                            onNext,
                            onSkip,
                            onBack,
                            continueText = undefined,
                            welcomeTitle
                          }: OnboardingScreenProps) {
  const t = useT()
  return (
    <Col className="max-w-2xl mx-auto text-center px-6 py-12">
      {onBack && (
        <div className="self-start mb-4">
          <button
            onClick={onBack}
            className="text-ink-500 hover:text-ink-700 text-sm"
          >
            ← {t("common.back", "Back")}
          </button>
        </div>
      )}

      {welcomeTitle && (
        <h2 className="text-5xl text-gray-500 mb-4 animate-fade-in animate-fade-out-slow">
          {welcomeTitle}
        </h2>
      )}

      <h1 className="text-4xl font-bold text-ink-900 mb-6">
        {title}
      </h1>

      <div className="text-lg text-ink-700 leading-relaxed mb-8">
        {content}
      </div>

      {footerText && (
        <p className="text-sm text-ink-500 italic mb-8">
          {footerText}
        </p>
      )}

      <Col className="gap-4">
        <Button
          onClick={onNext}
          size="lg"
          className="w-full max-w-xs mx-auto"
        >
          {continueText ?? t('common.continue', 'Continue')}
        </Button>
        <button
          onClick={onSkip}
          className="text-sm text-ink-500 hover:text-ink-700 underline"
        >
          {t('onboarding.skip', 'Skip onboarding')}
        </button>
      </Col>
    </Col>
  )
}

function Step1NoHiddenAlgorithms({onNext, onSkip}: OnboardingStepProps) {
  const t = useT()
  const content = (
    <div className="space-y-4">
      <p>
        {t('onboarding.step1.body1', 'Compass does not decide who you should see.')}
      </p>
      <p>
        {t('onboarding.step1.body2', 'There is no engagement algorithm, no swipe-ranking, no boosted profiles, and no attention optimization. You can browse the full database, apply your own filters, and see exactly why someone matches with you.')}
      </p>
      <p className="font-semibold">
        {t('onboarding.step1.body3', 'You stay in control of discovery. Always.')}
      </p>
    </div>
  )

  return (
    <OnboardingScreen
      title={t('onboarding.step1.title', 'No black box. No manipulation.')}
      content={content}
      footerText={t('onboarding.step1.footer', 'Transparency is a core principle, not a feature.')}
      onNext={onNext}
      onSkip={onSkip}
      welcomeTitle={t('onboarding.welcome', 'Welcome to Compass!')}
    />
  )
}

function Step2SearchBeatsSwiping({onNext, onSkip, onBack}: OnboardingStepProps & { onBack: () => void }) {
  const t = useT()
  const content = (
    <div className="space-y-4">
      <p>
        {t('onboarding.step2.body1', 'Instead of endless swiping, Compass lets you search intentionally.')}
      </p>
      <p className="text-left max-w-md mx-auto">
        {t('onboarding.step2.body2', 'Look for people by:')}
      </p>
      <ul className="text-left max-w-md mx-auto space-y-2">
        <li>{t('onboarding.step2.item1', 'Interests and keywords')}</li>
        <li>{t('onboarding.step2.item2', 'Values and ideas')}</li>
        <li>{t('onboarding.step2.item3', 'Compatibility answers')}</li>
        <li>{t('onboarding.step2.item4', 'Location and intent')}</li>
      </ul>
      <p>
        {t('onboarding.step2.body3', 'You can save searches and get notified when new people match them. No need to check the app every day.')}
      </p>
    </div>
  )

  return (
    <OnboardingScreen
      title={t('onboarding.step2.title', 'Search, don\'t scroll.')}
      content={content}
      footerText={t('onboarding.step2.footer', 'Less noise. More signal.')}
      onNext={onNext}
      onSkip={onSkip}
      onBack={onBack}
    />
  )
}

function Step3CompatibilityInspect({onNext, onSkip, onBack}: OnboardingStepProps & { onBack: () => void }) {
  const t = useT()
  const content = (
    <div className="space-y-4">
      <p>
        {t('onboarding.step3.body1', 'Matches aren\'t magic or mysterious.')}
      </p>
      <p>
        {t('onboarding.step3.body2', 'Your compatibility score comes from explicit questions:')}
      </p>
      <ul className="text-left max-w-md mx-auto space-y-2">
        <li>{t('onboarding.step3.item1', 'Your answer')}</li>
        <li>{t('onboarding.step3.item2', 'What answers you accept from others')}</li>
        <li>{t('onboarding.step3.item3', 'How important each question is to you')}</li>
      </ul>
      <p>
        {t('onboarding.step3.body3', 'You can inspect, question, and improve the system. The full math is open source.')}
      </p>
    </div>
  )

  return (
    <OnboardingScreen
      title={t('onboarding.step3.title', 'Compatibility you can understand.')}
      content={content}
      footerText={t('onboarding.step3.footer', 'If you disagree with how it works, you can help change it.')}
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
    setCurrentStep(currentStep + 1)
  }

  const handleBack = () => {
    setCurrentStep(currentStep - 1)
  }

  const handleSkip = () => {
    Router.push('/signup')
  }

  const handleComplete = () => {
    Router.push('/signup')
    return <CompassLoadingIndicator/>
  }

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <Step1NoHiddenAlgorithms onNext={handleNext} onSkip={handleSkip}/>
      case 1:
        return <Step2SearchBeatsSwiping onNext={handleNext} onSkip={handleSkip} onBack={handleBack}/>
      case 2:
        return <Step3CompatibilityInspect onNext={handleComplete} onSkip={handleSkip} onBack={handleBack}/>
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
    <Col className="min-h-screen items-center justify-center">
      {renderStep()}
    </Col>
    // </PageBase>
  )
}
