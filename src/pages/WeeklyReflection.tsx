import { useState, useEffect, useCallback } from "react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { RoleSelector } from "@/components/roles/RoleSelector";
import { WeekSelector } from "@/components/weekly/WeekSelector";
import { WeeklyEntryCard } from "@/components/weekly/WeeklyEntryCard";
import { SignalFlag, SignalFlagBadge } from "@/components/weekly/SignalFlagBadge";
import { ArrowLeft, Save, CheckCircle, LogOut, Calendar, Sparkles } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useRoles } from "@/contexts/RolesContext";
import { supabase } from "@/integrations/supabase/client";
import { startOfWeek, endOfWeek, format } from "date-fns";

interface JournalEntry {
  id: string;
  entry_date: string;
  accomplishments: string | null;
  decisions: string | null;
  challenges: string | null;
  learnings: string | null;
}

interface EntrySignalState {
  signal_flag: SignalFlag;
  context: string;
}

interface SelectedEntryState {
  [entryId: string]: EntrySignalState[];
}

const WeeklyReflection = () => {
  const { toast } = useToast();
  const { user, loading: authLoading, signOut } = useAuth();
  const { activeRole, loading: rolesLoading } = useRoles();
  
  const [weekStart, setWeekStart] = useState(() => 
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [selectedEntries, setSelectedEntries] = useState<SelectedEntryState>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [existingReflectionId, setExistingReflectionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });

  // Load entries for the selected week
  const loadWeekEntries = useCallback(async () => {
    if (!user || !activeRole) return;
    
    setIsLoading(true);
    
    try {
      const startDate = format(weekStart, "yyyy-MM-dd");
      const endDate = format(weekEnd, "yyyy-MM-dd");

      // Load journal entries for this week
      const { data: entriesData, error: entriesError } = await supabase
        .from("journal_entries")
        .select("id, entry_date, accomplishments, decisions, challenges, learnings")
        .eq("role_id", activeRole.id)
        .gte("entry_date", startDate)
        .lte("entry_date", endDate)
        .order("entry_date", { ascending: true });

      if (entriesError) throw entriesError;
      setEntries(entriesData || []);

      // Check for existing weekly reflection
      const { data: reflectionData, error: reflectionError } = await supabase
        .from("weekly_reflections")
        .select("id")
        .eq("role_id", activeRole.id)
        .eq("week_start_date", startDate)
        .maybeSingle();

      if (reflectionError) throw reflectionError;

      if (reflectionData) {
        setExistingReflectionId(reflectionData.id);

        // Load existing signals
        const { data: signalsData, error: signalsError } = await supabase
          .from("entry_signals")
          .select("entry_id, signal_flag, context")
          .eq("reflection_id", reflectionData.id);

        if (signalsError) throw signalsError;

        // Reconstruct selected entries state
        const selectedState: SelectedEntryState = {};
        signalsData?.forEach((signal) => {
          if (!selectedState[signal.entry_id]) {
            selectedState[signal.entry_id] = [];
          }
          selectedState[signal.entry_id].push({
            signal_flag: signal.signal_flag as SignalFlag,
            context: signal.context || "",
          });
        });
        setSelectedEntries(selectedState);
      } else {
        setExistingReflectionId(null);
        setSelectedEntries({});
      }
    } catch (error) {
      console.error("Error loading week entries:", error);
      toast({
        title: "Error",
        description: "Failed to load entries for this week.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, activeRole, weekStart, weekEnd, toast]);

  useEffect(() => {
    loadWeekEntries();
  }, [loadWeekEntries]);

  const handleToggleSelect = (entryId: string) => {
    setSelectedEntries((prev) => {
      if (prev[entryId]) {
        const newState = { ...prev };
        delete newState[entryId];
        return newState;
      }
      return { ...prev, [entryId]: [] };
    });
  };

  const handleSignalToggle = (entryId: string, flag: SignalFlag) => {
    setSelectedEntries((prev) => {
      const entrySignals = prev[entryId] || [];
      const existingIndex = entrySignals.findIndex(s => s.signal_flag === flag);
      
      if (existingIndex >= 0) {
        // Remove the flag
        return {
          ...prev,
          [entryId]: entrySignals.filter((_, i) => i !== existingIndex),
        };
      } else {
        // Add the flag (max 2 flags per entry)
        if (entrySignals.length >= 2) {
          toast({
            title: "Limit reached",
            description: "You can only add up to 2 signal flags per entry.",
          });
          return prev;
        }
        return {
          ...prev,
          [entryId]: [...entrySignals, { signal_flag: flag, context: "" }],
        };
      }
    });
  };

  const handleContextChange = (entryId: string, flag: SignalFlag, context: string) => {
    setSelectedEntries((prev) => {
      const entrySignals = prev[entryId] || [];
      return {
        ...prev,
        [entryId]: entrySignals.map((s) =>
          s.signal_flag === flag ? { ...s, context } : s
        ),
      };
    });
  };

  const handleSave = async () => {
    if (!user || !activeRole) return;

    setIsSaving(true);

    try {
      const startDate = format(weekStart, "yyyy-MM-dd");
      const endDate = format(weekEnd, "yyyy-MM-dd");

      let reflectionId = existingReflectionId;

      if (!reflectionId) {
        // Create new weekly reflection
        const { data, error } = await supabase
          .from("weekly_reflections")
          .insert({
            user_id: user.id,
            role_id: activeRole.id,
            week_start_date: startDate,
            week_end_date: endDate,
          })
          .select()
          .single();

        if (error) throw error;
        reflectionId = data.id;
        setExistingReflectionId(data.id);
      }

      // Delete existing signals for this reflection
      await supabase
        .from("entry_signals")
        .delete()
        .eq("reflection_id", reflectionId);

      // Insert new signals
      const signalsToInsert = Object.entries(selectedEntries).flatMap(
        ([entryId, signals]) =>
          signals.map((signal) => ({
            user_id: user.id,
            entry_id: entryId,
            reflection_id: reflectionId,
            signal_flag: signal.signal_flag,
            context: signal.context || null,
          }))
      );

      if (signalsToInsert.length > 0) {
        const { error: signalsError } = await supabase
          .from("entry_signals")
          .insert(signalsToInsert);

        if (signalsError) throw signalsError;
      }

      setIsSaved(true);
      toast({
        title: "Reflection saved",
        description: "Your weekly reflection has been captured.",
      });
      setTimeout(() => setIsSaved(false), 3000);
    } catch (error) {
      console.error("Error saving reflection:", error);
      toast({
        title: "Error",
        description: "Failed to save reflection. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  // Calculate summary stats
  const selectedCount = Object.keys(selectedEntries).length;
  const totalSignals = Object.values(selectedEntries).reduce(
    (acc, signals) => acc + signals.length,
    0
  );

  // Redirect to auth if not logged in
  if (!authLoading && !user) {
    return <Navigate to="/auth" replace />;
  }

  if (authLoading || rolesLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link to="/journal">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft size={20} />
              </Button>
            </Link>
            <Logo size="sm" />
          </div>

          <div className="flex-1 flex justify-center">
            <RoleSelector />
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={isSaved ? "outline" : "hero"}
              onClick={handleSave}
              disabled={isSaving || !activeRole || selectedCount === 0}
              className="min-w-[120px]"
            >
              {isSaving ? (
                <span className="animate-pulse">Saving...</span>
              ) : isSaved ? (
                <>
                  <CheckCircle size={18} />
                  Saved
                </>
              ) : (
                <>
                  <Save size={18} />
                  Save
                </>
              )}
            </Button>
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut size={18} />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div
          className="mb-8 opacity-0 animate-fade-up"
          style={{ animationDelay: "100ms", animationFillMode: "forwards" }}
        >
          <div className="flex items-center gap-3 text-muted-foreground mb-2">
            <Sparkles size={18} className="text-primary" />
            <span className="text-sm font-medium uppercase tracking-wider">
              Weekly Reflection
            </span>
            {activeRole && (
              <>
                <span className="text-border">•</span>
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: activeRole.color }}
                />
                <span className="text-sm">{activeRole.title}</span>
              </>
            )}
          </div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold mb-4">
            What Mattered This Week?
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            Review your daily logs and select the entries that genuinely mattered. 
            Apply signal flags to classify why the work was important.
          </p>
        </div>

        {/* Week Selector */}
        <div
          className="flex items-center justify-between mb-6 opacity-0 animate-fade-up"
          style={{ animationDelay: "150ms", animationFillMode: "forwards" }}
        >
          <WeekSelector weekStart={weekStart} onChange={setWeekStart} />
          
          {selectedCount > 0 && (
            <div className="text-sm text-muted-foreground">
              <span className="text-foreground font-medium">{selectedCount}</span> entries selected
              {totalSignals > 0 && (
                <> with <span className="text-foreground font-medium">{totalSignals}</span> signals</>
              )}
            </div>
          )}
        </div>

        {/* Signal Flags Legend */}
        <div
          className="mb-6 p-4 rounded-xl bg-secondary/30 border border-border/30 opacity-0 animate-fade-up"
          style={{ animationDelay: "200ms", animationFillMode: "forwards" }}
        >
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">
            Signal Flags
          </p>
          <div className="flex flex-wrap gap-3">
            {(["delivery", "ownership", "influence", "learning"] as SignalFlag[]).map((flag) => (
              <div key={flag} className="flex items-center gap-2">
                <SignalFlagBadge flag={flag} selected size="sm" />
              </div>
            ))}
          </div>
        </div>

        {/* No Role Warning */}
        {!activeRole && (
          <div className="p-6 rounded-2xl bg-secondary/30 border border-border/50 text-center mb-8">
            <p className="text-muted-foreground">
              Select a role to view weekly entries.
            </p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && activeRole && (
          <div className="text-center py-12">
            <div className="animate-pulse text-muted-foreground">Loading entries...</div>
          </div>
        )}

        {/* Entries List */}
        {!isLoading && activeRole && (
          <div
            className="space-y-3 opacity-0 animate-fade-up"
            style={{ animationDelay: "250ms", animationFillMode: "forwards" }}
          >
            {entries.length === 0 ? (
              <div className="text-center py-12 rounded-2xl bg-secondary/20 border border-border/30">
                <Calendar className="mx-auto mb-4 text-muted-foreground" size={32} />
                <p className="text-muted-foreground">
                  No journal entries for this week.
                </p>
                <Link to="/journal">
                  <Button variant="link" className="mt-2">
                    Go to Daily Capture →
                  </Button>
                </Link>
              </div>
            ) : (
              entries.map((entry) => (
                <WeeklyEntryCard
                  key={entry.id}
                  entry={entry}
                  isSelected={!!selectedEntries[entry.id]}
                  signals={selectedEntries[entry.id] || []}
                  onToggleSelect={() => handleToggleSelect(entry.id)}
                  onSignalToggle={(flag) => handleSignalToggle(entry.id, flag)}
                  onContextChange={(flag, context) => handleContextChange(entry.id, flag, context)}
                />
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default WeeklyReflection;
