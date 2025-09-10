import React from 'react';

import fs from 'fs';
import path from 'path';
import MarkdownPage from "web/components/markdown";

const FILENAME = 'members';

export async function getStaticProps() {
  const filePath = path.join(process.cwd(), 'public', 'md', FILENAME + '.md');
  const content = fs.readFileSync(filePath, 'utf8');
  return {props: {content}};
}

type Props = { content: string };

export default function Faq({content}: Props) {
  return <MarkdownPage content={content} filename={FILENAME}></MarkdownPage>
}
