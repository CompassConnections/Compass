import {TrashIcon} from '@heroicons/react/solid'
import router from 'next/router'
import {useState} from 'react'
import toast from 'react-hot-toast'
import {ConfirmationButton} from '../buttons/confirmation-button'
import {Col} from '../layout/col'
import {Input} from '../widgets/input'
import {Title} from '../widgets/title'
import {deleteAccount} from 'web/lib/util/delete'
import {useT} from 'web/lib/locale'

export function DeleteYourselfButton() {
  const [deleteAccountConfirmation, setDeleteAccountConfirmation] = useState('')
  const t = useT()
  const confirmPhrase = t('delete_yourself.confirm_phrase', 'delete my account')

  return (
    <ConfirmationButton
      openModalBtn={{
        className: 'p-2',
        label: t('delete_yourself.open_label', 'Permanently delete this account'),
        icon: <TrashIcon className="mr-1 h-5 w-5" />,
        color: 'red',
      }}
      submitBtn={{
        label: t('delete_yourself.submit', 'Delete account'),
        color: deleteAccountConfirmation == confirmPhrase ? 'red' : 'gray',
      }}
      onSubmitWithSuccess={async () => {
        if (deleteAccountConfirmation == confirmPhrase) {
          toast
            .promise(deleteAccount(), {
              loading: t('delete_yourself.toast.loading', 'Deleting account...'),
              success: () => {
                router.push('/')
                return t('delete_yourself.toast.success', 'Your account has been deleted.')
              },
              error: () => {
                return t('delete_yourself.toast.error', 'Failed to delete account.')
              },
            })
            .then(() => {
              return true
            })
            .catch(() => {
              return false
            })
        }
        return false
      }}
    >
      <Col>
        <Title>{t('delete_yourself.title', 'Are you sure?')}</Title>
        <div>
          {t(
            'delete_yourself.description',
            'Deleting your account means you will no longer be able to use your account. You will lose access to all of your data.',
          )}
        </div>
        <Input
          type="text"
          placeholder={t(
            'delete_yourself.input_placeholder',
            "Type 'delete my account' to confirm",
          )}
          className="w-full"
          value={deleteAccountConfirmation}
          onChange={(e) => setDeleteAccountConfirmation(e.target.value)}
        />
      </Col>
    </ConfirmationButton>
  )
}
