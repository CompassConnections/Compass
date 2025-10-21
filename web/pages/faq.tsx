import fs from 'fs';
import path from 'path';
import MarkdownPage from "web/components/markdown";

const FILENAME = __filename.split('/').pop()?.split('.').shift();

export async function getStaticProps() {
  const filePath = path.join(process.cwd(), 'public', 'md', FILENAME + '.md');
  const content = fs.readFileSync(filePath, 'utf8');
  return {props: {content, filename: FILENAME}};
}

type Props = { content: string, filename: string };

export default function Page({content, filename}: Props) {
  if (!filename) throw new Error('Could not determine filename');
  return <MarkdownPage content={content} filename={filename.toUpperCase()}></MarkdownPage>
}