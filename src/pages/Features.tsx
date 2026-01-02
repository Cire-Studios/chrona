import { 
  PenLine, 
  Sparkles, 
  Layers, 
  FileText, 
  TrendingUp, 
  Image, 
  Link as LinkIcon,
  Brain,
  Shield,
  Clock,
  Crown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { Footer } from "@/components/Footer";

const Features = () => {
  const { user } = useAuth();

  const features = [
    {
      icon: PenLine,
      title: "Daily Journaling",
      description: "Capture accomplishments, challenges, decisions, and learnings every day. Build a rich record of your professional journey.",
    },
    {
      icon: Sparkles,
      title: "Weekly Reflections",
      description: "Review your week's entries and tag key moments with signal flags: Delivery, Ownership, Influence, and Learning.",
    },
    {
      icon: Layers,
      title: "Quarterly Distillation",
      description: "AI-powered pattern recognition surfaces themes across months of work, revealing growth trajectories and impact areas.",
    },
    {
      icon: FileText,
      title: "AI Artifacts",
      description: "Transform your experiences into polished narratives, resume bullets, and performance review content with one click.",
    },
    {
      icon: Crown,
      title: "Verified Resume Builder",
      description: "Generate professional resumes backed by proof. Share a public link so employers can see the evidence behind your achievements.",
      chroniclerOnly: true,
    },
    {
      icon: TrendingUp,
      title: "Career Timeline",
      description: "Visualize your entire career journey across roles, seeing patterns and growth over time.",
    },
    {
      icon: Image,
      title: "Proof of Work",
      description: "Attach images and links to entries as evidence of your achievements—screenshots, metrics, and more.",
    },
    {
      icon: LinkIcon,
      title: "Role Management",
      description: "Track multiple roles simultaneously. Perfect for career transitions, side projects, or portfolio careers.",
    },
    {
      icon: Brain,
      title: "Pattern Recognition",
      description: "Our AI identifies recurring themes in your work—leadership moments, skill development, and scope expansion.",
    },
    {
      icon: Shield,
      title: "Private & Secure",
      description: "Your career data is encrypted and private. Only you have access to your journal and insights.",
    },
    {
      icon: Clock,
      title: "Smart Reminders",
      description: "Customizable notifications keep you consistent with daily, weekly, and quarterly prompts.",
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicHeader />

      <div className="flex-1 max-w-6xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">
            Everything you need to <span className="text-gradient">own your narrative</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Chrona gives you the tools to capture, reflect, and articulate your professional story.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={feature.title} 
                className="bg-gradient-card border-border/50 hover:border-primary/30 transition-all group relative"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {(feature as any).chroniclerOnly && (
                  <div className="absolute top-3 right-3">
                    <Badge variant="default" className="text-xs">
                      <Crown className="h-3 w-3 mr-1" />
                      Chronicler
                    </Badge>
                  </div>
                )}
                <CardHeader>
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="font-serif text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-muted-foreground">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <Link to={user ? "/dashboard" : "/auth"}>
            <Button variant="hero" size="xl">
              {user ? "Go to Dashboard" : "Start Your Journey"}
            </Button>
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Features;
