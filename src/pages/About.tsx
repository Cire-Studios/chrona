import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowRight } from "lucide-react";

const About = () => {
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
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">
            About <span className="text-gradient">Chrona</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            The story behind the career journal
          </p>
        </div>

        {/* Story */}
        <div className="prose prose-invert prose-lg max-w-none">
          <div className="space-y-6 text-muted-foreground leading-relaxed">
            <p>
              I built Chrona after repeatedly struggling to explain my own work in ways that felt accurate and honest. Each time I updated my resume, I found myself trying to reconstruct months or years of effort into a few static bullet points—often relying on memory rather than evidence.
            </p>
            
            <p>
              Git logs, tickets, and documents captured <em>what</em> I worked on, but rarely <em>why</em> decisions were made, how problems were solved, or what changed because of the work. In many cases, the most meaningful contributions were locked away in systems I no longer had access to, leaving gaps I couldn't fill later.
            </p>

            <p>
              Over time, it became clear that the resume itself hasn't evolved with how work actually happens. Our careers are dynamic, collaborative, and iterative, yet we're still expected to summarize them retroactively in formats that flatten nuance and erase intent.
            </p>

            <p className="text-foreground font-medium">
              Chrona exists to solve that problem—to help capture work as it happens, preserve context while it's still fresh, and gradually distill that record into clear, defensible narratives that reflect real growth and impact.
            </p>
          </div>
        </div>

        {/* Cire Studios */}
        <div className="mt-16 pt-8 border-t border-border/50">
          <p className="text-muted-foreground text-center">
            Chrona is a project of{" "}
            <a 
              href="https://www.cirestudios.dev/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Cire Studios
            </a>
          </p>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Link to={user ? "/journal" : "/auth"}>
            <Button variant="hero" size="xl">
              {user ? "Start Journaling" : "Try Chrona Free"}
              <ArrowRight size={20} />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default About;
