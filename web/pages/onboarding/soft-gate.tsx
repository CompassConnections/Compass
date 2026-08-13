import {ArrowRightIcon, CheckIcon} from '@heroicons/react/24/outline'
import clsx from 'clsx'
import {ENV_CONFIG} from 'common/envs/constants'
import Router from 'next/router'
import {Button} from 'web/components/buttons/button'
import {Col} from 'web/components/layout/col'
import {PageBase} from 'web/components/page-base'
import {ProfileCardViewer} from 'web/components/profile-card-viewer'
import {SEO} from 'web/components/SEO'
import {ShareCTAButton} from 'web/components/widgets/share-cta-button'
import {surface} from 'web/components/widgets/surface'
import {useProfile} from 'web/hooks/use-profile'
import {useUser} from 'web/hooks/use-user'
import {useT} from 'web/lib/locale'

/** Same marker treatment as the onboarding steps, so the end of the flow matches its start. */
function Bullets({items}: {items: string[]}) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3">
          {/* bg-green-500/N rather than bg-green-200: the latter's light-theme value is a raw hex
              string in globals.css, which breaks Tailwind's rgb(var(...) / alpha) composition and
              renders invisibly. */}
          <span className="mt-0.5 w-5 h-5 rounded-full bg-green-500/15 ring-1 ring-green-500/40 flex items-center justify-center flex-shrink-0">
            <CheckIcon className="w-3 h-3 text-green-500" strokeWidth={2.5} />
          </span>
          <span className="text-ink-700">{item}</span>
        </li>
      ))}
    </ul>
  )
}

export default function SoftGatePage() {
  const user = useUser()
  const t = useT()
  const profile = useProfile()

  const handleExplore = () => {
    Router.push('/?fromSignup=true')
  }

  const handleRefine = () => {
    Router.push(`/${user?.username ?? ''}`)
  }

  return (
    <PageBase trackPageView={'soft gate'}>
      <SEO
        title={t('onboarding.soft-gate.seo.title', "You're ready to explore - Compass")}
        description={t(
          'onboarding.soft-gate.seo.description',
          'Get started with Compass - transparent connections without algorithms',
        )}
      />
      <Col className="min-h-screen items-center justify-center px-5 py-10">
        <div className={clsx(surface, 'w-full max-w-xl p-6 sm:p-10')}>
          <h1 className="text-[clamp(26px,4vw,36px)] font-bold tracking-tight text-ink-900 text-balance mb-6">
            {t('onboarding.soft-gate.title', "You're ready to explore")}
          </h1>

          {profile && user && (
            <Col className="gap-4 items-center mb-7">
              <ProfileCardViewer user={user} profile={profile} />
              <p className="text-base text-ink-700 leading-relaxed">
                {t(
                  'onboarding.soft-gate.profile_card',
                  'You created a public values-based profile. Share it to attract people who think like you. Shared profiles are discovered much more often.',
                )}
              </p>
              {user?.username && (
                <ShareCTAButton
                  url={`https://${ENV_CONFIG.domain}/${user.username}`}
                  shareTitle={t('share_profile.share.title', 'A profile worth seeing on Compass')}
                  shareText={t(
                    'share_profile.share.text',
                    'Thought you might want to see this profile on Compass — a free directory for finding your people, searchable by values, interests, and demographics. No ads, no swiping, no dubious algorithm.',
                  )}
                  label={t('onboarding.soft-gate.share_button', 'Share My Profile')}
                  copiedLabel={t('about.share.copied', 'Link copied!')}
                />
              )}
            </Col>
          )}

          <Col className="gap-4 text-base text-ink-700 leading-relaxed">
            {/*<p>*/}
            {/*  {t(*/}
            {/*    'onboarding.soft-gate.intro',*/}
            {/*    "You've answered your first compatibility questions and shared your top interests.",*/}
            {/*  )}*/}
            {/*</p>*/}
            {/*<p>{t('onboarding.soft-gate.what_it_means', "Here's what that means for you:")}</p>*/}

            {/*<li>*/}
            {/*  {t("onboarding.soft-gate.bullet1", "Compatibility scores now reflect your values and preferences")}*/}
            {/*</li>*/}
            <Bullets
              items={[
                t(
                  'onboarding.soft-gate.bullet2',
                  "You'll see match percentages that align closely with what you care about.",
                ),
                t(
                  'onboarding.soft-gate.bullet3',
                  'You can update your profile anytime to increase the chances of the right people reaching out.',
                ),
              ]}
            />
          </Col>

          <Col className="gap-4 mt-9">
            {/* primary-500 (not primary-50/900) for the tint: this ramp inverts between themes
                (900 is a deep bronze in light mode but a near-cream tint in dark mode), so only the
                500 step is the same RGB in both and gives a consistent amber tint via opacity.
                text-primary-700 needs no dark: override — it already inverts to a readable
                light-on-dark tone on its own, same as the rest of the ramp. */}
            <Button
              onClick={handleExplore}
              size="lg"
              color="none"
              className="w-full !rounded-xl gap-2 border border-primary-500/30 bg-primary-500/10 font-semibold text-primary-700 transition-colors hover:border-primary-500/50 hover:bg-primary-500/15"
            >
              {t('onboarding.soft-gate.explore_button', 'Explore Profiles Now')}
              <ArrowRightIcon className="h-4 w-4" />
            </Button>

            {/* Was `text-ink-500` at 3.5:1. This is the escape hatch from a screen whose primary
                action sends you away from your own profile, so it has to be legible. */}
            <button
              onClick={handleRefine}
              className="text-sm font-medium text-ink-700 hover:text-ink-900 underline underline-offset-4 transition-colors"
            >
              {t('onboarding.soft-gate.refine_button', 'Refine Profile')}
            </button>
          </Col>
        </div>
      </Col>
    </PageBase>
  )
}
