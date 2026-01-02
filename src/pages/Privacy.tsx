import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Privacy = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-6 border-b border-border/50">
        <Link to="/">
          <Logo />
        </Link>
        <div className="flex items-center gap-4">
          {user ? (
            <Link to="/dashboard">
              <Button variant="hero" size="sm">Dashboard</Button>
            </Link>
          ) : (
            <>
              <Link to="/auth">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
              <Link to="/auth">
                <Button variant="hero" size="sm">Get Started</Button>
              </Link>
            </>
          )}
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="font-serif text-4xl font-bold mb-8">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: January 2025</p>

        <div className="space-y-8 text-muted-foreground">
          <section>
            <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">Our Commitment to Your Privacy</h2>
            <p>
              At Chrona, your privacy is fundamental to everything we build. Your career journal contains deeply personal professional reflections, and we treat that data with the utmost care and respect.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">Information We Collect</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-foreground">Account Information:</strong> Email address and password for authentication.</li>
              <li><strong className="text-foreground">Journal Content:</strong> Your daily entries, weekly reflections, quarterly patterns, and any uploaded images.</li>
              <li><strong className="text-foreground">Usage Analytics:</strong> Basic analytics to improve the product (page views, feature usage).</li>
              <li><strong className="text-foreground">Payment Information:</strong> Processed securely through Stripe; we never store your card details.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">How We Protect Your Data</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>All journal content is encrypted at rest and in transit.</li>
              <li>We use industry-standard security practices and infrastructure.</li>
              <li>Access to user data is strictly limited to essential operations.</li>
              <li>Regular security audits and updates.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">AI Processing Transparency</h2>
            <p className="mb-4">
              Chrona uses AI to help identify patterns in your work and generate career artifacts. Here's what you should know:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Your data is <strong className="text-foreground">never used to train AI models</strong>.</li>
              <li>AI processing happens securely and your content is not shared with third parties.</li>
              <li>You maintain full ownership of all content you create and any AI-generated artifacts.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">Data Ownership</h2>
            <p>
              You own all of your data. You can export your journal entries at any time, and if you delete your account, we permanently remove all your data from our systems.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">Third-Party Sharing</h2>
            <p>
              We do not sell, rent, or share your personal data with third parties for marketing purposes. The only third-party services we use are essential for operations (authentication, payment processing, hosting).
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">Contact Us</h2>
            <p>
              If you have questions about this privacy policy or your data, please contact us at{" "}
              <a href="mailto:cirestudios.dev@gmail.com" className="text-primary hover:underline">
                cirestudios.dev@gmail.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
