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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarRange, FileText, Check } from "lucide-react";
import { format, parseISO, startOfQuarter, endOfQuarter, addQuarters, isBefore, isAfter, isSameQuarter } from "date-fns";
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

interface QuarterOption {
  value: string;
  label: string;
  date: Date;
  isToday?: boolean;
}

export const TimeWindowSelector = ({
  roleStartDate,
  quarterRecords,
  selectedRange,
  onRangeChange,
}: TimeWindowSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localRange, setLocalRange] = useState<[number, number]>([0, 100]);

  // Min is role start date, max is today - roleStartDate should always be provided
  const today = new Date();
  const minDate = roleStartDate || today; // Fallback to today if somehow null
  const maxDate = today;

  // Generate quarterly options from role start to today
  const quarterOptions = useMemo(() => {
    const options: QuarterOption[] = [];
    const startQ = startOfQuarter(minDate);
    const endQ = startOfQuarter(maxDate);
    
    let current = startQ;
    let index = 0;
    
    while (isBefore(current, endQ) || isSameQuarter(current, endQ)) {
      const quarterNum = Math.ceil((current.getMonth() + 1) / 3);
      options.push({
        value: index.toString(),
        label: `Q${quarterNum} ${current.getFullYear()}`,
        date: current,
      });
      current = addQuarters(current, 1);
      index++;
    }
    
    // Add "Today" option at the end
    options.push({
      value: "today",
      label: `Today (${format(today, "MMM d, yyyy")})`,
      date: today,
      isToday: true,
    });
    
    return options;
  }, [minDate, maxDate]);

  // Get just quarterly options (without today) for slider steps
  const quarterlySteps = useMemo(() => 
    quarterOptions.filter(o => !o.isToday),
  [quarterOptions]);

  // Timeline for slider
  const timeline = useMemo(() => ({
    start: startOfQuarter(minDate),
    end: today,
    totalQuarters: quarterlySteps.length,
  }), [minDate, quarterlySteps.length]);

  // Convert slider value to quarter index
  const sliderToQuarterIndex = (value: number): number => {
    const maxIndex = timeline.totalQuarters - 1;
    return Math.round((value / 100) * maxIndex);
  };

  // Convert quarter index to slider value
  const quarterIndexToSlider = (index: number): number => {
    const maxIndex = Math.max(timeline.totalQuarters - 1, 1);
    return (index / maxIndex) * 100;
  };

  // Convert date to quarter index
  const dateToQuarterIndex = (date: Date): number => {
    const startQ = startOfQuarter(minDate);
    const targetQ = startOfQuarter(date);
    let index = 0;
    let current = startQ;
    
    while (isBefore(current, targetQ) && index < quarterlySteps.length - 1) {
      current = addQuarters(current, 1);
      index++;
    }
    
    return index;
  };

  // Get date from quarter index
  const quarterIndexToDate = (index: number): Date => {
    return quarterlySteps[Math.min(index, quarterlySteps.length - 1)]?.date || timeline.start;
  };

  // Initialize local range from selected range
  useEffect(() => {
    if (isOpen) {
      const startIdx = dateToQuarterIndex(selectedRange[0]);
      const endIdx = dateToQuarterIndex(selectedRange[1]);
      setLocalRange([
        quarterIndexToSlider(startIdx),
        quarterIndexToSlider(endIdx),
      ]);
    }
  }, [isOpen, selectedRange, timeline]);

  // Current dropdown values
  const startQuarterIndex = sliderToQuarterIndex(localRange[0]);
  const endQuarterIndex = sliderToQuarterIndex(localRange[1]);

  // Dropdown options filtered by position
  const startOptions = useMemo(() => 
    quarterOptions.filter((_, i) => i <= endQuarterIndex || quarterOptions[i]?.isToday === false),
  [quarterOptions, endQuarterIndex]);

  const endOptions = useMemo(() => 
    quarterOptions.filter((o, i) => i >= startQuarterIndex || o.isToday),
  [quarterOptions, startQuarterIndex]);

  // Get quarters within the current local range
  const quartersInRange = useMemo(() => {
    const startDate = quarterIndexToDate(startQuarterIndex);
    const endDate = endQuarterIndex === quarterlySteps.length - 1 || localRange[1] === 100
      ? today
      : endOfQuarter(quarterIndexToDate(endQuarterIndex));
    
    return quarterRecords.filter(q => {
      const qStart = parseISO(q.quarter_start_date);
      return (isAfter(qStart, startOfQuarter(startDate)) || isSameQuarter(qStart, startDate)) && 
             (isBefore(qStart, endDate) || isSameQuarter(qStart, startOfQuarter(endDate)));
    });
  }, [startQuarterIndex, endQuarterIndex, quarterRecords, quarterlySteps, localRange]);

  // Count total patterns in range
  const totalPatterns = quartersInRange.reduce((sum, q) => sum + q.pattern_count, 0);

  const handleSliderChange = (values: number[]) => {
    // Ensure left <= right
    const newStart = Math.min(values[0], values[1]);
    const newEnd = Math.max(values[0], values[1]);
    setLocalRange([newStart, newEnd]);
  };

  const handleStartChange = (value: string) => {
    if (value === "today") return; // Today can only be end
    const idx = parseInt(value);
    // Ensure start <= end
    const newEndIdx = Math.max(idx, endQuarterIndex);
    setLocalRange([
      quarterIndexToSlider(idx),
      quarterIndexToSlider(newEndIdx),
    ]);
  };

  const handleEndChange = (value: string) => {
    if (value === "today") {
      // Set to max slider value
      setLocalRange([localRange[0], 100]);
      return;
    }
    const idx = parseInt(value);
    // Ensure start <= end
    const newStartIdx = Math.min(idx, startQuarterIndex);
    setLocalRange([
      quarterIndexToSlider(newStartIdx),
      quarterIndexToSlider(idx),
    ]);
  };

  const handleApply = () => {
    const startDate = quarterIndexToDate(startQuarterIndex);
    const endDate = localRange[1] >= 99 ? today : endOfQuarter(quarterIndexToDate(endQuarterIndex));
    onRangeChange([startOfQuarter(startDate), endDate]);
    setIsOpen(false);
  };

  // Format the current range for display
  const rangeLabel = `${format(selectedRange[0], "MMM yyyy")} – ${format(selectedRange[1], "MMM yyyy")}`;
  
  // Count quarters in selected range
  const selectedQuarterCount = quarterRecords.filter(q => {
    const qStart = parseISO(q.quarter_start_date);
    return (isAfter(qStart, startOfQuarter(selectedRange[0])) || isSameQuarter(qStart, selectedRange[0])) && 
           (isBefore(qStart, selectedRange[1]) || isSameQuarter(qStart, startOfQuarter(selectedRange[1])));
  }).length;

  // Get current dropdown display values
  const getStartDisplayValue = () => {
    const opt = quarterlySteps[startQuarterIndex];
    return opt ? startQuarterIndex.toString() : "0";
  };

  const getEndDisplayValue = () => {
    if (localRange[1] >= 99) return "today";
    return endQuarterIndex.toString();
  };

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
              <span>Today</span>
            </div>
            
            {/* Dual Range Slider */}
            <div className="px-1">
              <Slider
                value={localRange}
                onValueChange={handleSliderChange}
                min={0}
                max={100}
                step={timeline.totalQuarters > 1 ? 100 / (timeline.totalQuarters - 1) : 100}
                className="cursor-pointer"
              />
            </div>
            
            {/* Selected Range Dropdowns */}
            <div className="flex items-center justify-center gap-3 pt-2">
              <Select value={getStartDisplayValue()} onValueChange={handleStartChange}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {quarterlySteps.map((opt, idx) => (
                    <SelectItem 
                      key={opt.value} 
                      value={idx.toString()}
                      disabled={idx > endQuarterIndex}
                    >
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <span className="text-muted-foreground text-sm">to</span>
              
              <Select value={getEndDisplayValue()} onValueChange={handleEndChange}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {quarterlySteps.map((opt, idx) => (
                    <SelectItem 
                      key={opt.value} 
                      value={idx.toString()}
                      disabled={idx < startQuarterIndex}
                    >
                      {opt.label}
                    </SelectItem>
                  ))}
                  <SelectItem value="today">
                    Today ({format(today, "MMM d")})
                  </SelectItem>
                </SelectContent>
              </Select>
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
          <Button 
            onClick={handleApply} 
            className="w-full"
            disabled={quartersInRange.length === 0}
          >
            {quartersInRange.length === 0 ? "No Quarters to Include" : "Apply Selection"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
