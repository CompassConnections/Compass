import fs from 'fs';
import path from 'path';
import MarkdownPage from "web/components/markdown";

type Props = {
  content: string;
  filename: string;
};

export default function Markdown({content, filename}: Props) {
  return <MarkdownPage content={content} filename={filename}></MarkdownPage>
}

export async function getStaticPaths() {
  const mdDir = path.join(process.cwd(), 'public', 'md');
  const files = fs.readdirSync(mdDir);
  const paths = files.map((file) => ({
    params: {filename: file.replace(/\.md$/, '')},
  }));

  return {paths, fallback: false};
}

export async function getStaticProps({params}: { params: { filename: string } }) {
  const filePath = path.join(process.cwd(), 'public', 'md', `${params.filename}.md`);
  const content = fs.readFileSync(filePath, 'utf8');
  return {props: {content, filename: params.filename}};
}
