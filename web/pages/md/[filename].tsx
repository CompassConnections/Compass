import React from 'react';
import ReactMarkdown from 'react-markdown';
import fs from 'fs';
import path from 'path';
import {LovePage} from "web/components/love-page";
import {Col} from "web/components/layout/col";

type Props = {
  content: string;
  filename: string;
};

export default function MarkdownPage({ content, filename }: Props) {
  return (
    <LovePage trackPageView={filename}>
      <Col className="items-center">
        <Col className='bg-canvas-0 w-full rounded px-3 py-4 sm:px-6 space-y-4 customlink'>
          <ReactMarkdown>{content}</ReactMarkdown>
        </Col>
      </Col>
    </LovePage>
  );
}

export async function getStaticPaths() {
  const mdDir = path.join(process.cwd(), 'public', 'md');
  const files = fs.readdirSync(mdDir);
  const paths = files.map((file) => ({
    params: { filename: file.replace(/\.md$/, '') },
  }));

  return { paths, fallback: false };
}

export async function getStaticProps({ params }: { params: { filename: string } }) {
  const filePath = path.join(process.cwd(), 'public', 'md', `${params.filename}.md`);
  const content = fs.readFileSync(filePath, 'utf8');
  return { props: { content, filename: params.filename } };
}
