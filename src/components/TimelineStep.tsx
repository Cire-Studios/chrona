import { cn } from "@/lib/utils";

interface TimelineStepProps {
  step: number;
  title: string;
  description: string;
  frequency: string;
  isActive?: boolean;
}

export const TimelineStep = ({ step, title, description, frequency, isActive = false }: TimelineStepProps) => {
  return (
    <div className="flex gap-4 group">
      <div className="flex flex-col items-center">
        <div 
          className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center font-serif text-lg font-semibold",
            "border-2 transition-all duration-300",
            isActive 
              ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/30" 
              : "bg-secondary border-border text-muted-foreground group-hover:border-primary/50"
          )}
        >
          {step}
        </div>
        <div className="w-0.5 h-full bg-border group-last:hidden mt-2" />
      </div>
      
      <div className="pb-8">
        <span className="text-xs uppercase tracking-wider text-primary font-medium">
          {frequency}
        </span>
        <h3 className="font-serif text-xl font-semibold mt-1 mb-2">
          {title}
        </h3>
        <p className="text-muted-foreground text-sm leading-relaxed max-w-md">
          {description}
        </p>
      </div>
    </div>
  );
};
