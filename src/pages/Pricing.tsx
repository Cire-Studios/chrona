import { Check, Sparkles, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { Footer } from "@/components/Footer";

const Pricing = () => {
  const { user } = useAuth();
  const { tier, openCheckout, loading } = useSubscription();
  const navigate = useNavigate();

  const handleUpgrade = (interval: "month" | "year") => {
    if (!user) {
      // Redirect to auth page if not logged in
      navigate("/auth");
      return;
    }
    openCheckout(interval);
  };
  const plans = [
    {
      name: "Starter",
      description: "Perfect for trying out Chrona",
      price: "Free",
      period: "forever",
      features: [
        "1 role to track",
        "3 AI artifact generations",
        "Daily journaling",
        "Weekly reflections",
        "Quarterly distillations",
        "Timeline view",
      ],
      limitations: [
        "No image uploads",
        "Limited artifact generations",
      ],
      cta: "Get Started",
      variant: "outline" as const,
      current: tier === "starter",
    },
    {
      name: "Chronicler",
      description: "For professionals serious about career growth",
      price: "$7",
      period: "per month",
      yearlyPrice: "$72/year (save 14%)",
      features: [
        "Unlimited roles",
        "50 AI artifact generations/month",
        "Image uploads for proof of work",
        "Verified Resume Builder with public sharing",
        "Everything in Starter",
        "Priority support",
      ],
      limitations: [],
      cta: "Upgrade Now",
      variant: "default" as const,
      current: tier === "chronicler",
      highlighted: true,
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicHeader />

      <div className="flex-1 max-w-5xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">
            Simple, <span className="text-gradient">transparent</span> pricing
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Start free, upgrade when you're ready. No hidden fees, cancel anytime.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={cn(
                "relative overflow-hidden transition-all",
                plan.highlighted && "border-primary/50 shadow-glow"
              )}
            >
              {plan.highlighted && (
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-medium rounded-bl-lg">
                  Most Popular
                </div>
              )}
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  {plan.name === "Chronicler" ? (
                    <Crown className="h-5 w-5 text-primary" />
                  ) : (
                    <Sparkles className="h-5 w-5 text-muted-foreground" />
                  )}
                  <CardTitle className="font-serif text-2xl">{plan.name}</CardTitle>
                </div>
                <CardDescription>{plan.description}</CardDescription>
                <div className="pt-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground ml-2">/{plan.period}</span>
                  {plan.yearlyPrice && (
                    <p className="text-sm text-primary mt-1">{plan.yearlyPrice}</p>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                  {plan.limitations.map((limitation) => (
                    <li key={limitation} className="flex items-center gap-3 text-muted-foreground">
                      <span className="h-4 w-4 flex-shrink-0 text-center">—</span>
                      <span className="text-sm">{limitation}</span>
                    </li>
                  ))}
                </ul>

                {plan.current ? (
                  <Button variant="outline" className="w-full" disabled>
                    Current Plan
                  </Button>
                ) : plan.name === "Starter" ? (
                  <Link to={user ? "/dashboard" : "/auth"} className="block">
                    <Button variant="outline" className="w-full">
                      {plan.cta}
                    </Button>
                  </Link>
                ) : (
                  <div className="space-y-2">
                    <Button
                      variant="hero"
                      className="w-full"
                      onClick={() => handleUpgrade("month")}
                      disabled={loading}
                    >
                      {plan.cta} — Monthly
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => handleUpgrade("year")}
                      disabled={loading}
                    >
                      {plan.cta} — Yearly (Save 17%)
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ or additional info */}
        <div className="text-center mt-16 text-muted-foreground">
          <p>Questions? <a href="https://cire-studios.moxieapp.com/public/new-form" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Contact us</a></p>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Pricing;
