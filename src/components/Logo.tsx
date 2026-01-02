import { Clock } from "lucide-react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
}

export const Logo = ({ size = "md" }: LogoProps) => {
  const sizes = {
    sm: { icon: 20, text: "text-lg" },
    md: { icon: 28, text: "text-2xl" },
    lg: { icon: 36, text: "text-3xl" },
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <Clock 
          size={sizes[size].icon} 
          className="text-primary animate-pulse-slow" 
          strokeWidth={1.5}
        />
        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
      </div>
      <span className={`font-serif font-semibold tracking-tight ${sizes[size].text}`}>
        Chrona
      </span>
    </div>
  );
};
