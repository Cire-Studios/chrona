import { Link } from "react-router-dom";
import { Logo } from "./Logo";

export const Footer = () => {
  return (
    <footer className="border-t border-border py-12 px-6 md:px-12">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <Logo size="sm" />
          
          <nav className="flex items-center gap-8 text-sm text-muted-foreground">
            <Link to="/about" className="hover:text-foreground transition-colors">About</Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link to="/contact" className="hover:text-foreground transition-colors">Contact</Link>
          </nav>
          
          <p className="text-sm text-muted-foreground">
            © 2025 Chrona. A{" "}
            <a 
              href="https://www.cirestudios.dev/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              Cire Studios
            </a>
            {" "}project.
          </p>
        </div>
      </div>
    </footer>
  );
};
