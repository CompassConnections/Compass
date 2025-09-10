import {LovePage} from "web/components/love-page";
import {Col} from "web/components/layout/col";
import ReactMarkdown from "react-markdown";
import React from "react";

type Props = {
  content: string;
  filename: string;
};

export default function MarkdownPage({ content, filename }: Props) {
  return (
    <LovePage trackPageView={filename} className={'col-span-8'}>
      <Col className="items-center">
        <Col className='bg-canvas-0 w-full rounded px-3 py-4 sm:px-6 space-y-4 customlink'>
          <ReactMarkdown>{content}</ReactMarkdown>
        </Col>
      </Col>
    </LovePage>
  );
}