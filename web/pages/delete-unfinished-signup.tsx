import {useRouter} from 'next/router'
import {useState} from 'react'
import {Button} from 'web/components/buttons/button'
import {PageBase} from 'web/components/page-base'
import {SEO} from 'web/components/SEO'
import {api} from 'web/lib/api'
import {useT} from 'web/lib/locale'

type Outcome = 'deleted' | 'gone' | 'has_account' | 'error'

/**
 * Where the "delete this login" link in the unfinished-sign-up notice lands.
 *
 * A page with a button rather than a link that deletes on GET: mail clients and link scanners
 * prefetch URLs, and a login must not vanish because a spam filter looked at the email. One
 * confirming click, then the API does the work with the token as its only credential — there is
 * no account to sign in to, which is the whole point.
 */
export default function DeleteUnfinishedSignupPage() {
  const t = useT()
  const router = useRouter()
  const token = typeof router.query.token === 'string' ? router.query.token : undefined
  const [busy, setBusy] = useState(false)
  const [outcome, setOutcome] = useState<Outcome | null>(null)

  const handleDelete = async () => {
    if (!token) return
    setBusy(true)
    try {
      const {status} = await api('delete-unfinished-signup', {token})
      setOutcome(status)
    } catch (e) {
      console.error(e)
      setOutcome('error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <PageBase
      trackPageView={'delete-unfinished-signup'}
      className="max-w-2xl mx-auto p-8 text-gray-800 dark:text-white col-span-8 bg-canvas-50"
    >
      <SEO
        title={t('delete_unfinished.seo.title', 'Delete an unfinished sign-up')}
        description={t(
          'delete_unfinished.seo.description',
          'Remove a Compass login that never became an account',
        )}
        url={'/delete-unfinished-signup'}
      />

      <div className="space-y-6 text-center">
        <h1 className="text-3xl font-semibold">
          {t('delete_unfinished.title', 'Delete this unfinished sign-up')}
        </h1>

        {!token ? (
          <p className="text-lg text-gray-600 dark:text-gray-300">
            {t(
              'delete_unfinished.no_token',
              'This page only works from the link in the email we sent you. If you have a full account and want to delete it, use the Settings page.',
            )}
          </p>
        ) : outcome === null ? (
          <>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              {t(
                'delete_unfinished.intro',
                'This removes the login that was created with your email address and any photo uploaded while signing up. Nothing else exists: no profile was ever published.',
              )}
            </p>
            <Button
              onClick={handleDelete}
              disabled={busy}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-md font-medium"
            >
              {busy
                ? t('delete_unfinished.deleting', 'Deleting…')
                : t('delete_unfinished.button', 'Delete this login')}
            </Button>
          </>
        ) : (
          <p className="text-lg text-gray-600 dark:text-gray-300">
            {outcome === 'deleted'
              ? t(
                  'delete_unfinished.done',
                  'Done. The login and your email address have been removed. You will not hear from us again unless you sign up afresh.',
                )
              : outcome === 'gone'
                ? t(
                    'delete_unfinished.gone',
                    'There is nothing left to delete: this login is already gone, or the link has expired.',
                  )
                : outcome === 'has_account'
                  ? t(
                      'delete_unfinished.has_account',
                      'This login has since become a full account, so this link no longer applies. You can delete the account from the Settings page.',
                    )
                  : t(
                      'delete_unfinished.error',
                      'Something went wrong. Please try again in a moment, or email hello@compassmeet.com and a person will remove it.',
                    )}
          </p>
        )}
      </div>
    </PageBase>
  )
}
