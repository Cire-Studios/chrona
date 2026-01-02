import { FeatureCard } from "./FeatureCard";
import { 
  PenLine, 
  Brain, 
  FileText, 
  Lock, 
  Zap, 
  LineChart 
} from "lucide-react";

const features = [
  {
    icon: PenLine,
    title: "Frictionless Capture",
    description: "Quick-entry interface designed for busy days. Log in seconds with smart prompts that adapt to your work patterns."
  },
  {
    icon: Brain,
    title: "AI-Powered Synthesis",
    description: "Advanced language models identify themes, extract achievements, and surface patterns you might miss."
  },
  {
    icon: FileText,
    title: "Artifact Generation",
    description: "Transform your journal into resume bullets, performance review talking points, and interview STAR stories."
  },
  {
    icon: Lock,
    title: "Private by Design",
    description: "Your career journal is yours alone. End-to-end encryption ensures your reflections stay confidential."
  },
  {
    icon: Zap,
    title: "Smart Reminders",
    description: "Gentle nudges at the right moments keep you consistent without feeling like a chore."
  },
  {
    icon: LineChart,
    title: "Growth Insights",
    description: "Visualize your career trajectory over time. See how your skills, responsibilities, and impact evolve."
  }
];

export const FeaturesSection = () => {
  return (
    <section className="py-24 px-6 md:px-12 bg-gradient-card">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-serif text-4xl md:text-5xl font-bold mb-4">
            Everything you need to
            <br />
            <span className="text-gradient">own your narrative</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Purpose-built tools for professionals who want their career story 
            grounded in truth, not reconstructed from fading memories.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <FeatureCard 
              key={feature.title} 
              {...feature} 
              delay={index * 100}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
