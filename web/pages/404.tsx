import { LovePage } from 'web/components/love-page'
import Link from 'next/link'
import { Button } from 'web/components/buttons/button'
import { Col } from 'web/components/layout/col'

import { Title } from 'web/components/widgets/title'
import { ExternalLinkIcon } from '@heroicons/react/outline'

export default function Custom404(props: { customText?: string }) {
  return (
    <LovePage trackPageView={'404'}>
      <Custom404Content customText={props.customText} />
    </LovePage>
  )
}

export function Custom404Content(props: { customText?: string }) {
  const { customText } = props
  return (
    <div className="flex h-[50vh] flex-col items-center justify-center">
      <Col className="max-w-sm">
        <Title>404: Oops!</Title>
        {customText ? <p>{customText}</p> : <p>I can't find that page.</p>}
        <p>
          If you didn't expect this, let us know{' '}
          <a
            target="_blank"
            rel="noopener noreferrer"
            className="items-center hover:text-indigo-400 hover:underline"
            href="https://discord.com/invite/AYDw8dbrGS"
          >
            on Discord!
            <ExternalLinkIcon className="ml-1 inline-block h-4 w-4 " />
          </a>
        </p>

        <Link href="/">
          <Button className="mt-6">Go home</Button>
        </Link>
      </Col>
    </div>
  )
}
