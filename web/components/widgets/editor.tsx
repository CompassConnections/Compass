import CharacterCount from '@tiptap/extension-character-count'
import { Link } from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import type { Content, JSONContent } from '@tiptap/react'
import {
  Editor,
  EditorContent,
  Extensions,
  mergeAttributes,
  useEditor,
} from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import clsx from 'clsx'
import { ReactNode, useCallback, useEffect, useMemo } from 'react'
import { DisplayMention } from '../editor/user-mention/mention-extension'
import { Linkify } from './linkify'
import { linkClass } from './site-link'
import Iframe from 'common/util/tiptap-iframe'
import { debounce, noop } from 'lodash'
import { FloatingFormatMenu } from '../editor/floating-format-menu'
import { StickyFormatMenu } from '../editor/sticky-format-menu'
import { Upload, useUploadMutation } from '../editor/upload-extension'
import { generateReact } from '../editor/utils'
import { EmojiExtension } from '../editor/emoji/emoji-extension'
import { nodeViewMiddleware } from '../editor/nodeview-middleware'
import { BasicImage, DisplayImage, MediumDisplayImage } from '../editor/image'
import { usePersistentLocalState } from 'web/hooks/use-persistent-local-state'
import { richTextToString } from 'common/util/parse'
import { safeLocalStorage } from 'web/lib/util/local'

const DisplayLink = Link.extend({
  renderHTML({ HTMLAttributes }) {
    HTMLAttributes.target = HTMLAttributes.href.includes('manifold.markets')
      ? '_self'
      : '_blank'
    delete HTMLAttributes.class // only use our classes (don't duplicate on paste)
    return [
      'a',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      0,
    ]
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
      heading: simple ? false : { levels: [1, 2, 3] },
      horizontalRule: simple ? false : {},
    }),
    simple ? DisplayImage : BasicImage,
    EmojiExtension,
    DisplayLink,
    DisplayMention,
    Iframe,
    Upload,
  ])

const proseClass = (size: 'sm' | 'md' | 'lg') =>
  clsx(
    'prose dark:prose-invert max-w-none leading-relaxed',
    'prose-a:text-primary-700 prose-a:no-underline',
    size === 'sm' ? 'prose-sm' : 'text-md',
    size !== 'lg' && 'prose-p:my-0 prose-ul:my-0 prose-ol:my-0 prose-li:my-0',
    '[&>p]:prose-li:my-0',
    'text-ink-900 prose-blockquote:text-teal-700',
    'break-anywhere'
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
}) {
  const { placeholder, className, max, defaultValue, size = 'md', key } = props
  const simple = size === 'sm'

  const [content, setContent] = usePersistentLocalState<
    JSONContent | undefined
  >(undefined, getEditorLocalStorageKey(key ?? ''))

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
    []
  )

  const getEditorProps = () => ({
    attributes: {
      class: clsx(
        proseClass(size),
        'outline-none py-[.5em] px-4',
        'prose-img:select-auto',
        '[&_.ProseMirror-selectednode]:outline-dotted [&_*]:outline-primary-300', // selected img, embeds
        'dark:[&_.ProseMirror-gapcursor]:after:border-white', // gap cursor
        className
      ),
      style: `min-height: ${1 + 1.625 * (simple ? 2 : 3)}em`, // 1em padding + 1.625 lines per row
    },
  })

  const editor = useEditor({
    editorProps: getEditorProps(),
    onUpdate: !key
      ? noop
      : ({ editor }) => {
          save(editor.getJSON())
        },
    extensions: [
      ...editorExtensions(simple),
      Placeholder.configure({
        placeholder,
        emptyEditorClass:
          'before:content-[attr(data-placeholder)] before:text-ink-500 before:float-left before:h-0 cursor-text',
      }),
      CharacterCount.configure({ limit: max }),
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
  const { editor, simple, hideEmbed, children, className, onBlur, onChange } = props

  return (
    // matches input styling
    <div
      className={clsx(
        'border-ink-300 bg-canvas-0 focus-within:border-primary-500 focus-within:ring-primary-500 w-full overflow-hidden rounded-lg border shadow-sm transition-colors focus-within:ring-1',
        className
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

function RichContent(props: {
  content: JSONContent
  className?: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const { className, content, size = 'md' } = props

  const jsxContent = useMemo(() => {
    try {
      return generateReact(content, [
        StarterKit as any,
        size === 'sm'
          ? DisplayImage
          : size === 'md'
          ? MediumDisplayImage
          : BasicImage,
        DisplayLink,
        DisplayMention,
        Iframe,
      ])
    } catch (e) {
      console.error('Error generating react', e, 'for content', content)
      return ''
    }
  }, [content, size])

  return (
    <div
      className={clsx(
        'ProseMirror',
        className,
        proseClass(size),
        String.raw`empty:prose-p:after:content-["\00a0"]` // make empty paragraphs have height
      )}
    >
      {jsxContent}
    </div>
  )
}

// backwards compatibility: we used to store content as strings
export function Content(props: {
  content: JSONContent | string
  /** font/spacing */
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const { className, size = 'md', content } = props
  return typeof content === 'string' ? (
    <Linkify
      className={clsx('whitespace-pre-line', proseClass(size), className)}
      text={content || ''}
    />
  ) : (
    <RichContent {...(props as any)} />
  )
}
