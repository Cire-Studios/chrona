import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronLeft, ChevronRight, CalendarIcon, RotateCcw } from "lucide-react";
import { startOfQuarter, endOfQuarter, addQuarters, subQuarters, format, isAfter } from "date-fns";
import { cn } from "@/lib/utils";

interface QuarterSelectorProps {
  quarterStart: Date;
  onChange: (date: Date) => void;
}

export const QuarterSelector = ({ quarterStart, onChange }: QuarterSelectorProps) => {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const quarterEnd = endOfQuarter(quarterStart);
  const currentQuarterStart = startOfQuarter(new Date());
  const isCurrentQuarter = quarterStart.getTime() === currentQuarterStart.getTime();
  const isFutureQuarter = isAfter(quarterStart, currentQuarterStart);

  const quarterNumber = Math.ceil((quarterStart.getMonth() + 1) / 3);
  const year = quarterStart.getFullYear();

  const goToPreviousQuarter = () => {
    onChange(subQuarters(quarterStart, 1));
  };

  const goToNextQuarter = () => {
    if (!isCurrentQuarter) {
      onChange(addQuarters(quarterStart, 1));
    }
  };

  const goToCurrentQuarter = () => {
    onChange(currentQuarterStart);
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const newQuarterStart = startOfQuarter(date);
      // Don't allow future quarters
      if (!isAfter(newQuarterStart, currentQuarterStart)) {
        onChange(newQuarterStart);
      }
    }
    setCalendarOpen(false);
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={goToPreviousQuarter}
        className="h-8 w-8"
      >
        <ChevronLeft size={18} />
      </Button>

      <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            className="min-w-[160px] h-auto py-1 px-3 hover:bg-secondary/50"
          >
            <div className="text-center flex flex-col items-center gap-0.5">
              <div className="flex items-center gap-2">
                <CalendarIcon size={14} className="text-muted-foreground" />
                <span className="font-medium text-foreground">
                  Q{quarterNumber} {year}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                {format(quarterStart, "MMM d")} – {format(quarterEnd, "MMM d")}
              </span>
              {isCurrentQuarter && (
                <span className="text-xs text-primary font-medium">Current Quarter</span>
              )}
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="center">
          <Calendar
            mode="single"
            selected={quarterStart}
            onSelect={handleDateSelect}
            defaultMonth={quarterStart}
            disabled={(date) => isAfter(startOfQuarter(date), currentQuarterStart)}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>

      <Button
        variant="ghost"
        size="icon"
        onClick={goToNextQuarter}
        disabled={isCurrentQuarter || isFutureQuarter}
        className="h-8 w-8"
      >
        <ChevronRight size={18} />
      </Button>

      {!isCurrentQuarter && (
        <Button
          variant="outline"
          size="sm"
          onClick={goToCurrentQuarter}
          className="h-8 gap-1.5 text-xs ml-2"
        >
          <RotateCcw size={14} />
          Current
        </Button>
      )}
    </div>
  );
};
