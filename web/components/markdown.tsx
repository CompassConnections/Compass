import {PageBase} from "web/components/page-base";
import {Col} from "web/components/layout/col";
import ReactMarkdown from "react-markdown";
import {SEO} from "web/components/SEO";
import {capitalize} from "lodash";
import {CustomLink} from "web/components/links";
import {BackButton} from "web/components/back-button";
import {useRouter} from "next/router";

export const MD_PATHS = [
  'constitution',
  'faq',
  'financials',
  'members',
  'support',
  'tips-bio',
] as const

type Props = {
  content: string;
  filename: typeof MD_PATHS[number];
};

export const CustomMarkdown = ({children}: { children: string }) => {
  return <ReactMarkdown
    components={{
      a: ({node: _node, children, ...props}) => <CustomLink {...props}>{children}</CustomLink>
    }}
  >
    {children}
  </ReactMarkdown>
}

export default function MarkdownPage({content, filename}: Props) {
  const title = /[A-Z]/.test(filename) ? filename : capitalize(filename)
  const router = useRouter()
  const {query} = router
  const fromSignup = query.fromSignup === 'true'

  if (fromSignup) {
    return (
      <Col className="items-center">
        <Col className="items-center justify-center mb-8 max-w-4xl">
          <Col className='w-full rounded px-3 py-4 sm:px-6 space-y-4'>
            <BackButton className="-ml-2 self-start"/>
            <div className={'custom-link !mt-0'}>
              <CustomMarkdown>{content}</CustomMarkdown>
            </div>
          </Col>
        </Col>
      </Col>
    )
  }

  return (
    <PageBase trackPageView={filename} className={'col-span-8'}>
      <SEO
        title={title}
        description={title}
        url={`/` + filename}
      />
      <Col className="items-center mb-8">
        <Col className='w-full rounded px-3 py-4 sm:px-6 space-y-4'>
          <div className={'custom-link !mt-0'}>
            <CustomMarkdown>{content}</CustomMarkdown>
          </div>
        </Col>
      </Col>
    </PageBase>
  );
}