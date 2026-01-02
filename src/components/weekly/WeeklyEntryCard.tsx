import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { SignalFlagBadge, SignalFlag } from "./SignalFlagBadge";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface JournalEntry {
  id: string;
  entry_date: string;
  accomplishments: string | null;
  decisions: string | null;
  challenges: string | null;
  learnings: string | null;
}

interface EntrySignal {
  signal_flag: SignalFlag;
  context: string;
}

interface WeeklyEntryCardProps {
  entry: JournalEntry;
  isSelected: boolean;
  signals: EntrySignal[];
  onToggleSelect: () => void;
  onSignalToggle: (flag: SignalFlag) => void;
  onContextChange: (flag: SignalFlag, context: string) => void;
  disabled?: boolean;
}

export const WeeklyEntryCard = ({
  entry,
  isSelected,
  signals,
  onToggleSelect,
  onSignalToggle,
  onContextChange,
  disabled = false,
}: WeeklyEntryCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const formattedDate = new Date(entry.entry_date).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const hasContent = entry.accomplishments || entry.decisions || entry.challenges || entry.learnings;
  const selectedFlags = signals.map(s => s.signal_flag);

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all duration-300",
        isSelected
          ? "border-primary/50 bg-card shadow-glow"
          : "border-border/30 bg-secondary/20 hover:border-border/50"
      )}
    >
      {/* Selection indicator */}
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 w-1 transition-all duration-300",
          isSelected ? "bg-primary" : "bg-transparent"
        )}
      />

      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            {/* Select checkbox */}
            <button
              onClick={onToggleSelect}
              disabled={disabled}
              className={cn(
                "w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all duration-200 flex-shrink-0",
                isSelected
                  ? "bg-primary border-primary text-primary-foreground"
                  : "border-muted-foreground/30 hover:border-muted-foreground/60",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              {isSelected && <Check size={14} />}
            </button>

            <div className="min-w-0">
              <h4 className="font-medium text-foreground">{formattedDate}</h4>
              {!hasContent && (
                <p className="text-sm text-muted-foreground">No entries recorded</p>
              )}
            </div>
          </div>

          {/* Expand toggle */}
          {hasContent && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          )}
        </div>

        {/* Preview of accomplishments */}
        {hasContent && !isExpanded && (
          <p className="mt-2 ml-9 text-sm text-muted-foreground line-clamp-2">
            {entry.accomplishments || entry.decisions || entry.challenges || entry.learnings}
          </p>
        )}

        {/* Expanded content */}
        {hasContent && isExpanded && (
          <div className="mt-4 ml-9 space-y-3">
            {entry.accomplishments && (
              <div>
                <span className="text-xs font-medium text-primary uppercase tracking-wider">Accomplishments</span>
                <p className="text-sm text-foreground mt-1">{entry.accomplishments}</p>
              </div>
            )}
            {entry.decisions && (
              <div>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Decisions</span>
                <p className="text-sm text-foreground mt-1">{entry.decisions}</p>
              </div>
            )}
            {entry.challenges && (
              <div>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Challenges</span>
                <p className="text-sm text-foreground mt-1">{entry.challenges}</p>
              </div>
            )}
            {entry.learnings && (
              <div>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Learnings</span>
                <p className="text-sm text-foreground mt-1">{entry.learnings}</p>
              </div>
            )}
          </div>
        )}

        {/* Signal flags - show when selected */}
        {isSelected && (
          <div className="mt-4 ml-9 space-y-3 animate-fade-in">
            <div className="flex flex-wrap gap-2">
              {(["delivery", "ownership", "influence", "learning"] as SignalFlag[]).map((flag) => (
                <SignalFlagBadge
                  key={flag}
                  flag={flag}
                  selected={selectedFlags.includes(flag)}
                  onClick={() => onSignalToggle(flag)}
                />
              ))}
            </div>

            {/* Context inputs for selected flags */}
            {signals.length > 0 && (
              <div className="space-y-2">
                {signals.map((signal) => (
                  <div key={signal.signal_flag} className="flex items-start gap-2">
                    <SignalFlagBadge flag={signal.signal_flag} selected size="sm" />
                    <Textarea
                      value={signal.context}
                      onChange={(e) => onContextChange(signal.signal_flag, e.target.value)}
                      placeholder="Add brief context (optional)..."
                      className="flex-1 min-h-[60px] text-sm bg-secondary/50 border-border/30"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
