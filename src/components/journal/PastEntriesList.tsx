import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useRoles } from "@/contexts/RolesContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { JournalSearch, SignalFlag } from "./JournalSearch";
import { format, parseISO, isWithinInterval } from "date-fns";
import { DateRange } from "react-day-picker";
import { 
  FileText, 
  Calendar as CalendarIcon,
  Lightbulb,
  Trophy,
  AlertTriangle,
  Zap
} from "lucide-react";

interface JournalEntry {
  id: string;
  entry_date: string;
  accomplishments: string | null;
  decisions: string | null;
  challenges: string | null;
  learnings: string | null;
  role_id: string;
  created_at: string;
}

interface EntrySignal {
  entry_id: string;
  signal_flag: SignalFlag;
}

const signalColors: Record<SignalFlag, string> = {
  delivery: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  ownership: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  influence: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  learning: "bg-amber-500/20 text-amber-400 border-amber-500/30",
};

export const PastEntriesList = () => {
  const { user } = useAuth();
  const { roles, activeRole } = useRoles();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [signals, setSignals] = useState<EntrySignal[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedSignals, setSelectedSignals] = useState<SignalFlag[]>([]);

  useEffect(() => {
    if (user) {
      fetchEntries();
    }
  }, [user, activeRole]);

  const fetchEntries = async () => {
    if (!user) return;
    setLoading(true);

    try {
      let query = supabase
        .from("journal_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("entry_date", { ascending: false });

      // Filter by active role if selected
      if (activeRole) {
        query = query.eq("role_id", activeRole.id);
      }

      const { data: entriesData, error } = await query;
      if (error) throw error;

      setEntries(entriesData || []);

      // Fetch signals for all entries
      if (entriesData && entriesData.length > 0) {
        const entryIds = entriesData.map((e) => e.id);
        const { data: signalsData } = await supabase
          .from("entry_signals")
          .select("entry_id, signal_flag")
          .in("entry_id", entryIds);

        setSignals(signalsData || []);
      }
    } catch (error) {
      console.error("Error fetching entries:", error);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setDateRange(undefined);
    setSelectedSignals([]);
  };

  // Filter entries based on search criteria
  const filteredEntries = entries.filter((entry) => {
    // Text search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const searchableText = [
        entry.accomplishments,
        entry.decisions,
        entry.challenges,
        entry.learnings,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      
      if (!searchableText.includes(query)) {
        return false;
      }
    }

    // Date range filter
    if (dateRange?.from) {
      const entryDate = parseISO(entry.entry_date);
      const from = dateRange.from;
      const to = dateRange.to || dateRange.from;
      
      if (!isWithinInterval(entryDate, { start: from, end: to })) {
        return false;
      }
    }

    // Signal type filter
    if (selectedSignals.length > 0) {
      const entrySignals = signals
        .filter((s) => s.entry_id === entry.id)
        .map((s) => s.signal_flag);
      
      const hasMatchingSignal = selectedSignals.some((s) => entrySignals.includes(s));
      if (!hasMatchingSignal) {
        return false;
      }
    }

    return true;
  });

  const getEntrySignals = (entryId: string) => {
    return signals
      .filter((s) => s.entry_id === entryId)
      .map((s) => s.signal_flag);
  };

  const getRole = (roleId: string) => {
    return roles.find((r) => r.id === roleId);
  };

  const getPreviewText = (entry: JournalEntry): string => {
    const content = entry.accomplishments || entry.decisions || entry.challenges || entry.learnings || "";
    return content.length > 150 ? content.substring(0, 150) + "..." : content;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <JournalSearch
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        selectedSignals={selectedSignals}
        onSignalsChange={setSelectedSignals}
        onClearFilters={clearFilters}
      />

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        {filteredEntries.length} {filteredEntries.length === 1 ? "entry" : "entries"} found
      </div>

      {/* Entries List */}
      {filteredEntries.length === 0 ? (
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No entries found</h3>
            <p className="text-muted-foreground">
              {entries.length === 0
                ? "Start journaling to see your past entries here."
                : "Try adjusting your search or filters."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredEntries.map((entry) => {
            const role = getRole(entry.role_id);
            const entrySignals = getEntrySignals(entry.id);

            return (
              <Card
                key={entry.id}
                className="bg-card/50 border-border/50 hover:bg-card/80 transition-colors"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CalendarIcon className="h-4 w-4" />
                          {format(parseISO(entry.entry_date), "EEEE, MMMM d, yyyy")}
                        </div>
                        {role && (
                          <>
                            <span className="text-border">•</span>
                            <div className="flex items-center gap-1.5">
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: role.color }}
                              />
                              <span className="text-sm text-muted-foreground">
                                {role.title}
                              </span>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Content Preview */}
                      <p className="text-foreground/80 text-sm line-clamp-2 mb-3">
                        {getPreviewText(entry)}
                      </p>

                      {/* Section Indicators */}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {entry.accomplishments && (
                          <div className="flex items-center gap-1">
                            <Trophy className="h-3 w-3 text-emerald-400" />
                            <span>Wins</span>
                          </div>
                        )}
                        {entry.decisions && (
                          <div className="flex items-center gap-1">
                            <Zap className="h-3 w-3 text-blue-400" />
                            <span>Decisions</span>
                          </div>
                        )}
                        {entry.challenges && (
                          <div className="flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3 text-amber-400" />
                            <span>Challenges</span>
                          </div>
                        )}
                        {entry.learnings && (
                          <div className="flex items-center gap-1">
                            <Lightbulb className="h-3 w-3 text-purple-400" />
                            <span>Learnings</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Signals */}
                    {entrySignals.length > 0 && (
                      <div className="flex flex-col gap-1">
                        {entrySignals.map((signal) => (
                          <Badge
                            key={signal}
                            variant="outline"
                            className={`text-xs ${signalColors[signal]}`}
                          >
                            {signal.charAt(0).toUpperCase() + signal.slice(1)}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
