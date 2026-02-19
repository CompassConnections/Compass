import {
  discordLink,
  githubRepo,
  instagramLink,
  redditLink,
  stoatLink,
  supportEmail,
  xLink,
} from 'common/constants'
import {GeneralButton} from 'web/components/buttons/general-button'
import {Row} from 'web/components/layout/row'
import {PageBase} from 'web/components/page-base'
import {SEO} from 'web/components/SEO'
import {useT} from 'web/lib/locale'

function Section({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="max-w-3xl mb-8 mx-4 sm:mx-16 min-w-[200px]">
      <h4 className="text-2xl font-bold mb-2">{title}</h4>
      <p className="text-ink-600 mb-6">{description}</p>
      <div className="flex flex-row gap-4">{children}</div>
    </div>
  )
}

export default function Social() {
  const t = useT()

  return (
    <PageBase trackPageView={'social'}>
      <SEO
        title={t('social.seo.title', 'Socials')}
        description={t('social.seo.description', 'All our social channels and contact info')}
        url={`/social`}
      />

      <h3 className="text-4xl font-bold text-center mt-8 mb-8">{t('social.title', 'Socials')}</h3>

      {/* COMMUNITY */}
      <Section
        title={t('social.community.title', 'Community')}
        description={t('social.community.desc', 'Join our community chats and discussions.')}
      >
        <Row className="flex-wrap">
          <GeneralButton url={discordLink} content={t('social.discord', 'Discord')} />
          <GeneralButton url={redditLink} content={t('social.reddit', 'Reddit')} />
          <GeneralButton url={stoatLink} content={t('social.stoat', 'Revolt / Stoat')} />
        </Row>
      </Section>

      {/* FOLLOW / UPDATES */}
      <Section
        title={t('social.follow.title', 'Follow & Updates')}
        description={t('social.follow.desc', 'Stay informed about announcements and news.')}
      >
        <Row className="flex-wrap">
          <GeneralButton url={xLink} content={t('social.x', 'X')} />
          <GeneralButton url={instagramLink} content={t('social.instagram', 'Instagram')} />
        </Row>
      </Section>

      {/* DEVELOPMENT */}
      <Section
        title={t('social.dev.title', 'Development')}
        description={t('social.dev.desc', 'See our source code or contribute.')}
      >
        <Row className="flex-wrap">
          <GeneralButton url={githubRepo} content={t('social.github', 'GitHub')} />
        </Row>
      </Section>

      {/* CONTACT */}
      <Section
        title={t('social.contact.title', 'Contact')}
        description={t('social.contact.desc', 'Reach out to us directly for inquiries.')}
      >
        <Row className="flex-wrap">
          <GeneralButton
            url={`mailto:${supportEmail}`}
            content={`${t('social.email_button', 'Email')} ${supportEmail}`}
          />
        </Row>
      </Section>
    </PageBase>
  )
}
