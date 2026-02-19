import {Editor} from '@tiptap/react'
import {DOMAIN} from 'common/envs/constants'
import {useState} from 'react'
import {Button} from '../buttons/button'
import {Col} from '../layout/col'
import {Modal} from '../layout/modal'
import {Row} from '../layout/row'
import {Spacer} from '../layout/spacer'
import toast from 'react-hot-toast'

type EmbedPattern = {
  // Regex should have a single capture group.
  regex: RegExp
  rewrite: (text: string) => string
}

const embedPatterns: EmbedPattern[] = [
  {
    regex: /^https?:\/\/manifold\.markets\/([^\/]+\/[^\/]+)/,
    rewrite: (slug) => `<iframe src="https://manifold.markets/embed/${slug}"></iframe>`,
  },
  {
    regex: /^https?:\/\/www\.youtube\.com\/watch\?v=([^&]+)/,
    rewrite: (id) => `<iframe src="https://www.youtube.com/embed/${id}"></iframe>`,
  },
  // Also rewrite youtube links like `https://youtu.be/IOlKZDgyQRQ`
  {
    regex: /^https?:\/\/youtu\.be\/([^&]+)/,
    rewrite: (id) => `<iframe src="https://www.youtube.com/embed/${id}"></iframe>`,
  },
  // Twitch is a bit annoying, since it requires the `&parent=DOMAIN` to match
  {
    // Twitch: https://www.twitch.tv/videos/1445087149
    regex: /^https?:\/\/www\.twitch\.tv\/videos\/(\d+)/,
    rewrite: (id) =>
      `<iframe src="https://player.twitch.tv/?video=${id}&parent=${DOMAIN}"></iframe>`,
  },
  {
    // Twitch: https://www.twitch.tv/sirsalty
    regex: /^https?:\/\/www\.twitch\.tv\/([^\/]+)/,
    rewrite: (channel) =>
      `<iframe src="https://player.twitch.tv/?channel=${channel}&parent=${DOMAIN}"></iframe>`,
  },
  {
    // Tiktok: https://www.tiktok.com/@tiktok/video/6959980000000000001
    regex: /^https?:\/\/www\.tiktok\.com\/@[^\/]+\/video\/(\d+)/,
    rewrite: (id) => `<iframe src="https://www.tiktok.com/embed/v2/${id}"></iframe>`,
  },
]

function embedCode(text: string) {
  for (const pattern of embedPatterns) {
    const match = text.trim().match(pattern.regex)
    if (match) {
      return pattern.rewrite(match[1])
    }
  }

  return null
}

export function EmbedModal(props: {
  editor: Editor | null
  open: boolean
  setOpen: (open: boolean) => void
}) {
  const {editor, open, setOpen} = props
  const [input, setInput] = useState('')
  const embed = embedCode(input)

  return (
    <Modal open={open} setOpen={setOpen}>
      <Col className="bg-canvas-0 gap-2 rounded p-6">
        <label htmlFor="embed" className="text-ink-700 block text-sm font-medium">
          Embed a Youtube video
        </label>
        <input
          type="text"
          name="embed"
          id="embed"
          className="bg-canvas-50 border-ink-300 placeholder:text-ink-300 focus:border-primary-500 focus:ring-primary-500 block w-full rounded-md shadow-sm sm:text-sm"
          placeholder="e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />

        {embed && <div dangerouslySetInnerHTML={{__html: embed}}></div>}
        <Spacer h={2} />

        <Row className="gap-2">
          <Button
            color={embed ? 'indigo' : 'gray'}
            style={{cursor: embed ? 'pointer' : 'not-allowed'}}
            onClick={() => {
              if (editor && embed) {
                editor.chain().insertContent(embed).run()
                setInput('')
                setOpen(false)
              } else {
                toast.error(`We only allow embeds from a few sites. Please open a pull request.`)
              }
            }}
          >
            Embed
          </Button>
          <Button
            color="gray"
            onClick={() => {
              setInput('')
              setOpen(false)
            }}
          >
            Cancel
          </Button>
        </Row>
      </Col>
    </Modal>
  )
}
