import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export const PublicHeader = () => {
  const { user } = useAuth();

  return (
    <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-6 border-b border-border/50">
      <Link to="/">
        <Logo />
      </Link>
      <div className="hidden md:flex items-center gap-6 text-sm">
        <Link to="/features" className="text-muted-foreground hover:text-foreground transition-colors">
          Features
        </Link>
        <Link to="/how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
          How It Works
        </Link>
        <Link to="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">
          Pricing
        </Link>
      </div>
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
  );
};
