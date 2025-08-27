import {supportEmail} from "@/lib/client/constants";

export default function TermsPage() {
  return (
    <main className="max-w-4xl mx-auto p-8 text-gray-800 dark:text-white">
      <h1 className="text-3xl font-semibold text-center mb-6">Terms & Conditions</h1>

      <p className="text-center text-gray-500 dark:text-white mb-12">
        Effective Date: January 1, 2025
      </p>

      <section className="space-y-6 text-base leading-relaxed">
        <p>
          Welcome to <span className="font-semibold">Compass</span>, a platform designed for
          rational thinkers to connect, collaborate, and build meaningful interactions.
          By accessing or using our service, you agree to the following Terms and Conditions.
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
          a. <strong>Ownership and License.</strong> Compass is developed and
          maintained as a <strong>free and open-source project</strong>. Unless
          otherwise stated, all source code, designs, and related materials
          (“Project Materials”) are licensed under the{" "}
          <strong>MIT License</strong> or another permissive open-source license
          determined by the community. Subject to the applicable license terms, you
          are granted a worldwide, royalty-free, non-exclusive, irrevocable license
          to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
          copies of the Project Materials.
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
        <p>
          d. <strong>Trademarks and Branding.</strong> The name “Compass,” logos,
          and associated marks (“Marks”) are the exclusive property of the Compass
          community or its designated steward. Use of the Marks is only permitted as
          authorized in writing by the Compass governance body to avoid confusion
          or misuse.
        </p>
        <p>
          e. <strong>No Proprietary Restrictions.</strong> Compass shall remain{" "}
          <strong>free of advertising, proprietary lock-ins, and data monetization</strong>{" "}
          unless explicitly approved by the community in accordance with its
          governance process. Users and contributors must not introduce such
          restrictions without prior community approval.
        </p>

        <h2 className="text-xl font-semibold">4. Liability</h2>
        <p>
          Compass is not responsible for disputes between users or for damages arising
          from the use of the platform. Use the platform at your own discretion.
        </p>

        <h2 className="text-xl font-semibold">5. Changes</h2>
        <p>
          We may update these Terms periodically. Continued use of Compass after updates
          constitutes acceptance of the new Terms.
        </p>

        <p className="text-gray-600 italic mt-8">
          For questions regarding these Terms, please contact us at {supportEmail}.
        </p>
      </section>
    </main>
  );
}
