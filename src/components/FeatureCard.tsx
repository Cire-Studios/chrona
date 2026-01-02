import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  delay?: number;
}

export const FeatureCard = ({ icon: Icon, title, description, delay = 0 }: FeatureCardProps) => {
  return (
    <div 
      className={cn(
        "group relative p-6 rounded-2xl bg-gradient-card border border-border/50",
        "hover:border-primary/30 transition-all duration-500",
        "hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1",
        "opacity-0 animate-fade-up"
      )}
      style={{ animationDelay: `${delay}ms`, animationFillMode: "forwards" }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />
      
      <div className="relative">
        <div className="inline-flex p-3 rounded-xl bg-secondary/50 text-primary mb-4 group-hover:bg-primary/10 transition-colors duration-300">
          <Icon size={24} strokeWidth={1.5} />
        </div>
        
        <h3 className="font-serif text-xl font-semibold mb-2 text-foreground">
          {title}
        </h3>
        
        <p className="text-muted-foreground text-sm leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
};
