import {Editor} from '@tiptap/core'
import {MAX_DESCRIPTION_LENGTH} from 'common/envs/constants'
import {Profile} from 'common/love/profile'
import {tryCatch} from 'common/util/try-catch'
import {Button} from 'web/components/buttons/button'
import {Col} from 'web/components/layout/col'
import {Row} from 'web/components/layout/row'
import {TextEditor, useTextEditor} from 'web/components/widgets/editor'
import {updateProfile} from 'web/lib/api'
import {track} from 'web/lib/service/analytics'
import {useEffect, useState} from "react";
import ReactMarkdown from "react-markdown";
import Link from "next/link"
import {MIN_BIO_LENGTH} from "common/constants";

const placeHolder = "Tell us about yourself — and what you're looking for!";

const tips = `
Write a clear and engaging bio to help others understand who you are and the connections you seek. Include:
- Your core values, interests, and activities
- Connection goals (friendship, romantic, collaborative) and availability
- What makes you unique and what you care about
- Expectations, boundaries, and personality traits
- How to contact you or start a conversation (email, social media, etc.)
- Optional: romantic preferences, lifestyle habits, and conversation starters
`

export function BioTips() {
  const [showMoreInfo, setShowMoreInfo] = useState(false)

  return (
    <div className="mt-2 mb-4">
      <button
        type="button"
        onClick={() => setShowMoreInfo(!showMoreInfo)}
        className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
      >
        {showMoreInfo ? 'Hide info' : 'Tips'}
        <svg
          className={`w-4 h-4 ml-1 transition-transform ${showMoreInfo ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
        </svg>
      </button>
      {showMoreInfo && (
        <div className="mt-2 p-3 rounded-md text-sm customlink">
          <ReactMarkdown>{tips}</ReactMarkdown>
          <Link href="/tips-bio" target="_blank">Read full tips for writing a high-quality bio</Link>
        </div>
      )}
    </div>
  )
}

export function EditableBio(props: {
  profile: Profile
  onSave: () => void
  onCancel?: () => void
}) {
  const {profile, onCancel, onSave} = props
  const [editor, setEditor] = useState<any>(null)
  const [textLength, setTextLength] = useState(0);

  const hideButtons = (textLength === 0) && !profile.bio

  const saveBio = async () => {
    if (!editor) return
    console.log(editor.getText().length)
    const {error} = await tryCatch(updateProfile({bio: editor.getJSON(), bio_length: editor.getText().length}))

    if (error) {
      console.error(error)
      return
    }

    track('edited profile bio')
  }

  return (
    <Col className="relative w-full">
      <BaseBio
        defaultValue={profile.bio}
        onEditor={(e) => {
          setEditor(e);
          e?.on('update', () => {
            setTextLength(e.getText().length);
          });
        }}
      />
      {!hideButtons && (
        <Row className="absolute bottom-1 right-1 justify-between gap-2">
          {onCancel && (
            <Button size="xs" color="gray-outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button
            size="xs"
            onClick={async () => {
              await saveBio()
              onSave()
            }}
          >
            Save
          </Button>
        </Row>
      )}
    </Col>
  )
}

export function SignupBio(props: {
  onChange: (e: Editor) => void
}) {
  const {onChange} = props
  return (
    <Col className="relative w-full">
      <BaseBio
        onBlur={(editor) => {
          if (!editor) return
          onChange(editor)
        }}
      />
    </Col>
  )
}

interface BaseBioProps {
  defaultValue?: any
  onBlur?: (editor: any) => void
  onEditor?: (editor: any) => void
}

export function BaseBio({defaultValue, onBlur, onEditor}: BaseBioProps) {
  const editor = useTextEditor({
    // extensions: [StarterKit],
    max: MAX_DESCRIPTION_LENGTH,
    defaultValue: defaultValue,
    placeholder: placeHolder,
  })
  const textLength = editor?.getText().length ?? 0

  useEffect(() => {
    onEditor?.(editor)
  }, [editor, onEditor])

  return (
    <div>
      {textLength < MIN_BIO_LENGTH &&
          <p>
              Add {MIN_BIO_LENGTH - textLength} more {MIN_BIO_LENGTH - textLength === 1 ? 'character' : 'characters'} so
              your profile can appear in search results—or leave it for now and explore others’ profiles first.
          </p>
      }
      <BioTips/>
      <TextEditor
        editor={editor}
        onBlur={() => onBlur?.(editor)}
      />
    </div>
  )
}
