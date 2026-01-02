import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronLeft, ChevronRight, CalendarIcon, RotateCcw } from "lucide-react";
import { startOfWeek, endOfWeek, addWeeks, subWeeks, format, isAfter } from "date-fns";
import { cn } from "@/lib/utils";

interface WeekSelectorProps {
  weekStart: Date;
  onChange: (date: Date) => void;
}

export const WeekSelector = ({ weekStart, onChange }: WeekSelectorProps) => {
  const [calendarOpen, setCalendarOpen] = useState(false);
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

  const goToCurrentWeek = () => {
    onChange(currentWeekStart);
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const newWeekStart = startOfWeek(date, { weekStartsOn: 1 });
      // Don't allow future weeks
      if (!isAfter(newWeekStart, currentWeekStart)) {
        onChange(newWeekStart);
      }
    }
    setCalendarOpen(false);
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

      <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            className="min-w-[180px] h-auto py-1 px-3 hover:bg-secondary/50"
          >
            <div className="text-center flex flex-col items-center gap-0.5">
              <div className="flex items-center gap-2">
                <CalendarIcon size={14} className="text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {format(weekStart, "MMM d")} – {format(weekEnd, "MMM d, yyyy")}
                </span>
              </div>
              {isCurrentWeek && (
                <span className="text-xs text-primary font-medium">This Week</span>
              )}
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="center">
          <Calendar
            mode="single"
            selected={weekStart}
            onSelect={handleDateSelect}
            defaultMonth={weekStart}
            disabled={(date) => isAfter(startOfWeek(date, { weekStartsOn: 1 }), currentWeekStart)}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>

      <Button
        variant="ghost"
        size="icon"
        onClick={goToNextWeek}
        disabled={isCurrentWeek || isFutureWeek}
        className="h-8 w-8"
      >
        <ChevronRight size={18} />
      </Button>

      {!isCurrentWeek && (
        <Button
          variant="outline"
          size="sm"
          onClick={goToCurrentWeek}
          className="h-8 gap-1.5 text-xs ml-2"
        >
          <RotateCcw size={14} />
          Current
        </Button>
      )}
    </div>
  );
};
