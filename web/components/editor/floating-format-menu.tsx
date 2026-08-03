import {CheckIcon, LinkIcon, TrashIcon} from '@heroicons/react/24/solid'
import {Editor} from '@tiptap/core'
import {BubbleMenu, useEditorState} from '@tiptap/react'
import clsx from 'clsx'
import {getUrl} from 'common/util/parse'
import {Bold, Italic} from 'lucide-react'
import {useState} from 'react'

// see https://tiptap.dev/guide/menus

/**
 * Bold, italic and link, on selection.
 *
 * Only rendered by editors whose toolbar is `minimal` (chat, comments) — there this is the *only*
 * formatting surface, since their bottom bar carries media buttons alone. Editors with the `full`
 * toolbar deliberately don't show it: everything here is in their always-visible bar, and this menu
 * covers the line above the selection and collides with iOS's native selection callout, so keeping
 * both would mean the flakier of two redundant surfaces.
 *
 * No underline: on the web it reads as a broken link. `Ctrl+U` still works — the extension stays
 * loaded so existing content that has it keeps rendering.
 */
export function FloatingFormatMenu(props: {editor: Editor | null}) {
  const {editor} = props

  const [url, setUrl] = useState<string | null>(null)

  // The editor no longer re-renders this component on every transaction (see editor.tsx), so subscribe
  // to just the active marks we highlight. This re-renders only the bubble menu when they change.
  const active = useEditorState({
    editor,
    selector: ({editor}) =>
      editor
        ? {
            bold: editor.isActive('bold'),
            italic: editor.isActive('italic'),
            link: editor.isActive('link'),
          }
        : null,
  })

  if (!editor || !active) return null

  const setLink = () => {
    const href = url && getUrl(url)
    if (href) {
      editor.chain().focus().extendMarkRange('link').setLink({href}).run()
    }
  }

  const unsetLink = () => editor.chain().focus().unsetLink().run()

  return (
    <BubbleMenu
      editor={editor}
      shouldShow={({state}) => {
        // CellSelection has $anchorCell, regular selections don't
        if ('$anchorCell' in state.selection) return false
        return !state.selection.empty
      }}
      className="text-ink-0 bg-ink-700 flex gap-2 rounded-sm p-1"
    >
      {url === null ? (
        <>
          <IconButton
            icon={Bold}
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={active.bold}
          />
          <IconButton
            icon={Italic}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={active.italic}
          />
          <Divider />
          <IconButton
            icon={LinkIcon}
            onClick={() => (active.link ? unsetLink() : setUrl(''))}
            isActive={active.link}
          />
        </>
      ) : (
        <>
          <input
            type="text"
            inputMode="url"
            className="h-5 border-0 bg-inherit text-sm !shadow-none !ring-0"
            placeholder="Type or paste a link"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUrl(e.target.value)}
          />
          <button onClick={() => (setLink(), setUrl(null))}>
            <CheckIcon className="h-5 w-5" />
          </button>
          <button onClick={() => (unsetLink(), setUrl(null))}>
            <TrashIcon className="h-5 w-5" />
          </button>
        </>
      )}
    </BubbleMenu>
  )
}

const IconButton = (props: {
  icon: React.FC<React.SVGProps<SVGSVGElement>>
  onClick: () => any
  isActive?: boolean
  className?: string
}) => {
  const {icon: Icon, onClick, isActive, className} = props
  return (
    <button onClick={onClick} type="button">
      <Icon className={clsx('h-5', isActive && 'text-primary-200', className)} />
    </button>
  )
}

const Divider = () => <div className="bg-ink-400 mx-0.5 w-[1px]" />
