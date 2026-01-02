import { PublicHeader } from "@/components/layout/PublicHeader";
import { Footer } from "@/components/Footer";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicHeader />

      <div className="flex-1 max-w-3xl mx-auto px-6 py-16">
        <h1 className="font-serif text-4xl font-bold mb-8">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">Last updated: January 2025</p>

        <div className="space-y-8 text-muted-foreground">
          <section>
            <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">Agreement to Terms</h2>
            <p>
              By accessing or using Chrona, you agree to be bound by these Terms of Service. Chrona is operated by Cire Studios. If you do not agree to these terms, please do not use our service.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">Description of Service</h2>
            <p>
              Chrona is a private career journaling platform that helps you capture daily work experiences, reflect on patterns, and generate career narratives using AI assistance. We provide both free (Starter) and paid (Chronicler) tiers with different feature sets.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">Your Account</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>You must provide accurate information when creating an account.</li>
              <li>You are responsible for maintaining the security of your account credentials.</li>
              <li>You must notify us immediately of any unauthorized access to your account.</li>
              <li>You must be at least 18 years old to use this service.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">Your Content</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>You retain full ownership of all content you create in Chrona.</li>
              <li>You grant us a limited license to store and process your content solely to provide the service.</li>
              <li>You are responsible for ensuring your content does not violate any laws or third-party rights.</li>
              <li>AI-generated artifacts based on your content belong to you.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">Subscriptions and Payments</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Chronicler subscriptions are billed monthly or annually as selected.</li>
              <li>You may cancel your subscription at any time; access continues until the end of your billing period.</li>
              <li>Refunds are handled on a case-by-case basis; contact us for assistance.</li>
              <li>We reserve the right to modify pricing with 30 days notice.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">Acceptable Use</h2>
            <p className="mb-4">You agree not to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Use the service for any illegal purpose.</li>
              <li>Attempt to gain unauthorized access to our systems.</li>
              <li>Interfere with or disrupt the service.</li>
              <li>Use automated tools to access the service without permission.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">Limitation of Liability</h2>
            <p>
              Chrona is provided "as is" without warranties of any kind. We are not liable for any indirect, incidental, or consequential damages arising from your use of the service. Our total liability is limited to the amount you paid us in the past 12 months.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">Changes to Terms</h2>
            <p>
              We may update these terms from time to time. We will notify you of significant changes via email or in-app notification. Continued use after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">Contact</h2>
            <p>
              For questions about these terms, contact us at{" "}
              <a href="mailto:cirestudios.dev@gmail.com" className="text-primary hover:underline">
                cirestudios.dev@gmail.com
              </a>
            </p>
          </section>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Terms;
