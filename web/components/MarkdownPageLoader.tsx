'use client'

import MarkdownPage, {MD_PATHS} from 'web/components/markdown'
import {useMarkdown} from 'web/hooks/use-markdown'

type Props = {
  filename: (typeof MD_PATHS)[number]
}

export function MarkdownPageLoader({filename}: Props) {
  const content = useMarkdown(filename)
  return <MarkdownPage content={content} filename={filename} />
}
