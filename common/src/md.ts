import type {JSONContent} from '@tiptap/core'

export function jsonToMarkdown(node: JSONContent): string {
  if (!node) return ''

  // Text node
  if (node.type === 'text') {
    let text = node.text || ''

    if (node.marks) {
      for (const mark of node.marks) {
        switch (mark.type) {
          case 'bold':
            text = `**${text}**`
            break
          case 'italic':
            text = `*${text}*`
            break
          case 'strike':
            text = `~~${text}~~`
            break
          case 'code':
            text = `\`${text}\``
            break
          case 'link':
            text = `[${text}](${mark.attrs?.href ?? ''})`
            break
        }
      }
    }

    return text
  }

  // Non-text nodes: recursively process children
  const content = (node.content || []).map(jsonToMarkdown).join('')

  switch (node.type) {
    case 'paragraph':
      return `${content}\n`
    case 'heading': {
      const level = node.attrs?.level || 1
      return `${'#'.repeat(level)} ${content}\n`
    }
    case 'bulletList':
      return `${content}`
    case 'orderedList':
      return `${content}`
    case 'listItem':
      return `- ${content}`
    case 'blockquote':
      return (
        content
          .split('\n')
          .map((line) => (line ? `> ${line}` : ''))
          .join('\n') + '\n\n'
      )
    case 'codeBlock':
      return `\`\`\`\n${content}\n\`\`\`\n\n`
    case 'horizontalRule':
      return `---\n\n`
    case 'hardBreak':
      return `  \n`
    default:
      return content
  }
}

// function extractTextFromJsonb(bio: JSONContent): string {
//   try {
//     const texts: string[] = []
//     const visit = (node: any) => {
//       if (!node) return
//       if (Array.isArray(node)) {
//         for (const item of node) visit(item)
//         return
//       }
//       if (typeof node === 'object') {
//         for (const [k, v] of Object.entries(node)) {
//           if (k === 'text' && typeof v === 'string') texts.push(v)
//           else visit(v as any)
//         }
//       }
//     }
//     visit(bio)
//     // Remove extra whitespace and join
//     return texts.map((t) => t.trim()).filter(Boolean).join(' ')
//   } catch {
//     return ''
//   }
// }
