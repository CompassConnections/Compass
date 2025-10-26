import {PageBase} from "web/components/page-base";
import {Col} from "web/components/layout/col";
import ReactMarkdown from "react-markdown";
import {SEO} from "web/components/SEO";
import {capitalize} from "lodash";
import {CustomLink} from "web/components/links";

type Props = {
  content: string;
  filename: string;
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
  return (
    <PageBase trackPageView={filename} className={'col-span-8'}>
      <SEO
        title={title}
        description={title}
        url={`/` + filename}
      />
      <Col className="items-center mb-8">
        <Col className='w-full rounded px-3 py-4 sm:px-6 space-y-4 custom-link'>
          <CustomMarkdown>{content}</CustomMarkdown>
        </Col>
      </Col>
    </PageBase>
  );
}