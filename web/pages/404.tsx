import {PageBase} from 'web/components/page-base'
import Link from 'next/link'
import {Col} from 'web/components/layout/col'

import {Title} from 'web/components/widgets/title'
import {SEO} from "web/components/SEO";


export default function Custom404(props: { customText?: string }) {
  // console.log('props:', props)
  return (
    <PageBase trackPageView={'404'}>
      <SEO
        title={'Not Found'}
        description={'Not Found'}
        url={`/404`}
      />
      <Custom404Content customText={props.customText}/>
    </PageBase>
  )
}

export function Custom404Content(props: { customText?: string }) {
  const {customText} = props
  return (
    <div className="flex h-[50vh] flex-col items-center justify-center">
      <Col className="mx-4">
        <Title>404: Oops!</Title>
        {customText ? <p>{customText}</p> : <p>I can't find that page.</p>}
        <p className="custom-link">
          If you didn't expect this, get some <Link href={'/help'}>help</Link>.
        </p>

        {/*<Link href="/">*/}
        {/*  <Button className="mt-6">Go home</Button>*/}
        {/*</Link>*/}
      </Col>
    </div>
  )
}
