import {PageBase} from "web/components/page-base";
import {Col} from "web/components/layout/col";
import ReactMarkdown from "react-markdown";
import React from "react";
import Link from "next/link";
import {SEO} from "web/components/SEO";
import {capitalize} from "lodash";

type Props = {
  content: string;
  filename: string;
};

const MarkdownLink = ({href, children}: { href?: string; children: React.ReactNode }) => {
  if (!href) return <>{children}</>

  // If href is internal, use Next.js Link
  if (href.startsWith('/')) {
    return <Link href={href}>{children}</Link>
  }

  // For external links, fall back to <a>
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  )
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
      <Col className="items-center">
        <Col className='w-full rounded px-3 py-4 sm:px-6 space-y-4 custom-link'>
          <ReactMarkdown
            components={{
              a: ({node: _node, children, ...props}) => <MarkdownLink {...props}>{children}</MarkdownLink>
            }}
          >{content}
          </ReactMarkdown>
        </Col>
      </Col>
    </PageBase>
  );
}