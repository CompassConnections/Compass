import {Button} from 'web/components/buttons/button'
import {PageBase} from 'web/components/page-base'
import {SEO} from 'web/components/SEO'
import {useT} from 'web/lib/locale'

export default function DeleteAccountPage() {
  const t = useT()

  const handleRequestDeletion = () => {
    // This would typically open an email client or a form
    window.location.href =
      'mailto:hello@compassmeet.com?subject=Account%20Deletion%20Request&body=Please%20delete%20my%20account%20and%20associated%20data.%0D%0A%0D%0AUsername%3A%20%5BYour%20Username%5D%0D%0A%0D%0AAdditional%20notes%3A'
  }

  return (
    <PageBase
      trackPageView={'delete-account'}
      className="max-w-4xl mx-auto p-8 text-gray-800 dark:text-white col-span-8 bg-canvas-0"
    >
      <SEO
        title={t('delete.seo.title', 'Delete Your Account')}
        description={t('delete.seo.description', 'Request account deletion for Compass')}
        url={'/delete-account'}
      />

      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-semibold mb-4">
            {t('delete.title', 'Delete Your Account')}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            {t(
              'delete.intro',
              "We're sorry to see you go. You can delete your account in the Settings page. Otherwise, here's how to request account deletion by email.",
            )}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-4">
              {t('delete.how.title', 'How to Delete Your Account')}
            </h2>
            <ol className="list-decimal list-inside space-y-4 pl-2">
              <li>
                {t('delete.how.step1', 'Send an email to ')} <strong>hello@compassmeet.com</strong>{' '}
                {t('delete.how.step1_subject', 'with the subject line "Account Deletion Request"')}
              </li>
              <li>
                {t(
                  'delete.how.step2',
                  'Include your username and email address associated with your account',
                )}
              </li>
              <li>
                {t(
                  'delete.how.step3',
                  "Let us know if you'd like to download your data before deletion",
                )}
              </li>
              <li>{t('delete.how.step4', "We'll process your request within 30 days")}</li>
            </ol>

            <div className="mt-6 text-center">
              <Button
                onClick={handleRequestDeletion}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-md font-medium"
              >
                {t('delete.request_button', 'Request Account Deletion')}
              </Button>
            </div>
          </section>

          <section className="pt-6 border-t border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold mb-4">
              {t('delete.what_happens.title', 'What Happens When You Delete Your Account')}
            </h2>
            <ul className="list-disc list-inside space-y-2 pl-2">
              <li>
                {t(
                  'delete.what_happens.profile',
                  'Your profile, including all photos and personal information, will be permanently removed',
                )}
              </li>
              <li>
                {t(
                  'delete.what_happens.messages',
                  'Your messages will be deleted from our servers',
                )}
              </li>
              <li>
                {t(
                  'delete.what_happens.username',
                  'Your username will become available for others to use',
                )}
              </li>
              <li>
                {t('delete.what_happens.history', 'Your activity history will be anonymized')}
              </li>
            </ul>
          </section>

          <section className="pt-6 border-t border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold mb-4">
              {t('delete.data.title', 'Data We Retain')}
            </h2>
            <p className="mb-4">
              {t(
                'delete.data.intro',
                'For legal and operational reasons, we may retain certain information after account deletion:',
              )}
            </p>
            <ul className="list-disc list-inside space-y-2 pl-2">
              <li>
                {t(
                  'delete.data.item1',
                  'Transaction records (if any) for financial reporting and compliance',
                )}
              </li>
              <li>{t('delete.data.item2', 'Copies of communications with our support team')}</li>
              <li>
                {t(
                  'delete.data.item3',
                  'Information required to prevent fraud, comply with legal obligations, or enforce our terms',
                )}
              </li>
            </ul>
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              {t(
                'delete.data.note',
                'We retain this data only as long as necessary for these purposes and in accordance with our Privacy Policy.',
              )}
            </p>
          </section>

          <section className="pt-6 border-t border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold mb-4">
              {t('delete.need_help.title', 'Need Help?')}
            </h2>
            <p>
              {t(
                'delete.need_help.text',
                'If you have any questions about account deletion or need assistance, please contact our support team at ',
              )}{' '}
              <a
                href="mailto:hello@compassmeet.com"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                hello@compassmeet.com
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </PageBase>
  )
}
