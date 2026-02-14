import {Editor} from '@tiptap/core'
import {MAX_DESCRIPTION_LENGTH} from 'common/envs/constants'
import {Profile, ProfileWithoutUser} from 'common/profiles/profile'
import {tryCatch} from 'common/util/try-catch'
import {Button} from 'web/components/buttons/button'
import {Col} from 'web/components/layout/col'
import {Row} from 'web/components/layout/row'
import {TextEditor, useTextEditor} from 'web/components/widgets/editor'
import {updateProfile} from 'web/lib/api'
import {track} from 'web/lib/service/analytics'
import {useEffect, useState} from "react";
import ReactMarkdown from "react-markdown";
import {MIN_BIO_LENGTH} from "common/constants";
import {ShowMore} from 'web/components/widgets/show-more'
import {NewTabLink} from 'web/components/widgets/new-tab-link'
import {useT} from 'web/lib/locale'
import {richTextToString} from 'common/util/parse'

export function BioTips({onClick}: { onClick?: () => void }) {
  const t = useT();
  const tips = t('profile.bio.tips_list', `
- Your core values, interests, and activities
- Personality traits, what makes you unique and what you care about
- Connection goals (collaborative, friendship, romantic)
- Expectations and boundaries
- Availability, how to contact you or start a conversation (email, social media, etc.)
- Optional: romantic preferences, lifestyle habits, and conversation starters
`);

  return (
    <ShowMore
      labelClosed={t('profile.bio.tips', 'Tips')}
      labelOpen={t('profile.bio.hide_info', 'Hide info')}
      className={'custom-link text-sm'}
    >
      <p>{t('profile.bio.tips_intro', "Write a clear and engaging bio to help others understand who you are and the connections you seek. Include:")}</p>
      <ReactMarkdown>{tips}</ReactMarkdown>
      <NewTabLink
        href="/tips-bio"
        onClick={onClick}>{t('profile.bio.tips_link', 'Read full tips for writing a high-quality bio')}</NewTabLink>
    </ShowMore>
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
  const t = useT();

  const hideButtons = (textLength === 0) && !profile.bio

  const saveBio = async () => {
    if (!editor) return
    // console.log(editor.getText().length)
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
          if (e) setTextLength(e.getText().length)
          e?.on('update', () => {
            setTextLength(e.getText().length);
          });
        }}
      />
      {!hideButtons && (
        <Row className="absolute bottom-1 right-1 justify-between gap-2">
          {onCancel && (
            <Button size="xs" color="gray-outline" onClick={onCancel}>
              {t('profile.bio.cancel', 'Cancel')}
            </Button>
          )}
          <Button
            size="xs"
            onClick={async () => {
              await saveBio()
              onSave()
            }}
          >
            {t('profile.bio.save', 'Save')}
          </Button>
        </Row>
      )}
    </Col>
  )
}

export function SignupBio(props: {
  onChange: (e: Editor) => void
  profile?: ProfileWithoutUser | undefined
  onClickTips?: () => void
  onEditor?: (editor: any) => void
}) {
  const {onChange, profile, onClickTips, onEditor} = props
  const [editor, setEditor] = useState<any>(null)

  // Keep the editor content in sync with profile.bio when it becomes available
  useEffect(() => {
    if (!editor) return
    const profileText = profile?.bio ? richTextToString(profile.bio as any) : ''
    const currentText = editor?.getText?.() ?? ''
    // Only update if the underlying text differs to avoid clobbering user input unnecessarily
    if (profileText !== currentText) {
      editor.commands.setContent(profile?.bio ?? '')
    }
  }, [profile?.bio, editor])

  return (
    <Col className="relative w-full">
      <BaseBio
        defaultValue={profile?.bio}
        onBlur={(editor) => {
          if (!editor) return
          onChange(editor)
        }}
        onClickTips={onClickTips}
        onEditor={(e) => {
          setEditor(e)
          onEditor?.(e)
        }}
      />
    </Col>
  )
}

interface BaseBioProps {
  defaultValue?: any
  onBlur?: (editor: any) => void
  onEditor?: (editor: any) => void
  onClickTips?: () => void
}

export function BaseBio({defaultValue, onBlur, onEditor, onClickTips}: BaseBioProps) {
  const t = useT();
  const editor = useTextEditor({
    // extensions: [StarterKit],
    max: MAX_DESCRIPTION_LENGTH,
    defaultValue: defaultValue,
    placeholder: t('profile.bio.placeholder', "Tell us about yourself — and what you're looking for!"),
  })
  const textLength = editor?.getText().length ?? 0
  const remainingChars = MIN_BIO_LENGTH - textLength

  useEffect(() => {
    onEditor?.(editor)
  }, [editor, onEditor])

  return (
    <div>
      {textLength < MIN_BIO_LENGTH &&
          <p>
            {remainingChars === 1
              ? t('profile.bio.add_characters_one', 'Add {count} more character so you can appear in search results—or take your time and start by exploring others.', {count: remainingChars})
              : t('profile.bio.add_characters_many', 'Add {count} more characters so you can appear in search results—or take your time and start by exploring others.', {count: remainingChars})
            }
          </p>
      }
      <BioTips onClick={onClickTips}/>
      <TextEditor
        editor={editor}
        onBlur={() => onBlur?.(editor)}
      />
    </div>
  )
}
