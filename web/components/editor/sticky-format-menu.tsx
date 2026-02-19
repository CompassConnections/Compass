import {EmojiHappyIcon} from '@heroicons/react/outline'
import {CodeIcon, PhotographIcon} from '@heroicons/react/solid'
import {Editor} from '@tiptap/react'
import {MouseEventHandler, useState} from 'react'
import {FileUploadButton} from '../buttons/file-upload-button'
import {LoadingIndicator} from '../widgets/loading-indicator'
import {EmbedModal} from './embed-modal'
import type {UploadMutation} from './upload-extension'
import {Row} from 'web/components/layout/row'
import {Tooltip} from '../widgets/tooltip'
import {useT} from 'web/lib/locale'

/* Toolbar, with buttons for images and embeds */
export function StickyFormatMenu(props: {
  editor: Editor | null
  hideEmbed?: boolean
  children?: React.ReactNode
}) {
  const {editor, hideEmbed, children} = props
  const upload = editor?.storage.upload.mutation
  const t = useT()

  const [iframeOpen, setIframeOpen] = useState(false)

  return (
    <Row className="text-ink-600 h-8 items-center">
      <UploadButton key={'upload-button'} upload={upload} />
      {!hideEmbed && (
        <ToolbarButton
          key={'embed-button'}
          label={t('sticky_format_menu.add_embed', 'Add embed')}
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
            setIframeOpen(true)
          }}
        >
          <CodeIcon className="h-5 w-5" aria-hidden="true" />
        </ToolbarButton>
      )}
      <ToolbarButton
        key={'emoji-button'}
        label={t('sticky_format_menu.add_emoji', 'Add emoji')}
        onClick={() => insertEmoji(editor)}
      >
        <EmojiHappyIcon className="h-5 w-5" />
      </ToolbarButton>

      <EmbedModal editor={editor} open={iframeOpen} setOpen={setIframeOpen} />
      <div className="grow" />
      {children}
    </Row>
  )
}

function UploadButton(props: {upload: UploadMutation}) {
  const {upload} = props
  const t = useT()

  return (
    <Tooltip
      text={t('sticky_format_menu.upload_image', 'Upload image')}
      className="flex items-stretch"
      placement="bottom"
    >
      <FileUploadButton
        onFiles={(files) => upload?.mutate(files)}
        className="hover:text-ink-700 disabled:text-ink-300 active:text-ink-800 text-ink-400 relative flex rounded px-3 py-1 pl-4 transition-colors"
      >
        <Row className={'items-center justify-start gap-2'}>
          <PhotographIcon className="h-5 w-5" aria-hidden="true" />
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
  children: React.ReactNode
}) {
  const {label, onClick, children} = props

  return (
    <Tooltip text={label} className="flex items-stretch" placement="bottom">
      <button
        type="button"
        onClick={onClick}
        className="text-ink-400 hover:text-ink-700 active:text-ink-800 disabled:text-ink-300 flex rounded px-3 py-1 transition-colors"
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
