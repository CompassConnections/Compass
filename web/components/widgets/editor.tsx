import CharacterCount from '@tiptap/extension-character-count'
import {Link} from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import Table from '@tiptap/extension-table'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import TableRow from '@tiptap/extension-table-row'
import Underline from '@tiptap/extension-underline'
import {TextSelection} from '@tiptap/pm/state'
import type {Content, JSONContent} from '@tiptap/react'
import {Editor, EditorContent, Extensions, mergeAttributes, useEditor} from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import clsx from 'clsx'
import {richTextToString} from 'common/util/parse'
import Iframe from 'common/util/tiptap-iframe'
import {debounce} from 'lodash'
import {createElement, ReactNode, useCallback, useEffect, useMemo} from 'react'
import {CustomLink} from 'web/components/links'
import {usePersistentLocalState} from 'web/hooks/use-persistent-local-state'
import {safeLocalStorage} from 'web/lib/util/local'

import {EmojiExtension} from '../editor/emoji/emoji-extension'
import {FloatingFormatMenu} from '../editor/floating-format-menu'
import {BasicImage, DisplayImage} from '../editor/image'
import {nodeViewMiddleware} from '../editor/nodeview-middleware'
import {StickyFormatMenu} from '../editor/sticky-format-menu'
import {Upload, useUploadMutation} from '../editor/upload-extension'
import {DisplayMention} from '../editor/user-mention/mention-extension'
import {Linkify} from './linkify'
import {linkClass} from './site-link'

const DisplayLink = Link.extend({
  renderHTML({HTMLAttributes}) {
    HTMLAttributes.target = HTMLAttributes.href.includes('manifold.markets') ? '_self' : '_blank'
    delete HTMLAttributes.class // only use our classes (don't duplicate on paste)
    return ['a', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0]
  },
}).configure({
  openOnClick: false, // stop link opening twice (browser still opens)
  HTMLAttributes: {
    rel: 'noopener ugc',
    class: linkClass,
  },
})

const editorExtensions = (simple = false): Extensions =>
  nodeViewMiddleware([
    StarterKit.configure({
      heading: simple ? false : {levels: [1, 2, 3]},
      horizontalRule: simple ? false : {},
    }),
    simple ? DisplayImage : BasicImage,
    EmojiExtension,
    DisplayLink,
    DisplayMention,
    Iframe,
    Upload,
    Table.configure({resizable: false}),
    TableRow,
    TableCell,
    TableHeader,
    Underline,
  ])

const proseClass = (size: 'sm' | 'md' | 'lg') =>
  clsx(
    'prose dark:prose-invert max-w-none leading-relaxed',
    'prose-a:text-primary-700 prose-a:no-underline',
    size === 'sm' ? 'prose-sm' : 'text-md',
    size !== 'lg' && 'prose-p:my-0 prose-ul:my-0 prose-ol:my-0 prose-li:my-0',
    '[&>p]:prose-li:my-0',
    'text-ink-900 prose-blockquote:text-teal-700',
    'break-anywhere',
  )

export const getEditorLocalStorageKey = (key: string) => `text ${key}`

export function useTextEditor(props: {
  placeholder?: string
  max?: number
  defaultValue?: Content
  size?: 'sm' | 'md' | 'lg'
  key?: string // unique key for autosave. If set, plz call `editor.commands.clearContent(true)` on submit to clear autosave
  extensions?: Extensions
  className?: string
  onChange?: () => void
}) {
  const {placeholder, className, max, defaultValue, size = 'md', key, onChange} = props
  const simple = size === 'sm'

  const [content, setContent] = usePersistentLocalState<JSONContent | undefined>(
    undefined,
    getEditorLocalStorageKey(key ?? ''),
  )

  const save = useCallback(
    debounce((newContent: JSONContent) => {
      const oldText = richTextToString(content)
      const newText = richTextToString(newContent)
      if (oldText.length === 0 && newText.length === 0) {
        safeLocalStorage?.removeItem(getEditorLocalStorageKey(key ?? ''))
      } else {
        setContent(newContent)
      }
    }, 500),
    [],
  )

  const getEditorProps = () => ({
    attributes: {
      class: clsx(
        proseClass(size),
        'outline-none py-[.5em] px-4',
        'prose-img:select-auto',
        '[&_.ProseMirror-selectednode]:outline-dotted [&_*]:outline-primary-300', // selected img, embeds
        'dark:[&_.ProseMirror-gapcursor]:after:border-white', // gap cursor
        className,
      ),
      style: `min-height: ${1 + 1.625 * (simple ? 2 : 3)}em`, // 1em padding + 1.625 lines per row
    },
  })

  const editor = useEditor({
    editorProps: {
      ...getEditorProps(),
      handleDOMEvents: {},
      transformPastedHTML: (html) => html,
    },
    immediatelyRender: false,
    onUpdate: ({editor}) => {
      if (key) {
        save(editor.getJSON())
      }
      onChange?.()
    },
    onTransaction({transaction, editor}) {
      const {selection} = transaction
      // If CellSelection sneaks through, convert to TextSelection
      if ('$anchorCell' in selection) {
        const {$anchorCell} = selection as any
        const tr = editor.state.tr.setSelection(
          TextSelection.create(editor.state.doc, $anchorCell.pos),
        )
        editor.view.dispatch(tr)
      }
    },
    extensions: [
      ...editorExtensions(simple),
      Placeholder.configure({
        placeholder,
        emptyEditorClass:
          'before:content-[attr(data-placeholder)] before:text-ink-500 before:float-left before:h-0 cursor-text',
      }),
      CharacterCount.configure({limit: max}),
      ...(props.extensions ?? []),
    ],
    content: defaultValue ?? (key && content ? content : ''),
  })

  useEffect(() => {
    // Using a dep array in the useEditor hook doesn't work, so we have to use a useEffect
    editor?.setOptions({
      editorProps: getEditorProps(),
    })
  }, [className])

  const upload = useUploadMutation(editor)
  if (!editor) return null
  editor.storage.upload.mutation = upload

  editor.setOptions({
    editorProps: {
      handlePaste(_view, event) {
        const imageFiles = getImages(event.clipboardData)
        if (imageFiles.length) {
          event.preventDefault()
          upload.mutate(imageFiles)
          return true // Prevent image in text/html from getting pasted again
        }

        // Otherwise, use default paste handler
      },
      handleDrop(_view, event, _slice, moved) {
        // if dragged from outside
        if (!moved) {
          event.preventDefault()
          upload.mutate(getImages(event.dataTransfer))
        }
      },
    },
  })

  return editor
}

const getImages = (data: DataTransfer | null) =>
  Array.from(data?.files ?? []).filter((file) => file.type.startsWith('image'))

export function TextEditor(props: {
  editor: Editor | null
  simple?: boolean // show heading in toolbar
  hideEmbed?: boolean // hide toolbar
  children?: ReactNode // additional toolbar buttons
  className?: string
  onBlur?: () => void
  onChange?: () => void
}) {
  const {editor, simple, hideEmbed, children, className, onBlur, onChange} = props

  return (
    // matches input styling
    <div
      className={clsx(
        'border-ink-300 bg-canvas-0 focus-within:border-primary-500 focus-within:ring-primary-500 w-full overflow-hidden rounded-lg border shadow-sm transition-colors focus-within:ring-1',
        className,
      )}
    >
      <FloatingFormatMenu editor={editor} advanced={!simple} />
      <div className={clsx('max-h-[69vh] overflow-auto')}>
        <EditorContent editor={editor} onBlur={onBlur} onChange={onChange} />
      </div>

      <StickyFormatMenu editor={editor} hideEmbed={hideEmbed}>
        {children}
      </StickyFormatMenu>
    </div>
  )
}

function RichContent(props: {content: JSONContent; className?: string; size?: 'sm' | 'md' | 'lg'}) {
  const {className, content, size = 'md'} = props

  const jsxContent = useMemo(() => {
    try {
      return renderJSONContent(content, size)
    } catch (e) {
      console.error('Error generating react', e, 'for content', content)
      return ''
    }
  }, [content, size])

  if (!content) return null

  return (
    <div
      className={clsx(
        'ProseMirror',
        className,
        proseClass(size),
        String.raw`empty:prose-p:after:content-["\00a0"]`, // make empty paragraphs have height
      )}
    >
      {jsxContent}
    </div>
  )
}

function renderJSONContent(doc: JSONContent, size: 'sm' | 'md' | 'lg'): ReactNode {
  return recurse(doc, 0, size)
}

function recurse(node: JSONContent, key: number, size: 'sm' | 'md' | 'lg'): ReactNode {
  const children = node.content?.map((n, i) => recurse(n, i, size))

  switch (node.type) {
    case 'doc':
      return <>{children}</>
    case 'paragraph':
      return <p key={key}>{children}</p>
    case 'heading':
      return createElement(`h${node.attrs?.level ?? 1}`, {key}, children)
    case 'bulletList':
      return <ul key={key}>{children}</ul>
    case 'orderedList':
      return (
        <ol key={key} start={node.attrs?.start ?? 1}>
          {children}
        </ol>
      )
    case 'listItem':
      return <li key={key}>{children}</li>
    case 'blockquote':
      return <blockquote key={key}>{children}</blockquote>
    case 'codeBlock':
      return (
        <pre key={key}>
          <code>{children}</code>
        </pre>
      )
    case 'horizontalRule':
      return <hr key={key} />
    case 'hardBreak':
      return <br key={key} />
    case 'image':
      return (
        <img
          key={key}
          src={node.attrs?.src}
          alt={node.attrs?.alt ?? ''}
          title={node.attrs?.title ?? undefined}
          className={size === 'sm' ? 'max-h-32' : size === 'md' ? 'max-h-64' : undefined}
        />
      )
    case 'table':
      return (
        <table key={key}>
          <tbody>{children}</tbody>
        </table>
      )
    case 'tableRow':
      return <tr key={key}>{children}</tr>
    case 'tableHeader':
      return (
        <th key={key} colSpan={node.attrs?.colspan ?? 1} rowSpan={node.attrs?.rowspan ?? 1}>
          {children}
        </th>
      )
    case 'tableCell':
      return (
        <td key={key} colSpan={node.attrs?.colspan ?? 1} rowSpan={node.attrs?.rowspan ?? 1}>
          {children}
        </td>
      )
    case 'text':
      return applyMarks(node.text ?? '', node.marks ?? [], key)
    default:
      return null
  }
}

function applyMarks(text: string, marks: JSONContent[], key: number): ReactNode {
  return marks.reduce(
    (node, mark) => {
      switch (mark.type) {
        case 'bold':
          return <strong>{node}</strong>
        case 'italic':
          return <em>{node}</em>
        case 'underline':
          return <u>{node}</u>
        case 'strike':
          return <s>{node}</s>
        case 'code':
          return <code>{node}</code>
        case 'highlight':
          return <mark>{node}</mark>
        case 'link':
          return <CustomLink href={mark.attrs?.href}>{node}</CustomLink>
        default:
          return node
      }
    },
    (<span key={key}>{text}</span>) as ReactNode,
  )
}

// backwards compatibility: we used to store content as strings
export function Content(props: {
  content: JSONContent | string
  /** font/spacing */
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const {className, size = 'md', content} = props
  return typeof content === 'string' ? (
    <Linkify
      className={clsx('whitespace-pre-line', proseClass(size), className)}
      text={content || ''}
    />
  ) : (
    <RichContent {...(props as any)} />
  )
}
