import {Col} from 'web/components/layout/col'
import {Row} from 'web/components/layout/row'
import {useUser} from 'web/hooks/use-user'
import {TextEditor, useTextEditor} from "web/components/widgets/editor";
import {JSONContent} from "@tiptap/core";
import {MAX_DESCRIPTION_LENGTH} from "common/envs/constants";
import {Button} from "web/components/buttons/button";
import {api} from "web/lib/api";
import {Title} from "web/components/widgets/title";
import toast from "react-hot-toast";
import Link from "next/link";
import {formLink} from "common/constants";

export function ContactComponent() {
  const user = useUser()

  const editor = useTextEditor({
    max: MAX_DESCRIPTION_LENGTH,
    defaultValue: '',
    placeholder: 'Contact us here...',
  })

  const showButton = !!editor?.getText().length

  return (
    <Col className="mx-2">
      <Title className="!mb-2 text-3xl">Contact</Title>
      <p className={'custom-link mb-4'}>
        You can also contact us through this <Link href={formLink}>feedback form</Link> or any of our <Link
        href={'/social'}>socials</Link>.
      </p>
      <Col>
        <div className={'mb-2'}>
          <TextEditor
            editor={editor}
          />
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
                };
                const result = await api('contact', data).catch(() => {
                  toast.error('Failed to contact — try again or contact us...')
                })
                if (!result) return
                editor.commands.clearContent()
                toast.success('Thank you for your message!')
              }}
            >
              Submit
            </Button>
          </Row>
        )}
      </Col>
    </Col>
  )
}
