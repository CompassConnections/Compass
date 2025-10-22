import { PageBase } from 'web/components/page-base'
import Link from 'next/link'
import { Button } from 'web/components/buttons/button'
import { Col } from 'web/components/layout/col'

import { Title } from 'web/components/widgets/title'
import { ExternalLinkIcon } from '@heroicons/react/outline'
import {discordLink, formLink, githubIssues} from "common/constants";
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
      <Custom404Content customText={props.customText} />
    </PageBase>
  )
}

export function Custom404Content(props: { customText?: string }) {
  const { customText } = props
  return (
    <div className="flex h-[50vh] flex-col items-center justify-center">
      <Col className="mx-4">
        <Title>404: Oops!</Title>
        {customText ? <p>{customText}</p> : <p>I can't find that page.</p>}
        <p>
          If you didn't expect this, let us know on{' '}
          <a
            target="_blank"
            rel="noopener noreferrer"
            className="items-center hover:text-indigo-400 hover:underline"
            href={formLink}
          >
            a Google Form
            <ExternalLinkIcon className="ml-1 inline-block h-4 w-4 " />
          </a>, {' '}
          <a
            target="_blank"
            rel="noopener noreferrer"
            className="items-center hover:text-indigo-400 hover:underline"
            href={discordLink}
          >
            Discord
            <ExternalLinkIcon className="ml-1 inline-block h-4 w-4 " />
          </a> or {' '}
          <a
            target="_blank"
            rel="noopener noreferrer"
            className="items-center hover:text-indigo-400 hover:underline"
            href={githubIssues}
          >
            GitHub!
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
