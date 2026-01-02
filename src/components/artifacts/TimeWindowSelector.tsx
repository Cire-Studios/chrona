import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { CalendarRange, FileText, Check } from "lucide-react";
import { format, parseISO, startOfQuarter, endOfQuarter, differenceInQuarters, addQuarters } from "date-fns";
import { cn } from "@/lib/utils";

interface QuarterRecord {
  id: string;
  quarter_start_date: string;
  quarter_end_date: string;
  pattern_count: number;
}

interface TimeWindowSelectorProps {
  roleStartDate: Date | null;
  roleEndDate: Date | null;
  quarterRecords: QuarterRecord[];
  selectedRange: [Date, Date];
  onRangeChange: (range: [Date, Date]) => void;
}

export const TimeWindowSelector = ({
  roleStartDate,
  roleEndDate,
  quarterRecords,
  selectedRange,
  onRangeChange,
}: TimeWindowSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localRange, setLocalRange] = useState<[number, number]>([0, 100]);

  // Calculate the full timeline based on role dates
  const timeline = useMemo(() => {
    const start = roleStartDate || new Date(2020, 0, 1);
    const end = roleEndDate || new Date();
    const startQ = startOfQuarter(start);
    const endQ = endOfQuarter(end);
    const totalQuarters = differenceInQuarters(endQ, startQ) + 1;
    
    return {
      start: startQ,
      end: endQ,
      totalQuarters: Math.max(totalQuarters, 1),
    };
  }, [roleStartDate, roleEndDate]);

  // Convert slider values to dates
  const sliderToDate = (value: number): Date => {
    const quarterIndex = Math.round((value / 100) * (timeline.totalQuarters - 1));
    return addQuarters(timeline.start, quarterIndex);
  };

  // Convert dates to slider values
  const dateToSlider = (date: Date): number => {
    const quarterIndex = differenceInQuarters(startOfQuarter(date), timeline.start);
    return Math.max(0, Math.min(100, (quarterIndex / Math.max(timeline.totalQuarters - 1, 1)) * 100));
  };

  // Initialize local range from selected range
  useEffect(() => {
    if (isOpen) {
      setLocalRange([
        dateToSlider(selectedRange[0]),
        dateToSlider(selectedRange[1]),
      ]);
    }
  }, [isOpen, selectedRange, timeline]);

  // Get quarters within the current local range
  const quartersInRange = useMemo(() => {
    const startDate = sliderToDate(localRange[0]);
    const endDate = endOfQuarter(sliderToDate(localRange[1]));
    
    return quarterRecords.filter(q => {
      const qStart = parseISO(q.quarter_start_date);
      return qStart >= startOfQuarter(startDate) && qStart <= startOfQuarter(endDate);
    });
  }, [localRange, quarterRecords, timeline]);

  // Count total patterns in range
  const totalPatterns = quartersInRange.reduce((sum, q) => sum + q.pattern_count, 0);

  const handleSliderChange = (values: number[]) => {
    setLocalRange([values[0], values[1]]);
  };

  const handleApply = () => {
    onRangeChange([sliderToDate(localRange[0]), endOfQuarter(sliderToDate(localRange[1]))]);
    setIsOpen(false);
  };

  // Format the current range for display
  const rangeLabel = `${format(selectedRange[0], "MMM yyyy")} – ${format(selectedRange[1], "MMM yyyy")}`;
  
  // Count quarters in selected range
  const selectedQuarterCount = quarterRecords.filter(q => {
    const qStart = parseISO(q.quarter_start_date);
    return qStart >= startOfQuarter(selectedRange[0]) && qStart <= startOfQuarter(selectedRange[1]);
  }).length;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="h-auto py-3 px-4 justify-start gap-3 w-full"
        >
          <div className="p-2 rounded-lg bg-primary/10">
            <CalendarRange className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 text-left">
            <div className="font-medium">{rangeLabel}</div>
            <div className="text-xs text-muted-foreground">
              {selectedQuarterCount} quarter{selectedQuarterCount !== 1 ? "s" : ""} • Click to adjust
            </div>
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Select Time Window</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 pt-4">
          {/* Timeline Labels */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground px-1">
              <span>{format(timeline.start, "MMM yyyy")}</span>
              <span>{format(timeline.end, "MMM yyyy")}</span>
            </div>
            
            {/* Dual Range Slider */}
            <div className="px-1">
              <Slider
                value={localRange}
                onValueChange={handleSliderChange}
                min={0}
                max={100}
                step={100 / Math.max(timeline.totalQuarters - 1, 1)}
                className="cursor-pointer"
              />
            </div>
            
            {/* Selected Range Display */}
            <div className="flex items-center justify-center gap-2 pt-2">
              <Badge variant="secondary" className="text-sm font-medium">
                {format(sliderToDate(localRange[0]), "MMM yyyy")}
              </Badge>
              <span className="text-muted-foreground">to</span>
              <Badge variant="secondary" className="text-sm font-medium">
                {format(endOfQuarter(sliderToDate(localRange[1])), "MMM yyyy")}
              </Badge>
            </div>
          </div>

          {/* Quarters List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Included Quarters</h4>
              <span className="text-xs text-muted-foreground">
                {quartersInRange.length} quarter{quartersInRange.length !== 1 ? "s" : ""} • {totalPatterns} pattern{totalPatterns !== 1 ? "s" : ""}
              </span>
            </div>
            
            <ScrollArea className="h-[200px] rounded-lg border">
              {quartersInRange.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-8 text-muted-foreground">
                  <FileText className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">No quarterly records in this range</p>
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {quartersInRange.map((quarter) => {
                    const qStart = parseISO(quarter.quarter_start_date);
                    const quarterLabel = `Q${Math.ceil((qStart.getMonth() + 1) / 3)} ${qStart.getFullYear()}`;
                    
                    return (
                      <div
                        key={quarter.id}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg",
                          "bg-secondary/50 border border-transparent",
                          "transition-colors"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 rounded-md bg-primary/10">
                            <Check className="h-3.5 w-3.5 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium text-sm">{quarterLabel}</div>
                            <div className="text-xs text-muted-foreground">
                              {format(qStart, "MMM d")} – {format(parseISO(quarter.quarter_end_date), "MMM d, yyyy")}
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {quarter.pattern_count} pattern{quarter.pattern_count !== 1 ? "s" : ""}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Apply Button */}
          <Button onClick={handleApply} className="w-full">
            Apply Selection
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};