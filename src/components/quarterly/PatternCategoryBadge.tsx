import { cn } from "@/lib/utils";
import { TrendingUp, Expand, Target, BookOpen, Users, Handshake } from "lucide-react";

export type PatternCategory = "growth" | "scope_change" | "sustained_impact" | "skill_development" | "leadership" | "collaboration";

interface PatternCategoryBadgeProps {
  category: PatternCategory;
  size?: "sm" | "md";
}

const categoryConfig: Record<PatternCategory, { label: string; icon: typeof TrendingUp; color: string }> = {
  growth: {
    label: "Growth",
    icon: TrendingUp,
    color: "160 60% 45%",
  },
  scope_change: {
    label: "Scope Change",
    icon: Expand,
    color: "280 60% 60%",
  },
  sustained_impact: {
    label: "Sustained Impact",
    icon: Target,
    color: "38 92% 60%",
  },
  skill_development: {
    label: "Skill Development",
    icon: BookOpen,
    color: "200 80% 55%",
  },
  leadership: {
    label: "Leadership",
    icon: Users,
    color: "0 70% 60%",
  },
  collaboration: {
    label: "Collaboration",
    icon: Handshake,
    color: "320 70% 60%",
  },
};

export const PatternCategoryBadge = ({ category, size = "md" }: PatternCategoryBadgeProps) => {
  const config = categoryConfig[category];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full text-primary-foreground",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"
      )}
      style={{ backgroundColor: `hsl(${config.color})` }}
    >
      <Icon size={size === "sm" ? 12 : 14} />
      <span className="font-medium">{config.label}</span>
    </span>
  );
};

export const getCategoryColor = (category: PatternCategory) => `hsl(${categoryConfig[category].color})`;
