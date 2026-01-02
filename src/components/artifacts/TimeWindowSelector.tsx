import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import { format, parseISO, startOfQuarter, addQuarters, isBefore, isAfter, isSameQuarter } from "date-fns";
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
}

export const TimeWindowSelector = ({
  roleStartDate,
  quarterRecords,
  selectedRange,
  onRangeChange,
}: TimeWindowSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Min is role start date, max is today
  const today = useMemo(() => new Date(), []);
  const minDate = roleStartDate || today;

  // Generate quarterly options from role start to today
  const quarterOptions = useMemo(() => {
    const options: QuarterOption[] = [];
    const startQ = startOfQuarter(minDate);
    const endQ = startOfQuarter(today);
    
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
    
    return options;
  }, [minDate, today]);

  // Local state for dropdown selections - start quarter index and whether end is "today"
  const [startIndex, setStartIndex] = useState(0);
  const [endValue, setEndValue] = useState<string>("today"); // "today" or quarter index as string

  // Initialize from selectedRange when dialog opens
  useEffect(() => {
    if (isOpen && quarterOptions.length > 0) {
      // Find start quarter index
      const startQ = startOfQuarter(selectedRange[0]);
      let foundStartIdx = 0;
      for (let i = 0; i < quarterOptions.length; i++) {
        if (isSameQuarter(quarterOptions[i].date, startQ)) {
          foundStartIdx = i;
          break;
        }
      }
      setStartIndex(foundStartIdx);
      
      // Check if end is "today" (not exactly end of a quarter)
      // Default to "today" always
      setEndValue("today");
    }
  }, [isOpen, selectedRange, quarterOptions]);

  // Get the end date based on endValue
  const getEndDate = (): Date => {
    if (endValue === "today") {
      return today;
    }
    const idx = parseInt(endValue);
    const quarterDate = quarterOptions[idx]?.date;
    if (!quarterDate) return today;
    // Return today if it's the current quarter, otherwise end of that quarter
    if (isSameQuarter(quarterDate, today)) {
      return today;
    }
    // For past quarters, use today as max (they selected a past quarter as end)
    return today;
  };

  // Get quarters within the current selection
  const quartersInRange = useMemo(() => {
    if (quarterOptions.length === 0) return [];
    
    const startDate = quarterOptions[startIndex]?.date || startOfQuarter(minDate);
    const endDate = getEndDate();
    
    return quarterRecords.filter(q => {
      const qStart = parseISO(q.quarter_start_date);
      return (isAfter(qStart, startOfQuarter(startDate)) || isSameQuarter(qStart, startDate)) && 
             (isBefore(qStart, endDate) || isSameQuarter(qStart, startOfQuarter(endDate)));
    });
  }, [startIndex, endValue, quarterRecords, quarterOptions, minDate]);

  // Count total patterns in range
  const totalPatterns = quartersInRange.reduce((sum, q) => sum + q.pattern_count, 0);

  const handleStartChange = (value: string) => {
    const idx = parseInt(value);
    setStartIndex(idx);
    
    // If end is a quarter index and now less than start, reset to today
    if (endValue !== "today") {
      const endIdx = parseInt(endValue);
      if (endIdx < idx) {
        setEndValue("today");
      }
    }
  };

  const handleEndChange = (value: string) => {
    if (value === "today") {
      setEndValue("today");
      return;
    }
    const idx = parseInt(value);
    // Ensure end >= start
    if (idx >= startIndex) {
      setEndValue(value);
    }
  };

  const handleApply = () => {
    const startDate = quarterOptions[startIndex]?.date || startOfQuarter(minDate);
    const endDate = getEndDate();
    onRangeChange([startOfQuarter(startDate), endDate]);
    setIsOpen(false);
  };

  // Format the current range for display
  const formatEndDate = (date: Date) => {
    // Check if it's close to today (within same day)
    const isToday = date.toDateString() === today.toDateString();
    return isToday ? `Today` : format(date, "MMM yyyy");
  };
  
  const rangeLabel = `${format(selectedRange[0], "MMM yyyy")} – ${formatEndDate(selectedRange[1])}`;
  
  // Count quarters in selected range
  const selectedQuarterCount = quarterRecords.filter(q => {
    const qStart = parseISO(q.quarter_start_date);
    return (isAfter(qStart, startOfQuarter(selectedRange[0])) || isSameQuarter(qStart, selectedRange[0])) && 
           (isBefore(qStart, selectedRange[1]) || isSameQuarter(qStart, startOfQuarter(selectedRange[1])));
  }).length;

  // Get end dropdown display value
  const getEndDisplayLabel = () => {
    if (endValue === "today") {
      return `Today (${format(today, "MMM d")})`;
    }
    const idx = parseInt(endValue);
    return quarterOptions[idx]?.label || "Today";
  };

  // Single quarter edge case - only show dropdowns, no slider needed
  const isSingleQuarter = quarterOptions.length === 1;

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
          {/* Date Range Info */}
          <div className="text-center text-sm text-muted-foreground">
            Role started {format(minDate, "MMM d, yyyy")}
          </div>

          {/* Selected Range Dropdowns */}
          <div className="flex items-center justify-center gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground font-medium">From</label>
              <Select value={startIndex.toString()} onValueChange={handleStartChange}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {quarterOptions.map((opt, idx) => (
                    <SelectItem 
                      key={opt.value} 
                      value={idx.toString()}
                    >
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <span className="text-muted-foreground text-sm mt-6">to</span>
            
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground font-medium">To</label>
              <Select value={endValue} onValueChange={handleEndChange}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue>{getEndDisplayLabel()}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {quarterOptions.map((opt, idx) => (
                    <SelectItem 
                      key={opt.value} 
                      value={idx.toString()}
                      disabled={idx < startIndex}
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
                  <p className="text-xs mt-1">Complete a quarterly distillation first</p>
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
