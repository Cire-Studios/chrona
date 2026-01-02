import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { startOfQuarter, endOfQuarter, addQuarters, subQuarters, format, isAfter } from "date-fns";

interface QuarterSelectorProps {
  quarterStart: Date;
  onChange: (date: Date) => void;
}

export const QuarterSelector = ({ quarterStart, onChange }: QuarterSelectorProps) => {
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

      <div className="text-center min-w-[160px]">
        <p className="font-medium text-foreground">
          Q{quarterNumber} {year}
        </p>
        <p className="text-xs text-muted-foreground">
          {format(quarterStart, "MMM d")} – {format(quarterEnd, "MMM d")}
        </p>
        {isCurrentQuarter && (
          <span className="text-xs text-primary font-medium">Current Quarter</span>
        )}
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={goToNextQuarter}
        disabled={isCurrentQuarter || isFutureQuarter}
        className="h-8 w-8"
      >
        <ChevronRight size={18} />
      </Button>
    </div>
  );
};
