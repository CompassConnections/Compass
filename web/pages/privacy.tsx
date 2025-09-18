import {LovePage} from "web/components/love-page";
import {supportEmail} from "common/constants";

// TODO: convert to MarkDown for better readability during modifications?
export default function PrivacyPage() {
  return (
    <LovePage
      trackPageView={'terms'}
      className="max-w-4xl mx-auto p-8 col-span-8 bg-canvas-0"
    >
      <h1 className="text-3xl font-semibold text-center mb-6">Privacy Policy</h1>

      <p className="text-center mb-12">
        Effective Date: January 1, 2025
      </p>

      <section className="space-y-6 text-base leading-relaxed">
        <p>
          At <span className="font-semibold">Compass</span>, we value transparency
          and respect for your data. This Privacy Policy explains how we handle your information.
        </p>

        <h2 className="text-xl font-semibold">1. Information We Collect</h2>
        <p>
          We collect basic account details such as your name, email, and profile data.
          Additionally, we may collect usage data to improve platform functionality.
        </p>

        <h2 className="text-xl font-semibold">2. How We Use Your Data</h2>
        <p>
          Your data is used solely to operate, personalize, and improve the platform.
          We do not sell your personal information to third parties.
        </p>

        <h2 className="text-xl font-semibold">3. Data Storage & Security</h2>
        <p>
          We use modern encryption and security practices to protect your data.
          However, no online system is completely secure, so use the platform responsibly.
        </p>

        <h2 className="text-xl font-semibold">4. Third-Party Services</h2>
        <p>
          Compass may integrate with third-party tools (e.g., Google Sign-In).
          These services have their own privacy policies that we encourage you to review.
        </p>

        <h2 className="text-xl font-semibold">5. Your Rights</h2>
        <p>
          You can request deletion of your account and data at any time by contacting {supportEmail}.
        </p>

        <p className="italic mt-8">
          For questions about this Privacy Policy, reach out at {supportEmail}.
        </p>
      </section>
    </LovePage>
  );
}
