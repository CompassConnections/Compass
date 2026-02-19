import {PageBase} from 'web/components/page-base'
import Link from 'next/link'
import {Col} from 'web/components/layout/col'

import {Title} from 'web/components/widgets/title'
import {SEO} from 'web/components/SEO'
import {useT} from 'web/lib/locale'

export default function Custom404(props: {customText?: string}) {
  // console.log('props:', props)
  return (
    <PageBase trackPageView={'404'}>
      <SEO title={'Not Found'} description={'Not Found'} url={`/404`} />
      <Custom404Content customText={props.customText} />
    </PageBase>
  )
}

export function Custom404Content(props: {customText?: string}) {
  const {customText} = props
  const t = useT()

  return (
    <div className="flex h-[50vh] flex-col items-center justify-center">
      <Col className="mx-4">
        <Title>{t('404.title', '404: Oops!')}</Title>
        {customText ? (
          <p>{customText}</p>
        ) : (
          <p>{t('404.default_message', "I can't find that page.")}</p>
        )}
        <p className="custom-link">
          {t(
            '404.help_text',
            "If you didn't expect this, try to reload the page in a few seconds or get some ",
          )}
          <Link href={'/help'}>{t('organization.help', 'help').toLowerCase()}</Link>.
        </p>

        {/*<Link href="/">*/}
        {/*  <Button className="mt-6">Go home</Button>*/}
        {/*</Link>*/}
      </Col>
    </div>
  )
}
