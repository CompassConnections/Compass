import { PageBase } from "web/components/page-base";
import { SEO } from "web/components/SEO";
import { Button } from "web/components/buttons/button";
import { useRouter } from 'next/router';

export default function DeleteAccountPage() {
  const router = useRouter();
  
  const handleRequestDeletion = () => {
    // This would typically open an email client or a form
    window.location.href = 'mailto:hello@compassmeet.com?subject=Account%20Deletion%20Request&body=Please%20delete%20my%20account%20and%20associated%20data.%0D%0A%0D%0AUsername%3A%20%5BYour%20Username%5D%0D%0A%0D%0AAdditional%20notes%3A';
  };

  return (
    <PageBase
      trackPageView={'delete-account'}
      className="max-w-4xl mx-auto p-8 text-gray-800 dark:text-white col-span-8 bg-canvas-0"
    >
      <SEO
        title={'Delete Your Account'}
        description={'Request account deletion for Compass'}
        url={'/delete-account'}
      />
      
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-semibold mb-4">Delete Your Account</h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            We're sorry to see you go. You can delete your account in the Settings page. Otherwise, here's how to request account deletion by email.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-4">How to Delete Your Account</h2>
            <ol className="list-decimal list-inside space-y-4 pl-2">
              <li>Send an email to <strong>hello@compassmeet.com</strong> with the subject line "Account Deletion Request"</li>
              <li>Include your username and email address associated with your account</li>
              <li>Let us know if you'd like to download your data before deletion</li>
              <li>We'll process your request within 30 days</li>
            </ol>
            
            <div className="mt-6 text-center">
              <Button 
                onClick={handleRequestDeletion}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-md font-medium"
              >
                Request Account Deletion
              </Button>
            </div>
          </section>

          <section className="pt-6 border-t border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold mb-4">What Happens When You Delete Your Account</h2>
            <ul className="list-disc list-inside space-y-2 pl-2">
              <li>Your profile, including all photos and personal information, will be permanently removed</li>
              <li>Your messages will be deleted from our servers</li>
              <li>Your username will become available for others to use</li>
              <li>Your activity history will be anonymized</li>
            </ul>
          </section>

          <section className="pt-6 border-t border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold mb-4">Data We Retain</h2>
            <p className="mb-4">For legal and operational reasons, we may retain certain information after account deletion:</p>
            <ul className="list-disc list-inside space-y-2 pl-2">
              <li>Transaction records (if any) for financial reporting and compliance</li>
              <li>Copies of communications with our support team</li>
              <li>Information required to prevent fraud, comply with legal obligations, or enforce our terms</li>
            </ul>
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              We retain this data only as long as necessary for these purposes and in accordance with our Privacy Policy.
            </p>
          </section>

          <section className="pt-6 border-t border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold mb-4">Need Help?</h2>
            <p>
              If you have any questions about account deletion or need assistance, please contact our support team at{' '}
              <a href="mailto:hello@compassmeet.com" className="text-blue-600 dark:text-blue-400 hover:underline">
                hello@compassmeet.com
              </a>.
            </p>
          </section>
        </div>
      </div>
    </PageBase>
  );
}
