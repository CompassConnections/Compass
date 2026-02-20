import {JSONContent} from '@tiptap/core'
import {formLink} from 'common/constants'
import {MAX_DESCRIPTION_LENGTH} from 'common/envs/constants'
import Link from 'next/link'
import toast from 'react-hot-toast'
import {Button} from 'web/components/buttons/button'
import {Col} from 'web/components/layout/col'
import {Row} from 'web/components/layout/row'
import {TextEditor, useTextEditor} from 'web/components/widgets/editor'
import {Title} from 'web/components/widgets/title'
import {useUser} from 'web/hooks/use-user'
import {api} from 'web/lib/api'
import {useT} from 'web/lib/locale' // added

export function ContactComponent() {
  const user = useUser()
  const t = useT() // use translations

  const editor = useTextEditor({
    max: MAX_DESCRIPTION_LENGTH,
    defaultValue: '',
    placeholder: t('contact.editor.placeholder', 'Contact us here...'), // localized placeholder
  })

  const showButton = !!editor?.getText().length

  return (
    <Col className="mx-2">
      <Title className="!mb-2 text-3xl">{t('contact.title', 'Contact')}</Title>
      <p className={'custom-link mb-4'}>
        {t('contact.intro_prefix', 'You can also contact us through this ')}
        <Link href={formLink}>{t('contact.form_link', 'feedback form')}</Link>
        {t('contact.intro_middle', ' or any of our ')}
        <Link href={'/social'}>{t('contact.socials', 'socials')}</Link>
        {t(
          'contact.intro_suffix',
          ". Feel free to give your contact information if you'd like us to get back to you.",
        )}
      </p>
      <Col>
        <div className={'mb-2'}>
          <TextEditor editor={editor} />
        </div>
        {showButton && (
          <Row className="right-1 justify-between gap-2">
            <Button
              size="xs"
              onClick={async () => {
                if (!editor) return
                const data = {
                  content: editor.getJSON() as JSONContent,
                  userId: user?.id,
                }
                const result = await api('contact', data).catch(() => {
                  toast.error(
                    t('contact.toast.failed', 'Failed to contact — try again or contact us...'),
                  )
                })
                if (!result) return
                editor.commands.clearContent()
                toast.success(t('contact.toast.success', 'Thank you for your message!'))
              }}
            >
              {t('contact.submit', 'Submit')}
            </Button>
          </Row>
        )}
      </Col>
    </Col>
  )
}
