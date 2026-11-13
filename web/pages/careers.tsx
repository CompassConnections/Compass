import {PositionId} from 'common/careers'
import Link from 'next/link'
import {ReactNode} from 'react'
import {ApplicationForm} from 'web/components/careers/application-form'
import {PageBase} from 'web/components/page-base'
import {SEO} from 'web/components/SEO'
import {useT} from 'web/lib/locale'

const linkClass =
  'text-primary-700 underline underline-offset-2 hover:text-primary-800 rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500'

function Fact(props: {term: string; children: ReactNode}) {
  return (
    <div className="border-t border-canvas-300 py-3 sm:grid sm:grid-cols-[9rem_1fr] sm:gap-4">
      <dt className="font-semibold text-ink-900">{props.term}</dt>
      <dd className="m-0 text-ink-800">{props.children}</dd>
    </div>
  )
}

function Block(props: {title: string; children: ReactNode}) {
  return (
    <section className="mt-10">
      <h3 className="text-title text-ink-900">{props.title}</h3>
      <div className="mt-3 max-w-prose text-ink-800">{props.children}</div>
    </section>
  )
}

function Bullets(props: {items: ReactNode[]}) {
  return (
    <ul className="m-0 flex list-disc flex-col gap-2 pl-5 marker:text-primary-700">
      {props.items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  )
}

/**
 * The one open position. Written out as a component, not as data, because nearly all of it is
 * translated prose; a second position gets its own component and its id in `common/src/careers.ts`.
 */
function CommunityGrowthLead() {
  const t = useT()
  const position: PositionId = 'community-growth-lead'
  const title = t('careers.growth.title', 'Community Growth Lead')

  return (
    <article>
      <h2 className="text-headline text-ink-900">{title}</h2>

      <dl className="mb-0 mt-6 border-b border-canvas-300">
        <Fact term={t('careers.fact.time', 'Time')}>
          {t('careers.growth.time', 'A few hours a week, at the times you choose')}
        </Fact>
        <Fact term={t('careers.fact.place', 'Place')}>
          {t('careers.growth.place', 'Remote (international)')}
        </Fact>
        <Fact term={t('careers.fact.pay', 'Pay')}>
          {t('careers.growth.pay', 'At a rate that matches your skills')}
        </Fact>
      </dl>

      <Block title={t('careers.growth.why.title', 'Why this role')}>
        <p>
          {t(
            'careers.growth.why.body',
            'Our main bottleneck by far is the size of our user base. We need more people, ideally from the niche communities already on Compass.',
          )}
        </p>
      </Block>

      <Block title={t('careers.growth.tasks.title', 'What you would do')}>
        <Bullets
          items={[
            t(
              'careers.growth.tasks.1',
              'Introduce Compass to communities whose members want deep connections, through their organisers, newsletters, meetups and forums (Reddit, Discord, X, etc.).',
            ),
            t('careers.growth.tasks.3', 'Write posts and messages those communities read.'),
            t(
              'careers.growth.tasks.4',
              'Help current members invite others, using referrals, member stories and events.',
            ),
            t(
              'careers.growth.tasks.5',
              'Have a weekly call with Martin to share what you tried and what it brought.',
            ),
          ]}
        />
      </Block>

      <Block title={t('careers.growth.profile.title', 'What we look for')}>
        <Bullets
          items={[
            t(
              'careers.growth.profile.1',
              'You earn trust (or are already trusted) in small communities.',
            ),
            t('careers.growth.profile.2', 'As a truth-seeker, you write clearly and honestly.'),
            t(
              'careers.growth.profile.5',
              'You are evidence-based: you try an idea on a small scale, measure what it brought, and drop what does not work. As a consequence, you are comfortable with numbers.',
            ),
            <>
              {t('careers.growth.profile.6', 'You generally follow')}{' '}
              <Link href="/values" className={linkClass}>
                {t('careers.growth.profile.6_link', 'our other values')}
              </Link>
              .
            </>,
          ]}
        />
      </Block>

      <Block title={t('careers.growth.plus.title', 'Preferred')}>
        <Bullets
          items={[
            t(
              'careers.growth.plus.1',
              'You belong to a community many Compass members come from: effective altruism, rationalist circles, vegan or animal advocacy groups, non-profit work.',
            ),
            t(
              'careers.growth.profile.3',
              'You have grown a community before or have a sizeable audience online (blog, newsletter, social account, meetup, campaign).',
            ),
          ]}
        />
      </Block>

      <div className="mt-12">
        <ApplicationForm position={position} positionTitle={title} />
        <p className="mt-4 max-w-prose text-sm text-ink-800">
          {t('careers.growth.after', 'Not sure you are a good fit? Apply anyway.')}
        </p>
      </div>
    </article>
  )
}

export default function CareersPage() {
  const t = useT()
  return (
    <PageBase trackPageView={'careers'}>
      <SEO
        title={t('careers.seo.title', 'Careers - Compass')}
        description={t(
          'careers.seo.description',
          'Paid work on Compass: help the right people find the directory.',
        )}
        url={`/careers`}
      />
      <div className="mx-auto max-w-3xl px-5 pb-24 pt-12 sm:px-8">
        <header className="mb-14">
          <h1 className="mb-5 text-[clamp(34px,5vw,56px)] leading-[1.08] tracking-tight text-ink-900 text-balance">
            {t('careers.headline', 'Work on Compass')}
          </h1>
          <p className="max-w-prose text-lead text-ink-800">
            {t(
              'careers.intro',
              'Compass is built by volunteers and runs on donations. However, the founder will pay for the positions below as they are critical to fulfilling our mission.',
            )}
          </p>
        </header>
        <CommunityGrowthLead />
      </div>
    </PageBase>
  )
}
