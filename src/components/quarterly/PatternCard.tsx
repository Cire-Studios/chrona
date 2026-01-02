import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PatternCategoryBadge, PatternCategory } from "./PatternCategoryBadge";
import { Check, X, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface Evidence {
  id: string;
  signal_flag: string;
  context: string | null;
  entry_date: string;
}

interface PatternCardProps {
  id: string;
  category: PatternCategory;
  title: string;
  description: string;
  signalCount: number;
  isConfirmed: boolean;
  evidence: Evidence[];
  onConfirm: () => void;
  onReject: () => void;
  isNew?: boolean;
  disabled?: boolean;
}

export const PatternCard = ({
  category,
  title,
  description,
  signalCount,
  isConfirmed,
  evidence,
  onConfirm,
  onReject,
  isNew,
  disabled = false,
}: PatternCardProps) => {
  const [showEvidence, setShowEvidence] = useState(false);

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all duration-300",
        isConfirmed
          ? "border-primary/50 bg-card shadow-glow"
          : "border-border/30 bg-secondary/20",
        isNew && "animate-fade-up"
      )}
    >
      {/* Confirmation indicator */}
      {isConfirmed && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
      )}

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="space-y-2">
            <PatternCategoryBadge category={category} size="sm" />
            <h3 className="font-serif text-lg font-semibold text-foreground">
              {title}
            </h3>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {!isConfirmed ? (
              disabled ? (
                <span className="text-xs text-muted-foreground">View only</span>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onReject}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  >
                    <X size={16} />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onConfirm}
                    className="gap-1.5"
                  >
                    <Check size={14} />
                    Confirm
                  </Button>
                </>
              )
            ) : (
              <span className="flex items-center gap-1.5 text-sm text-primary">
                <Check size={14} />
                Confirmed
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground mb-4">{description}</p>

        {/* Stats & Evidence toggle */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Based on <span className="text-foreground font-medium">{signalCount}</span> signals
          </span>

          {evidence.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowEvidence(!showEvidence)}
              className="text-xs gap-1 h-7"
            >
              {showEvidence ? "Hide" : "Show"} Evidence
              {showEvidence ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </Button>
          )}
        </div>

        {/* Evidence list */}
        {showEvidence && evidence.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border/30 space-y-2 animate-fade-in">
            {evidence.map((e) => (
              <div
                key={e.id}
                className="p-2 rounded-lg bg-secondary/30 text-sm"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs uppercase tracking-wider text-primary font-medium">
                    {e.signal_flag}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(e.entry_date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
                {e.context && (
                  <p className="text-muted-foreground">{e.context}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};
