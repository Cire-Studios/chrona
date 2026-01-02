import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ExternalLink, Mail } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Contact = () => {
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

      <div className="max-w-2xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">
            Get in <span className="text-gradient">Touch</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Have questions, feedback, or need support? We'd love to hear from you.
          </p>
        </div>

        {/* Contact Options */}
        <div className="space-y-6">
          <Card className="bg-gradient-card border-border/50">
            <CardHeader>
              <CardTitle className="font-serif text-xl flex items-center gap-2">
                <ExternalLink className="h-5 w-5 text-primary" />
                Contact Form
              </CardTitle>
              <CardDescription>
                The fastest way to reach us for support, feedback, or inquiries.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <a
                href="https://cire-studios.moxieapp.com/public/new-form"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="hero" className="w-full">
                  Open Contact Form
                  <ExternalLink size={16} />
                </Button>
              </a>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-border/50">
            <CardHeader>
              <CardTitle className="font-serif text-xl flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Email Us
              </CardTitle>
              <CardDescription>
                Prefer email? Reach out directly and we'll get back to you within 24-48 hours.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <a href="mailto:cirestudios.dev@gmail.com">
                <Button variant="outline" className="w-full">
                  cirestudios.dev@gmail.com
                </Button>
              </a>
            </CardContent>
          </Card>
        </div>

        {/* Cire Studios */}
        <div className="mt-12 text-center">
          <p className="text-muted-foreground">
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
      </div>
    </div>
  );
};

export default Contact;
