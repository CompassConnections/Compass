import {FaceSmileIcon} from '@heroicons/react/24/outline'
import {CheckIcon, CodeBracketIcon, LinkIcon, PhotoIcon, XMarkIcon} from '@heroicons/react/24/solid'
import {Editor, useEditorState} from '@tiptap/react'
import clsx from 'clsx'
import {getUrl} from 'common/util/parse'
import {Bold, Heading, Heading1, Heading2, Italic, List, ListOrdered, Quote} from 'lucide-react'
import {MouseEventHandler, useState} from 'react'
import {Row} from 'web/components/layout/row'
import {useT} from 'web/lib/locale'

import {FileUploadButton} from '../buttons/file-upload-button'
import {LoadingIndicator} from '../widgets/loading-indicator'
import {Tooltip} from '../widgets/tooltip'
import {EmbedModal} from './embed-modal'
import {EMOJI_ENABLED} from './emoji/emoji-enabled'
import type {UploadMutation} from './upload-extension'

/* Toolbar, with buttons for images and embeds */
export function StickyFormatMenu(props: {
  editor: Editor | null
  hideEmbed?: boolean
  /** also show block-level formatting (headings, lists, quote) — for long-form fields like the bio */
  full?: boolean
  children?: React.ReactNode
}) {
  const {editor, hideEmbed, full, children} = props
  const upload = editor?.storage.upload.mutation
  const t = useT()

  const [iframeOpen, setIframeOpen] = useState(false)

  return (
    <Row className="text-ink-700 scrollbar-hide h-9 shrink-0 items-center overflow-x-auto border-t border-canvas-200 bg-canvas-50 px-1">
      {full && <FormatButtons editor={editor} />}
      <UploadButton key={'upload-button'} upload={upload} />
      {!hideEmbed && (
        <ToolbarButton
          key={'embed-button'}
          label={t('sticky_format_menu.add_embed', 'Add embed')}
          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
            e.stopPropagation()
            e.preventDefault()
            setIframeOpen(true)
          }}
        >
          <CodeBracketIcon className="h-5 w-5" aria-hidden="true" />
        </ToolbarButton>
      )}
      {EMOJI_ENABLED && (
        <ToolbarButton
          key={'emoji-button'}
          label={t('sticky_format_menu.add_emoji', 'Add emoji')}
          onClick={() => insertEmoji(editor)}
        >
          <FaceSmileIcon className="h-5 w-5" />
        </ToolbarButton>
      )}

      <EmbedModal editor={editor} open={iframeOpen} setOpen={setIframeOpen} />
      <div className="grow" />
      {children}
    </Row>
  )
}

/**
 * Bold/italic, headings, lists, quote and link.
 *
 * Block commands (headings, lists, quote) *have* to live here: they act on an empty selection, and the
 * bubble menu only exists once text is selected. Marks are here too even though the bubble menu also
 * offers them, and that duplication is deliberate — the bar is the discoverable surface (a user who
 * never selects text otherwise never learns the field is rich text, and a bar showing lists but no bold
 * reads as "no bold here"), and on touch it is the reliable one, since the bubble menu collides with
 * iOS's own selection callout. The bubble stays as the fast path when the hand is already on the
 * selection.
 *
 * Deliberately omitted: underline, which on the web reads as a broken link — and dropping it plus
 * folding H1/H2 into one cycling button is what keeps the row inside a 320px screen without scrolling.
 */
function FormatButtons(props: {editor: Editor | null}) {
  const {editor} = props
  const t = useT()

  const [url, setUrl] = useState<string | null>(null)

  // The editor doesn't re-render this component per transaction (see editor.tsx), so subscribe to
  // just the active marks/blocks. Only this row re-renders when the cursor moves between them.
  const active = useEditorState({
    editor,
    selector: ({editor}) =>
      editor
        ? {
            bold: editor.isActive('bold'),
            italic: editor.isActive('italic'),
            h1: editor.isActive('heading', {level: 1}),
            h2: editor.isActive('heading', {level: 2}),
            bulletList: editor.isActive('bulletList'),
            orderedList: editor.isActive('orderedList'),
            blockquote: editor.isActive('blockquote'),
            link: editor.isActive('link'),
          }
        : null,
  })

  if (!editor || !active) return null

  // `simple` editors (size 'sm' — chat, comments) are built without the heading node.
  const hasHeadings = !!editor.schema.nodes.heading

  /** One button for both levels: H1 → H2 → back to body text. */
  const cycleHeading = () => {
    const chain = editor.chain().focus()
    if (active.h1) chain.toggleHeading({level: 2}).run()
    else if (active.h2) chain.setParagraph().run()
    else chain.toggleHeading({level: 1}).run()
  }

  const setLink = () => {
    const href = url && getUrl(url)
    if (!href) return
    // With text selected, mark it. With none (the whole point of having this in the bar), there is
    // nothing to mark, so insert the URL itself as the link text.
    if (editor.state.selection.empty) {
      editor
        .chain()
        .focus()
        .insertContent({type: 'text', text: href, marks: [{type: 'link', attrs: {href}}]})
        .run()
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({href}).run()
    }
  }

  if (url !== null) {
    return (
      <Row className="min-w-0 grow items-center gap-1 pl-2">
        <input
          type="text"
          inputMode="url"
          autoFocus
          className="text-ink-800 h-6 min-w-0 grow border-0 bg-transparent p-0 text-sm !shadow-none !ring-0"
          placeholder={t('sticky_format_menu.link_placeholder', 'Type or paste a link')}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              setLink()
              setUrl(null)
            } else if (e.key === 'Escape') {
              setUrl(null)
              editor.commands.focus()
            }
          }}
        />
        <ToolbarButton
          label={t('sticky_format_menu.apply_link', 'Apply link')}
          onClick={() => (setLink(), setUrl(null))}
        >
          <CheckIcon className="h-5 w-5" aria-hidden="true" />
        </ToolbarButton>
        <ToolbarButton
          label={t('sticky_format_menu.cancel_link', 'Cancel')}
          onClick={() => (setUrl(null), editor.commands.focus())}
        >
          <XMarkIcon className="h-5 w-5" aria-hidden="true" />
        </ToolbarButton>
      </Row>
    )
  }

  return (
    <>
      <ToolbarButton
        label={t('sticky_format_menu.bold', 'Bold')}
        isActive={active.bold}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="h-5 w-5" aria-hidden="true" />
      </ToolbarButton>
      <ToolbarButton
        label={t('sticky_format_menu.italic', 'Italic')}
        isActive={active.italic}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="h-5 w-5" aria-hidden="true" />
      </ToolbarButton>
      <Divider />
      {hasHeadings && (
        <ToolbarButton
          label={t('sticky_format_menu.heading', 'Heading')}
          isActive={active.h1 || active.h2}
          onClick={cycleHeading}
        >
          {/* Icon reflects the level you are currently in, so the cycle is legible. */}
          {active.h1 ? (
            <Heading1 className="h-5 w-5" aria-hidden="true" />
          ) : active.h2 ? (
            <Heading2 className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Heading className="h-5 w-5" aria-hidden="true" />
          )}
        </ToolbarButton>
      )}
      <ToolbarButton
        label={t('sticky_format_menu.bullet_list', 'Bulleted list')}
        isActive={active.bulletList}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="h-5 w-5" aria-hidden="true" />
      </ToolbarButton>
      <ToolbarButton
        label={t('sticky_format_menu.ordered_list', 'Numbered list')}
        isActive={active.orderedList}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="h-5 w-5" aria-hidden="true" />
      </ToolbarButton>
      <ToolbarButton
        label={t('sticky_format_menu.quote', 'Quote')}
        isActive={active.blockquote}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote className="h-5 w-5" aria-hidden="true" />
      </ToolbarButton>
      <ToolbarButton
        label={t('sticky_format_menu.link', 'Link')}
        isActive={active.link}
        onClick={() => (active.link ? editor.chain().focus().unsetLink().run() : setUrl(''))}
      >
        <LinkIcon className="h-5 w-5" aria-hidden="true" />
      </ToolbarButton>
      <Divider />
    </>
  )
}

const Divider = () => <div className="bg-ink-300 mx-1 h-5 w-[1px] shrink-0" />

function UploadButton(props: {upload: UploadMutation}) {
  const {upload} = props
  const t = useT()

  return (
    <Tooltip
      text={t('sticky_format_menu.upload_image', 'Upload photo or video')}
      className="flex shrink-0 items-stretch"
      placement="bottom"
    >
      <FileUploadButton
        onFiles={(files) => upload?.mutate(files)}
        className="hover:text-ink-700 disabled:text-ink-300 active:text-ink-800 text-ink-400 relative flex rounded px-3 py-1 pl-4 transition-colors"
      >
        <Row className={'items-center justify-start gap-2'}>
          <PhotoIcon className="h-5 w-5" aria-hidden="true" />
          {upload?.isLoading && (
            <LoadingIndicator
              className="absolute bottom-0 left-0 right-0 top-0"
              spinnerClassName="!h-6 !w-6 !border-2"
            />
          )}
        </Row>
      </FileUploadButton>
    </Tooltip>
  )
}

function ToolbarButton(props: {
  label: string
  onClick: MouseEventHandler
  isActive?: boolean
  children: React.ReactNode
}) {
  const {label, onClick, isActive, children} = props

  return (
    <Tooltip text={label} className="flex shrink-0 items-stretch" placement="bottom">
      <button
        type="button"
        onClick={onClick}
        // Keep the caret in the document: without this the mousedown blurs the editor, which both
        // loses the selection the command applies to and fires the editor's onBlur (a bio save).
        onMouseDown={(e) => e.preventDefault()}
        aria-pressed={isActive}
        className={clsx(
          'hover:text-ink-700 active:text-ink-800 disabled:text-ink-300 flex rounded px-2 py-1 transition-colors',
          isActive ? 'text-ink-800 bg-ink-200' : 'text-ink-400',
        )}
      >
        {children}
      </button>
    </Tooltip>
  )
}

/** insert a colon, and a space if necessary, to bring up emoji selector */
const insertEmoji = (editor: Editor | null) => {
  if (!editor) return

  const textBefore = editor.view.state.selection.$from.nodeBefore?.text
  const addSpace = textBefore && !textBefore.endsWith(' ')

  editor
    .chain()
    .focus()
    .createParagraphNear()
    .insertContent(addSpace ? ' :' : ':')
    .run()
}
