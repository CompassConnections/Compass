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
import Image from 'next/image'
import {createElement, ReactNode, useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {Modal, MODAL_CLASS} from 'web/components/layout/modal'
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
    'prose-h1:text-ink-900 prose-h2:text-ink-900 prose-h3:text-ink-900',
    'prose-strong:font-bold prose-strong:text-ink-700',
    'text-ink-600 prose-blockquote:text-teal-700 ',
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
  nRowsMin?: number
}) {
  const {placeholder, className, max, defaultValue, size = 'md', key, onChange, nRowsMin} = props
  const simple = size === 'sm'
  const minRows = nRowsMin ?? (simple ? 2 : 3)

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
      style: `min-height: ${1 + 1.625 * minRows}em`, // 1em padding + 1.625 lines per row
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
          'before:content-[attr(data-placeholder)] before:text-ink-1000/40 before:text-sm before:float-left before:h-0 cursor-text',
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

        if (max) {
          event.preventDefault()
          const text = event.clipboardData?.getData('text/plain') ?? ''
          const currentLength = editor.getText().length
          const available = Math.max(0, max - currentLength)
          if (available > 0 && text.length > 0) {
            const croppedText = text.slice(0, available)
            editor.commands.insertContent(croppedText)
          }
          return true
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

/** Breathing room left below the format toolbar when we scroll it back into view. */
const TOOLBAR_VIEWPORT_GAP = 16

/**
 * The lowest y coordinate that is actually *visible*, which is not the same as the viewport bottom.
 *
 * On mobile the bottom nav bar is `fixed inset-x-0 bottom-0 z-50`, so it sits on top of the page —
 * scrolling something to `innerHeight - gap` parks it underneath the nav, which is exactly as hidden
 * as being off-screen. Measuring the obstruction rather than hardcoding its height keeps this correct
 * on the pages that render no bottom nav (signup), across the `lg` breakpoint where it disappears, and
 * over the safe-area inset on notched devices.
 *
 * `nav` covers the bottom bar; `[data-bottom-overlay]` is an opt-in for any other fixed bottom
 * furniture that gets added later. Both are cheap to query on each keystroke.
 */
function getUsableViewportBottom(): number {
  const viewportBottom = window.visualViewport?.height ?? window.innerHeight
  let usable = viewportBottom
  document.querySelectorAll<HTMLElement>('nav, [data-bottom-overlay]').forEach((el) => {
    if (getComputedStyle(el).position !== 'fixed') return
    const r = el.getBoundingClientRect()
    if (r.height === 0 || r.width === 0) return // `lg:hidden` etc.
    // Anchored to the bottom edge and covering it.
    if (r.bottom >= viewportBottom - 2 && r.top < usable) usable = r.top
  })
  return usable
}

/**
 * Nearest ancestor that actually scrolls vertically, or null when the page itself is the scroller.
 *
 * Needed because this editor is used both inline on a page and inside a modal, and a modal is its own
 * scroll container with the page behind it locked — so scrolling the window there does nothing at all.
 * The editor's own content area is a *sibling* of the toolbar, not an ancestor, so it is never picked
 * up by this walk.
 */
function getScrollParent(el: HTMLElement | null): HTMLElement | null {
  let node = el?.parentElement ?? null
  while (node && node !== document.body && node !== document.documentElement) {
    const {overflowY} = getComputedStyle(node)
    const scrolls = overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay'
    if (scrolls && node.scrollHeight > node.clientHeight) return node
    node = node.parentElement
  }
  return null
}

export function TextEditor(props: {
  editor: Editor | null
  simple?: boolean // show heading in toolbar
  hideEmbed?: boolean // hide toolbar
  children?: ReactNode // additional toolbar buttons
  className?: string
  onBlur?: () => void
  onChange?: () => void
  maxHeight?: string
}) {
  const {
    editor,
    simple,
    hideEmbed,
    children,
    className,
    onBlur,
    onChange,
    // The content area scrolls internally once it hits this; below it, the box just grows. At the
    // previous 69vh the box could become two-thirds of the viewport tall before anything scrolled,
    // which pushed the format toolbar (image / embed / emoji) off the bottom of the screen as soon as
    // you typed a few lines — the toolbar sits *after* the content in flow, so its position is
    // whatever the content height puts it at. Capping lower means new lines scroll within the box
    // instead of growing it, and the toolbar stays a fixed ~32px below wherever you are typing.
    maxHeight = 'max-h-[60vh]',
  } = props

  const toolbarRef = useRef<HTMLDivElement>(null)

  /**
   * Keep the format toolbar on screen while typing.
   *
   * Capping the content area's height is not sufficient on its own: the box grows *downwards*, so an
   * editor that starts near the bottom of the viewport pushes its toolbar past the bottom edge long
   * before the content ever reaches the height cap. The bio editor at the end of the signup form is
   * the worst case — it is the last thing on the page, so it always starts there.
   *
   * `scrollIntoView({block: 'nearest'})` on the toolbar scrolls by the minimum needed and does nothing
   * when it is already visible, so it neither fights the user's own scrolling nor jumps the page. It
   * also walks whatever scrollable ancestor actually exists rather than assuming the window scrolls.
   *
   * Guarded on `isFocused` so that programmatic content changes (loading an existing bio, the
   * auto-fill extraction writing its result) cannot yank the page around while the user is elsewhere.
   */
  useEffect(() => {
    if (!editor) return
    const keepToolbarInView = () => {
      if (!editor.isFocused) return
      const el = toolbarRef.current
      if (!el) return

      // Explicit rather than `scrollIntoView({block: 'nearest'})`. 'nearest' considers an element
      // that is flush with the edge to be already visible and does nothing — and in that no-op case
      // Chrome does not apply `scroll-margin` either, so the toolbar ends up hard against the bottom
      // edge with its border clipped. Computing the overshoot ourselves guarantees the gap.

      // The containing scroller first (a modal body, say). Inside a modal this is the only thing that
      // moves: the page behind it is locked, so the window branch below is a no-op there.
      const scroller = getScrollParent(el)
      if (scroller) {
        const overshoot =
          el.getBoundingClientRect().bottom +
          TOOLBAR_VIEWPORT_GAP -
          scroller.getBoundingClientRect().bottom
        if (overshoot > 0) scroller.scrollTop += overshoot
      }

      // Then the window, for the inline case — and for a modal that is itself taller than the screen.
      // Re-measure: the scroller above may already have moved it.
      const rect = el.getBoundingClientRect()
      const overshoot = rect.bottom + TOOLBAR_VIEWPORT_GAP - getUsableViewportBottom()
      if (overshoot > 0) window.scrollBy(0, overshoot)
      else if (rect.top < 0) el.scrollIntoView({block: 'nearest'})
    }
    editor.on('update', keepToolbarInView)
    editor.on('selectionUpdate', keepToolbarInView)
    return () => {
      editor.off('update', keepToolbarInView)
      editor.off('selectionUpdate', keepToolbarInView)
    }
  }, [editor])

  return (
    // matches input styling
    <div
      className={clsx(
        'border-ink-300 bg-canvas-50 focus-within:border-primary-500 focus-within:ring-primary-500 w-full overflow-hidden rounded-lg border shadow-sm transition-colors focus-within:ring-1',
        className,
      )}
    >
      <FloatingFormatMenu editor={editor} advanced={!simple} />
      <div className={clsx(`overflow-auto`, maxHeight)}>
        <EditorContent editor={editor} onBlur={onBlur} onChange={onChange} />
      </div>

      <div ref={toolbarRef}>
        <StickyFormatMenu editor={editor} hideEmbed={hideEmbed}>
          {children}
        </StickyFormatMenu>
      </div>
    </div>
  )
}

function RichContent(props: {content: JSONContent; className?: string; size?: 'sm' | 'md' | 'lg'}) {
  const {className, content, size = 'md'} = props
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxUrl, setLightboxUrl] = useState('')

  const jsxContent = useMemo(() => {
    try {
      return renderJSONContent(content, size, (url) => {
        setLightboxUrl(url)
        setLightboxOpen(true)
      })
    } catch (e) {
      console.error('Error generating react', e, 'for content', content)
      return ''
    }
  }, [content, size])

  if (!content) return null

  return (
    <>
      <div
        className={clsx(
          'ProseMirror custom-link',
          className,
          proseClass(size),
          String.raw`empty:prose-p:after:content-["\00a0"]`, // make empty paragraphs have height
        )}
      >
        {jsxContent}
      </div>
      <Modal open={lightboxOpen} setOpen={setLightboxOpen}>
        <div className={MODAL_CLASS}>
          <Image
            src={lightboxUrl}
            width={1000}
            height={1000}
            alt=""
            className="max-h-[90vh] w-auto"
          />
        </div>
      </Modal>
    </>
  )
}

function renderJSONContent(
  doc: JSONContent,
  size: 'sm' | 'md' | 'lg',
  onImageClick?: (url: string) => void,
): ReactNode {
  return recurse(doc, 0, size, onImageClick)
}

function recurse(
  node: JSONContent,
  key: number,
  size: 'sm' | 'md' | 'lg',
  onImageClick?: (url: string) => void,
): ReactNode {
  const children = node.content?.map((n, i) => recurse(n, i, size, onImageClick))

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
        <button
          key={key}
          type="button"
          onClick={() => onImageClick?.(node.attrs?.src ?? '')}
          className="cursor-pointer"
        >
          <img
            src={node.attrs?.src}
            alt={node.attrs?.alt ?? ''}
            title={node.attrs?.title ?? undefined}
            className={size === 'sm' ? 'max-h-32' : size === 'md' ? 'max-h-64' : undefined}
          />
        </button>
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
