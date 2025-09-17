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

export function EditableBio(props: {
  profile: Profile
  onSave: () => void
  onCancel?: () => void
}) {
  const { profile, onCancel, onSave } = props
  const editor = useTextEditor({
    max: MAX_DESCRIPTION_LENGTH,
    defaultValue: (profile.bio as JSONContent) ?? '',
    placeholder: "Tell us about yourself — and what you're looking for!",
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
    placeholder: "Tell us about yourself — and what you're looking for!",
  })

  return (
    <Col className="relative w-full">
      <TextEditor
        editor={editor}
        onBlur={() => {
          // console.log('onchange', editor?.getText())
          if (editor) onChange(editor.getJSON())
        }}
      />
    </Col>
  )
}
