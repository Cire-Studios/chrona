import { cn } from "@/lib/utils";
import { Zap, Shield, Users, BookOpen } from "lucide-react";

export type SignalFlag = "delivery" | "ownership" | "influence" | "learning";

interface SignalFlagBadgeProps {
  flag: SignalFlag;
  selected?: boolean;
  onClick?: () => void;
  size?: "sm" | "md";
}

const flagConfig: Record<SignalFlag, { label: string; icon: typeof Zap; color: string }> = {
  delivery: {
    label: "Delivery",
    icon: Zap,
    color: "38 92% 60%", // Gold
  },
  ownership: {
    label: "Ownership",
    icon: Shield,
    color: "160 60% 45%", // Sage green
  },
  influence: {
    label: "Influence",
    icon: Users,
    color: "280 60% 60%", // Purple
  },
  learning: {
    label: "Learning",
    icon: BookOpen,
    color: "200 80% 55%", // Blue
  },
};

export const SignalFlagBadge = ({ flag, selected, onClick, size = "md" }: SignalFlagBadgeProps) => {
  const config = flagConfig[flag];
  const Icon = config.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border transition-all duration-200",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1.5 text-sm",
        selected
          ? "border-transparent text-primary-foreground"
          : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground",
        onClick && "cursor-pointer"
      )}
      style={
        selected
          ? { backgroundColor: `hsl(${config.color})` }
          : undefined
      }
      disabled={!onClick}
    >
      <Icon size={size === "sm" ? 12 : 14} />
      <span className="font-medium">{config.label}</span>
    </button>
  );
};

export const getFlagColor = (flag: SignalFlag) => `hsl(${flagConfig[flag].color})`;
