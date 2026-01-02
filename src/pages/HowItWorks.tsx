import { ArrowRight, PenLine, Sparkles, Layers, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const HowItWorks = () => {
  const { user } = useAuth();

  const steps = [
    {
      number: "01",
      icon: PenLine,
      title: "Journal Daily",
      subtitle: "5 minutes a day",
      description: "At the end of each workday, spend just 5 minutes capturing what you accomplished, challenges you faced, decisions you made, and what you learned. These micro-entries become the foundation of your career story.",
      color: "text-primary",
    },
    {
      number: "02",
      icon: Sparkles,
      title: "Reflect Weekly",
      subtitle: "15 minutes a week",
      description: "Each week, review your daily entries and tag the moments that matter. Was it a Delivery win? Did you show Ownership? Influence others? Learn something new? These signal flags help surface patterns later.",
      color: "text-chrona-sage",
    },
    {
      number: "03",
      icon: Layers,
      title: "Distill Quarterly",
      subtitle: "30 minutes a quarter",
      description: "Every quarter, our AI analyzes your tagged signals and surfaces patterns: sustained impact, scope expansion, leadership moments, and skill development. Confirm or adjust these insights to refine your narrative.",
      color: "text-blue-400",
    },
    {
      number: "04",
      icon: FileText,
      title: "Generate Artifacts",
      subtitle: "On demand",
      description: "When you need to articulate your value—for a performance review, resume update, or interview prep—generate polished artifacts from your actual experiences. No more blank page syndrome.",
      color: "text-purple-400",
    },
  ];

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

      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-20">
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">
            How <span className="text-gradient">Chrona</span> works
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A simple rhythm that transforms scattered experiences into a compelling career narrative.
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-16">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isEven = index % 2 === 0;
            
            return (
              <div 
                key={step.number}
                className={`flex flex-col md:flex-row gap-8 items-center ${isEven ? '' : 'md:flex-row-reverse'}`}
              >
                {/* Icon/Number */}
                <div className="flex-shrink-0 relative">
                  <div className="w-24 h-24 rounded-2xl bg-gradient-card border border-border/50 flex items-center justify-center">
                    <Icon className={`h-10 w-10 ${step.color}`} />
                  </div>
                  <span className="absolute -top-3 -left-3 text-5xl font-serif font-bold text-muted/20">
                    {step.number}
                  </span>
                </div>

                {/* Content */}
                <div className={`flex-1 ${isEven ? 'md:text-left' : 'md:text-right'} text-center`}>
                  <span className="text-sm text-muted-foreground uppercase tracking-wider">
                    {step.subtitle}
                  </span>
                  <h2 className="font-serif text-2xl md:text-3xl font-bold mt-2 mb-4">
                    {step.title}
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Connecting line visual */}
        <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-border to-transparent" />

        {/* CTA */}
        <div className="text-center mt-20 pt-10 border-t border-border/50">
          <h3 className="font-serif text-2xl font-bold mb-4">
            Ready to start your journey?
          </h3>
          <p className="text-muted-foreground mb-8">
            Join professionals who are taking control of their career narrative.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to={user ? "/journal" : "/auth"}>
              <Button variant="hero" size="xl">
                {user ? "Start Journaling" : "Get Started Free"}
                <ArrowRight size={20} />
              </Button>
            </Link>
            <Link to="/pricing">
              <Button variant="outline" size="xl">
                View Pricing
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;
