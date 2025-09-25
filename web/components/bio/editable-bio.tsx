import { JSONContent } from '@tiptap/core'
import { MAX_DESCRIPTION_LENGTH } from 'common/envs/constants'
import { Profile } from 'common/love/profile'
import { tryCatch } from 'common/util/try-catch'
import { Button } from 'web/components/buttons/button'
import { Col } from 'web/components/layout/col'
import { Row } from 'web/components/layout/row'
import { TextEditor, useTextEditor } from 'web/components/widgets/editor'
import { updateProfile } from 'web/lib/api'
import { track } from 'web/lib/service/analytics'
import React, {useState} from "react";
import ReactMarkdown from "react-markdown";
import Link from "next/link"

const placeHolder = "Tell us about yourself — and what you're looking for!";

const tips = `
Write a clear and engaging bio to help others understand who you are and the connections you seek. Include:
- Your core values, interests, and activities
- Connection goals (friendship, romantic, collaborative) and availability
- What makes you unique and what you care about
- Expectations, boundaries, and personality traits
- Optional: romantic preferences, lifestyle habits, and conversation starters
`

export function CharLimitText() {
  return <p>Profiles with fewer than 250 characters will be hidden by default from the profile grid — write a meaningful bio so others can find you through keyword search and connect intentionally.</p>
}

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
  const { profile, onCancel, onSave } = props
  const editor = useTextEditor({
    max: MAX_DESCRIPTION_LENGTH,
    defaultValue: (profile.bio as JSONContent) ?? '',
    placeholder: placeHolder,
  })

  const hideButtons = editor?.getText().length === 0 && !profile.bio

  const saveBio = async () => {
    if (!editor) return
    const { error } = await tryCatch(updateProfile({ bio: editor.getJSON() }))

    if (error) {
      console.error(error)
      return
    }

    track('edited profile bio')
  }

  return (
    <Col className="relative w-full">
      <CharLimitText/>
      <BioTips/>
      <TextEditor editor={editor} />

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
  onChange: (e: JSONContent) => void
}) {
  const { onChange } = props
  const editor = useTextEditor({
    max: MAX_DESCRIPTION_LENGTH,
    defaultValue: '',
    placeholder: placeHolder,
  })

  // const [charLength, setCharLength] = useState(0)

  return (
    <Col className="relative w-full">
      <CharLimitText/>
      <BioTips/>
      <TextEditor
        editor={editor}
        onBlur={() => {
          // console.log('onchange', editor?.getText())
          if (!editor) return
          const e = editor.getJSON()
          // console.log(e)
          // const text = e.content.map((block: any) => block.content?.map((c: any) => c.text).join('') ?? '').join('');
          // setCharLength(text.length)
          // console.log(text, text.length)
          // if (text.length < 250) {
          //   return; // do not save
          // }

          // console.log('bio changed', e, profile.bio);
          onChange(e)
        }}
      />
      {/*<p>{charLength} / 250</p>*/}
    </Col>
  )
}
