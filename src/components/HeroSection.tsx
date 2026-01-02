import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import { Logo } from "./Logo";

export const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex flex-col">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-hero" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: "2s" }} />
      
      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-6">
        <Logo />
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm">Sign In</Button>
          <Button variant="hero" size="sm">Get Started</Button>
        </div>
      </nav>

      {/* Hero content */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-6">
        <div className="max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-border/50 text-sm text-muted-foreground mb-8 animate-fade-up">
            <Sparkles size={14} className="text-primary" />
            <span>AI-Powered Career Intelligence</span>
          </div>
          
          <h1 className="font-serif text-5xl md:text-7xl font-bold leading-tight mb-6 opacity-0 animate-fade-up" style={{ animationDelay: "100ms", animationFillMode: "forwards" }}>
            Your career story,
            <br />
            <span className="text-gradient">written as it happens</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 opacity-0 animate-fade-up" style={{ animationDelay: "200ms", animationFillMode: "forwards" }}>
            Capture your work daily. Reflect weekly. Distill quarterly. 
            Let AI transform your experiences into compelling career narratives.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 opacity-0 animate-fade-up" style={{ animationDelay: "300ms", animationFillMode: "forwards" }}>
            <Button variant="hero" size="xl">
              Start Journaling
              <ArrowRight size={20} />
            </Button>
            <Button variant="hero-secondary" size="xl">
              See How It Works
            </Button>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="relative z-10 flex justify-center pb-8">
        <div className="w-6 h-10 rounded-full border-2 border-border flex justify-center pt-2">
          <div className="w-1.5 h-3 rounded-full bg-primary animate-bounce" />
        </div>
      </div>
    </section>
  );
};
