import {PageBase} from "web/components/page-base";
import {supportEmail} from "common/constants";
import {SEO} from "web/components/SEO";


// TODO: convert to MarkDown for better readability during modifications?
export default function TermsPage() {
  return (
    <PageBase
      trackPageView={'terms'}
      className="max-w-4xl mx-auto p-8 text-gray-800 dark:text-white col-span-8 bg-canvas-0"
    >
      <SEO
        title={'Terms & Conditions'}
        description={'Terms & Conditions for Compass'}
        url={`/terms`}
      />
      <h1 className="text-3xl font-semibold text-center mb-6">Terms & Conditions</h1>

      <p className="text-center text-gray-500 dark:text-white mb-12">
        Effective Date: January 1, 2025
      </p>

      <section className="space-y-6 text-base leading-relaxed">
        <p>
          Welcome to <span className="font-semibold">Compass</span>, a platform to connect, collaborate, and build
          meaningful interactions. By accessing or using our service, you agree to the following Terms and Conditions.
        </p>

        <h2 className="text-xl font-semibold">1. Eligibility</h2>
        <p>
          You must be at least 15 years old to create an account and use Compass.
          By registering, you confirm that you meet this requirement.
        </p>

        <h2 className="text-xl font-semibold">2. User Responsibilities</h2>
        <p>
          Users must engage with others respectfully, avoid spamming, and refrain from
          any behavior that disrupts the community or violates applicable laws.
        </p>

        <h2 className="text-xl font-semibold">3. Intellectual Property & Licensing</h2>
        <p>
          a. <strong>Ownership and License.</strong> Compass is developed and maintained as a free and open-source
          project. Unless otherwise stated, all source code, designs, and related materials (“Project Materials”) are
          licensed under the AGPL-3.0 License. Certain components may be licensed under permissive open-source licenses,
          as explicitly indicated. Subject to the applicable license terms, you are granted a worldwide, royalty-free,
          non-exclusive, irrevocable license to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
          copies of the Project Materials in accordance with the terms of the applicable license.
        </p>
        <p>
          b. <strong>Community Governance.</strong> Compass operates under a{" "}
          <strong>community-driven governance model</strong>. Any material changes
          to licensing, monetization (including advertisements), or governance
          structures shall require approval through the governance process defined by
          the Compass community. All governance decisions will be made publicly
          available.
        </p>
        <p>
          c. <strong>Contributions.</strong> By submitting code, designs,
          documentation, or other contributions (“Contributions”) to Compass, you
          agree that such Contributions will be licensed under the same open-source
          license governing the Project Materials at the time of contribution. You
          represent and warrant that you have the right to grant such a license and
          that your Contributions do not infringe on the rights of any third party.
        </p>
        {/*<p>*/}
        {/*  d. <strong>Trademarks and Branding.</strong> The name “Compass,” logos,*/}
        {/*  and associated marks (“Marks”) are the exclusive property of the Compass*/}
        {/*  community or its designated steward. Use of the Marks is only permitted as*/}
        {/*  authorized in writing by the Compass governance body to avoid confusion*/}
        {/*  or misuse.*/}
        {/*</p>*/}
        <p>
          d. <strong>No Proprietary Restrictions.</strong> Compass shall remain{" "}
          <strong>free of advertising, proprietary lock-ins, and data monetization</strong>{" "}
          unless explicitly approved by the community in accordance with its
          governance process. Users and contributors must not introduce such
          restrictions without prior community approval.
        </p>

        <h2 className="text-xl font-semibold">4. Community Standards & Safety</h2>
        <p>
          a. <strong>Nudity and Sexual Content.</strong> Compass does <strong>not permit public sharing of nudity or
          sexually explicit content</strong>. Any content that includes nudity, sexual acts, or sexually suggestive
          material will be removed and may lead to suspension or termination of accounts involved.
        </p>
        <p>
          b. <strong>Child Sexual Abuse and Exploitation (CSAE).</strong> Compass maintains a <strong>zero-tolerance
          policy</strong> toward any form of child sexual abuse or exploitation (“CSAE”). CSAE refers to content or
          behavior that sexually exploits, abuses, or endangers children — including but not limited to grooming a child
          for sexual exploitation, sextortion, trafficking of a child for sex, or otherwise sexually exploiting a child.
          Any suspected CSAE will result in <strong>immediate account termination</strong> and may be reported
          to <strong>law enforcement and the National Center for Missing and Exploited Children (NCMEC)</strong> as
          required by law.
        </p>
        <p>
          c. <strong>Violence and Harmful Content.</strong> Compass does <strong>not allow the sharing of real-world,
          graphic violence</strong> outside of a newsworthy, contextual, or educational purpose. Content that promotes
          or glorifies violence will be removed.
        </p>
        <p>
          d. <strong>Location Sharing.</strong> Compass does <strong>not share users’ precise physical location with
          other users</strong> without explicit consent. Any optional location-based features will clearly disclose how
          location data is used and shared.
        </p>
        <p>
          e. <strong>Digital Goods and Transactions.</strong> Compass is a <strong>completely free platform</strong>. It
          does <strong>not sell digital goods, offer in-app purchases, or charge for access to features</strong>. All
          functionality is available without payment.
        </p>
        <p>
          f. <strong>User Safety Controls.</strong> Compass includes built-in features that allow users to:
          <ul className="list-disc list-inside mt-2">
            <li>Block other users or specific user-generated content.</li>
            <li>Report users or content that violates community standards.</li>
            <li>Benefit from active chat moderation to ensure a safe and respectful environment.</li>
            <li>Limit interactions to invited friends only, where supported by the app’s features.</li>
          </ul>
        </p>

        <h2 className="text-xl font-semibold">5. Liability</h2>
        <p>
          Compass is not responsible for disputes between users or for damages arising
          from the use of the platform. Use the platform at your own discretion.
        </p>

        <h2 className="text-xl font-semibold">6. Changes</h2>
        <p>
          We may update these Terms periodically. Continued use of Compass after updates
          constitutes acceptance of the new Terms.
        </p>

        <p className="italic mt-8">
          For questions regarding these Terms, please contact us at {supportEmail}.
        </p>
      </section>
    </PageBase>
  );
}
