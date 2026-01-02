import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { 
  Search, 
  CalendarIcon, 
  X, 
  Filter,
  ChevronDown
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";

export type SignalFlag = "delivery" | "ownership" | "influence" | "learning";

interface JournalSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  selectedSignals: SignalFlag[];
  onSignalsChange: (signals: SignalFlag[]) => void;
  onClearFilters: () => void;
}

const signalOptions: { value: SignalFlag; label: string; color: string }[] = [
  { value: "delivery", label: "Delivery", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  { value: "ownership", label: "Ownership", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  { value: "influence", label: "Influence", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  { value: "learning", label: "Learning", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
];

export const JournalSearch = ({
  searchQuery,
  onSearchChange,
  dateRange,
  onDateRangeChange,
  selectedSignals,
  onSignalsChange,
  onClearFilters,
}: JournalSearchProps) => {
  const [showFilters, setShowFilters] = useState(false);

  const toggleSignal = (signal: SignalFlag) => {
    if (selectedSignals.includes(signal)) {
      onSignalsChange(selectedSignals.filter((s) => s !== signal));
    } else {
      onSignalsChange([...selectedSignals, signal]);
    }
  };

  const hasActiveFilters = searchQuery || dateRange?.from || selectedSignals.length > 0;

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search entries by keyword..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-secondary/30 border-border/50"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "gap-2",
            showFilters && "bg-secondary"
          )}
        >
          <Filter className="h-4 w-4" />
          Filters
          <ChevronDown className={cn(
            "h-4 w-4 transition-transform",
            showFilters && "rotate-180"
          )} />
        </Button>
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <div className="p-4 rounded-lg bg-secondary/30 border border-border/50 space-y-4">
          {/* Date Range */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Date Range</label>
            <div className="flex gap-2 flex-wrap">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !dateRange?.from && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      "Select date range"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={onDateRangeChange}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
              
              {dateRange?.from && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDateRangeChange(undefined)}
                  className="text-muted-foreground"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear dates
                </Button>
              )}
            </div>
          </div>

          {/* Signal Type Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Signal Types</label>
            <div className="flex gap-2 flex-wrap">
              {signalOptions.map((signal) => (
                <Badge
                  key={signal.value}
                  variant="outline"
                  className={cn(
                    "cursor-pointer transition-all",
                    selectedSignals.includes(signal.value)
                      ? signal.color
                      : "bg-transparent text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => toggleSignal(signal.value)}
                >
                  {signal.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Clear All */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="text-muted-foreground"
            >
              <X className="h-4 w-4 mr-1" />
              Clear all filters
            </Button>
          )}
        </div>
      )}

      {/* Active Filter Pills */}
      {hasActiveFilters && !showFilters && (
        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {searchQuery && (
            <Badge variant="secondary" className="gap-1">
              "{searchQuery}"
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => onSearchChange("")}
              />
            </Badge>
          )}
          {dateRange?.from && (
            <Badge variant="secondary" className="gap-1">
              {format(dateRange.from, "MMM d")}
              {dateRange.to && ` - ${format(dateRange.to, "MMM d")}`}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => onDateRangeChange(undefined)}
              />
            </Badge>
          )}
          {selectedSignals.map((signal) => {
            const option = signalOptions.find((s) => s.value === signal);
            return (
              <Badge 
                key={signal} 
                variant="outline" 
                className={cn("gap-1", option?.color)}
              >
                {option?.label}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => toggleSignal(signal)}
                />
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
};
