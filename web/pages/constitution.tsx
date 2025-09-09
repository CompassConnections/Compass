import React from 'react';
import ReactMarkdown from 'react-markdown';
import {LovePage} from "web/components/love-page";
import {Col} from "web/components/layout/col";

import fs from 'fs';
import path from 'path';

export async function getStaticProps() {
  const filePath = path.join(process.cwd(), 'public', 'md', 'constitution.md');
  const content = fs.readFileSync(filePath, 'utf8');
  return { props: { content } };
}

type Props = { content: string };

export default function Constitution({ content }: Props) {
  return (
    <LovePage trackPageView={'test'}>
    <Col className="items-center">
      <Col className={'bg-canvas-0 w-full rounded px-3 py-4 sm:px-6 space-y-4'}>
        <ReactMarkdown>{content}</ReactMarkdown>
      </Col>
    </Col>
  </LovePage>
  );
}
