import {PencilIcon} from '@heroicons/react/24/outline'
import {JSONContent} from '@tiptap/core'
import clsx from 'clsx'
import {Profile} from 'common/profiles/profile'
import {Col} from 'web/components/layout/col'
import {Row} from 'web/components/layout/row'
import {Content} from 'web/components/widgets/editor'
import {Tooltip} from 'web/components/widgets/tooltip'
import {useT} from 'web/lib/locale'

import {BIO_PARAGRAPH_SPACING, BIO_TEXT_SIZE, EditableBio} from './editable-bio'

export function BioBlock(props: {
  isCurrentUser: boolean
  profile: Profile
  refreshProfile: () => void
  edit: boolean
  setEdit: (edit: boolean) => void
}) {
  const {isCurrentUser, refreshProfile, profile, edit, setEdit} = props
  const t = useT()

  return (
    <Col
      className={clsx(
        'flex-grow whitespace-pre-line rounded-md leading-relaxed',
        !edit && 'px-0 py-2',
      )}
    >
      <Row className="w-full">
        {!edit && profile.bio && (
          <Col className="flex w-full flex-grow" data-testid="profile-bio">
            <Content
              className={clsx('w-full', BIO_PARAGRAPH_SPACING, BIO_TEXT_SIZE)}
              content={profile.bio as JSONContent}
              footnotes
            />
          </Col>
        )}
        {edit && (
          <EditableBio
            profile={profile}
            onCancel={profile.bio ? () => setEdit(false) : undefined}
            onSave={() => {
              refreshProfile()
              setEdit(false)
            }}
          />
        )}
        {isCurrentUser && !edit && (
          <Tooltip
            text={t('more_options_user.edit_bio', 'Edit bio')}
            noTap
            testId="profile-bio-options"
            className={'h-fit'}
          >
            <button
              type="button"
              className="text-ink-500 hover-bold flex items-center"
              aria-label={t('more_options_user.edit_bio', 'Edit bio')}
              onClick={() => setEdit(true)}
            >
              <PencilIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          </Tooltip>
        )}
      </Row>
    </Col>
  )
}
