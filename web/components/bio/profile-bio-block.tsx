import {PencilIcon, XIcon} from '@heroicons/react/outline'
import {JSONContent} from '@tiptap/core'
import clsx from 'clsx'
import {Profile} from 'common/profiles/profile'
import {tryCatch} from 'common/util/try-catch'
import DropdownMenu from 'web/components/comments/dropdown-menu'
import {Col} from 'web/components/layout/col'
import {Row} from 'web/components/layout/row'
import {Content} from 'web/components/widgets/editor'
import {Tooltip} from 'web/components/widgets/tooltip'
import {updateProfile} from 'web/lib/api'
import {useT} from 'web/lib/locale'

import {EditableBio} from './editable-bio'

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
        'bg-canvas-0 flex-grow whitespace-pre-line rounded-md leading-relaxed',
        !edit && 'px-3 py-2',
      )}
    >
      <Row className="w-full" data-testid="profile-bio">
        {!edit && profile.bio && (
          <Col className="flex w-full flex-grow">
            <Content className="w-full" content={profile.bio as JSONContent} />
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
            text={t('more_options_user.edit_bio', 'Bio options')}
            noTap
            testId="profile-bio-options"
          >
            <DropdownMenu
              items={[
                {
                  name: t('profile.bio.edit', 'Edit'),
                  icon: <PencilIcon className="h-5 w-5" />,
                  onClick: () => setEdit(true),
                },
                {
                  name: t('profile.bio.delete', 'Delete'),
                  icon: <XIcon className="h-5 w-5" />,
                  onClick: async () => {
                    const {error} = await tryCatch(updateProfile({bio: null}))
                    if (error) console.error(error)
                    else refreshProfile()
                  },
                },
              ]}
              closeOnClick
            />
          </Tooltip>
        )}
      </Row>
    </Col>
  )
}
