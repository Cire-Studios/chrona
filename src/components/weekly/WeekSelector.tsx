import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { startOfWeek, endOfWeek, addWeeks, subWeeks, format, isAfter } from "date-fns";

interface WeekSelectorProps {
  weekStart: Date;
  onChange: (date: Date) => void;
}

export const WeekSelector = ({ weekStart, onChange }: WeekSelectorProps) => {
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
  const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const isCurrentWeek = weekStart.getTime() === currentWeekStart.getTime();
  const isFutureWeek = isAfter(weekStart, currentWeekStart);

  const goToPreviousWeek = () => {
    onChange(subWeeks(weekStart, 1));
  };

  const goToNextWeek = () => {
    if (!isCurrentWeek) {
      onChange(addWeeks(weekStart, 1));
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={goToPreviousWeek}
        className="h-8 w-8"
      >
        <ChevronLeft size={18} />
      </Button>

      <div className="text-center min-w-[180px]">
        <p className="text-sm text-muted-foreground">
          {format(weekStart, "MMM d")} – {format(weekEnd, "MMM d, yyyy")}
        </p>
        {isCurrentWeek && (
          <span className="text-xs text-primary font-medium">This Week</span>
        )}
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={goToNextWeek}
        disabled={isCurrentWeek || isFutureWeek}
        className="h-8 w-8"
      >
        <ChevronRight size={18} />
      </Button>
    </div>
  );
};
