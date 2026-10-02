'use client'

import MarkdownPage, {MD_PATHS} from 'web/components/markdown'
import {useMarkdown} from 'web/hooks/use-markdown'

type Props = {
  filename: (typeof MD_PATHS)[number]
  /** Values for `{key}` placeholders in the markdown — the same syntax `t()` interpolates. */
  vars?: Record<string, string | number>
}

export function MarkdownPageLoader({filename, vars}: Props) {
  const content = useMarkdown(filename)
  return <MarkdownPage content={interpolate(content, vars)} filename={filename} />
}

function interpolate(content: string, vars: Props['vars']) {
  if (!vars) return content
  return content.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in vars ? String(vars[key]) : match,
  )
}
