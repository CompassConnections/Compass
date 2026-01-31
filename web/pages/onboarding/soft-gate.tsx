import {Col} from 'web/components/layout/col'
import Router from 'next/router'
import {Button} from 'web/components/buttons/button'
import {useUser} from "web/hooks/use-user";
import {PageBase} from "web/components/page-base";
import {SEO} from "web/components/SEO";
import {useT} from "web/lib/locale";


export default function SoftGatePage() {
  const user = useUser()
  const t = useT()

  const handleExplore = () => {
    Router.push('/?fromSignup=true')
  }

  const handleRefine = () => {
    Router.push(`/${user?.username ?? ''}`)
  }

  return (
    <PageBase trackPageView={'soft gate'}>
      <SEO
        title={t("onboarding.soft-gate.seo.title", "You're ready to explore - Compass")}
        description={t("onboarding.soft-gate.seo.description", "Get started with Compass - transparent connections without algorithms")}
      />
      <Col className="min-h-screen items-center justify-center p-6">
        <Col className="max-w-xl w-full gap-6 text-center">
          <h1 className="text-4xl font-semibold text-ink-900">
            {t("onboarding.soft-gate.title", "You're ready to explore")}
          </h1>

          <Col className="gap-4 text-ink-700">
            <p>
              {t("onboarding.soft-gate.intro", "You've answered your first compatibility questions and shared your top interests.")}
            </p>
            <p className="text-left space-y-2 text-ink-600">
              {t("onboarding.soft-gate.what_it_means", "Here's what that means for you:")}
            </p>

            <ul className="text-left mx-auto space-y-2">
              {/*<li>*/}
              {/*  {t("onboarding.soft-gate.bullet1", "Compatibility scores now reflect your values and preferences")}*/}
              {/*</li>*/}
              <li>
                <span>{t("onboarding.soft-gate.bullet2", "You'll see match percentages that align closely with what you care about")}</span>
              </li>
              <li>
                <span>{t("onboarding.soft-gate.bullet3", "You can update your profile anytime to increase the chances of the right people reaching out.")}</span>
              </li>
            </ul>
          </Col>

          <Col className="gap-3 items-center">
            <Button
              onClick={handleExplore}
              size="lg"
            >
              {t("onboarding.soft-gate.explore_button", "Explore Profiles Now")}
            </Button>

            <button
              onClick={handleRefine}
              className="text-sm text-ink-500 hover:text-ink-700 transition-colors"
            >
              {t("onboarding.soft-gate.refine_button", "Refine Profile")}
            </button>
          </Col>
        </Col>
      </Col>
    </PageBase>
  )
}
