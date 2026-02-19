import {PageBase} from 'web/components/page-base'
import {Col} from 'web/components/layout/col'
import ReactMarkdown from 'react-markdown'
import {SEO} from 'web/components/SEO'
import {capitalize} from 'lodash'
import {CustomLink} from 'web/components/links'
import {BackButton} from 'web/components/back-button'
import {useRouter} from 'next/router'

export const MD_PATHS = [
  'constitution',
  'faq',
  'financials',
  'members',
  'support',
  'tips-bio',
] as const

type Props = {
  content: string
  filename: (typeof MD_PATHS)[number]
}

export const CustomMarkdown = ({children}: {children: string}) => {
  return (
    <ReactMarkdown
      components={{
        a: ({node: _node, children, ...props}) => <CustomLink {...props}>{children}</CustomLink>,
      }}
    >
      {children}
    </ReactMarkdown>
  )
}

export default function MarkdownPage({content, filename}: Props) {
  const title = /[A-Z]/.test(filename) ? filename : capitalize(filename)
  const router = useRouter()
  const {query} = router
  const fromSignup = query.fromSignup === 'true'

  const backButton = fromSignup && <BackButton className="-ml-2 self-start" />

  const formattedContent = (
    <Col className="items-center">
      <Col className="items-center justify-center mb-8 max-w-5xl">
        <Col className="w-full rounded px-3 py-4 sm:px-6 space-y-4">
          {backButton}
          <div className={'custom-link !mt-0 prose prose-neutral dark:prose-invert'}>
            <CustomMarkdown>{content}</CustomMarkdown>
          </div>
        </Col>
      </Col>
    </Col>
  )

  if (fromSignup) return formattedContent

  return (
    <PageBase trackPageView={filename} className={'col-span-8'}>
      <SEO title={title} description={title} url={`/` + filename} />
      {formattedContent}
    </PageBase>
  )
}
