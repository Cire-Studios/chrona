import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/layout/AppHeader";
import { StickyRoleSelector } from "@/components/roles/StickyRoleSelector";
import { QuarterSelector } from "@/components/quarterly/QuarterSelector";
import { PatternCard } from "@/components/quarterly/PatternCard";
import { PatternCategory } from "@/components/quarterly/PatternCategoryBadge";
import { CheckCircle, Layers, Lock, AlertCircle, Sparkles } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useRoles } from "@/contexts/RolesContext";
import { supabase } from "@/integrations/supabase/client";
import { startOfQuarter, endOfQuarter, format } from "date-fns";

interface Signal {
  id: string;
  signal_flag: string;
  context: string | null;
  entry_date: string;
  accomplishments: string | null;
  decisions: string | null;
}

interface Pattern {
  id: string;
  category: PatternCategory;
  title: string;
  description: string;
  signal_count: number;
  is_confirmed: boolean;
  evidence: Signal[];
}

interface QuarterlyRecord {
  id: string;
  status: "draft" | "finalized";
  summary: string | null;
}

const QuarterlyDistillation = () => {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { activeRole, loading: rolesLoading } = useRoles();

  const [quarterStart, setQuarterStart] = useState(() =>
    startOfQuarter(new Date())
  );
  const [signals, setSignals] = useState<Signal[]>([]);
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [record, setRecord] = useState<QuarterlyRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const quarterNumber = Math.ceil((quarterStart.getMonth() + 1) / 3);
  const quarterLabel = `Q${quarterNumber} ${quarterStart.getFullYear()}`;


  const quarterEnd = endOfQuarter(quarterStart);

  useEffect(() => {
    if (!user || !activeRole) {
      setSignals([]);
      setPatterns([]);
      setRecord(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const run = async () => {
      setIsLoading(true);

      try {
        const localQuarterEnd = endOfQuarter(quarterStart);
        const startDate = format(quarterStart, "yyyy-MM-dd");
        const endDate = format(localQuarterEnd, "yyyy-MM-dd");

        // Load entry signals for this quarter through weekly reflections
        const { data: signalsData, error: signalsError } = await supabase
          .from("entry_signals")
          .select(`
            id,
            signal_flag,
            context,
            journal_entries!inner (
              entry_date,
              accomplishments,
              decisions,
              role_id
            )
          `)
          .eq("user_id", user.id);

        if (signalsError) throw signalsError;
        if (cancelled) return;

        // Filter signals for this role and quarter
        const filteredSignals = (signalsData || [])
          .filter((s: any) => {
            const entryDate = s.journal_entries?.entry_date;
            const roleId = s.journal_entries?.role_id;
            return (
              roleId === activeRole.id &&
              entryDate >= startDate &&
              entryDate <= endDate
            );
          })
          .map((s: any) => ({
            id: s.id,
            signal_flag: s.signal_flag,
            context: s.context,
            entry_date: s.journal_entries.entry_date,
            accomplishments: s.journal_entries.accomplishments,
            decisions: s.journal_entries.decisions,
          }));

        setSignals(filteredSignals);

        // Check for existing quarterly record
        const { data: recordData, error: recordError } = await supabase
          .from("quarterly_records")
          .select("id, status, summary")
          .eq("role_id", activeRole.id)
          .eq("quarter_start_date", startDate)
          .maybeSingle();

        if (recordError) throw recordError;
        if (cancelled) return;

        if (recordData) {
          setRecord(recordData as QuarterlyRecord);

          // Load existing patterns
          const { data: patternsData, error: patternsError } = await supabase
            .from("quarterly_patterns")
            .select(`
              id,
              category,
              title,
              description,
              signal_count,
              is_confirmed,
              pattern_evidence (
                signal_id
              )
            `)
            .eq("record_id", recordData.id);

          if (patternsError) throw patternsError;
          if (cancelled) return;

          // Map patterns with their evidence
          const patternsWithEvidence = (patternsData || []).map((p: any) => {
            const evidenceIds = p.pattern_evidence?.map((e: any) => e.signal_id) || [];
            const evidence = filteredSignals.filter((s: Signal) => evidenceIds.includes(s.id));
            return {
              id: p.id,
              category: p.category as PatternCategory,
              title: p.title,
              description: p.description,
              signal_count: p.signal_count,
              is_confirmed: p.is_confirmed,
              evidence,
            };
          });

          setPatterns(patternsWithEvidence);
        } else {
          setRecord(null);
          setPatterns([]);
        }
      } catch (error) {
        console.error("Error loading quarter data:", error);
        toast({
          title: "Error",
          description: "Failed to load quarterly data.",
          variant: "destructive",
        });
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [user?.id, activeRole?.id, quarterStart.getTime()]);


  const analyzePatterns = async () => {
    if (!user || !activeRole || signals.length === 0) return;

    setIsAnalyzing(true);

    try {
      const response = await supabase.functions.invoke("analyze-patterns", {
        body: {
          signals,
          roleTitle: activeRole.title,
          quarterLabel,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const { patterns: suggestedPatterns, error } = response.data;

      if (error) {
        throw new Error(error);
      }

      // Create quarterly record if it doesn't exist
      let recordId = record?.id;
      const startDate = format(quarterStart, "yyyy-MM-dd");
      const endDate = format(quarterEnd, "yyyy-MM-dd");

      if (!recordId) {
        const { data: newRecord, error: recordError } = await supabase
          .from("quarterly_records")
          .insert({
            user_id: user.id,
            role_id: activeRole.id,
            quarter_start_date: startDate,
            quarter_end_date: endDate,
          })
          .select()
          .single();

        if (recordError) throw recordError;
        recordId = newRecord.id;
        setRecord({ id: newRecord.id, status: "draft", summary: null });
      }

      // Insert suggested patterns
      const newPatterns: Pattern[] = [];

      for (const suggestion of suggestedPatterns) {
        const { data: patternData, error: patternError } = await supabase
          .from("quarterly_patterns")
          .insert({
            user_id: user.id,
            record_id: recordId,
            category: suggestion.category,
            title: suggestion.title,
            description: suggestion.description,
            signal_count: suggestion.signal_count,
            is_confirmed: false,
          })
          .select()
          .single();

        if (patternError) {
          console.error("Error creating pattern:", patternError);
          continue;
        }

        // Link evidence based on related_signals indices
        const relatedIndices = suggestion.related_signals.map((s: string) => parseInt(s) - 1);
        const relatedSignals = relatedIndices
          .filter((i: number) => i >= 0 && i < signals.length)
          .map((i: number) => signals[i]);

        for (const signal of relatedSignals) {
          await supabase.from("pattern_evidence").insert({
            user_id: user.id,
            pattern_id: patternData.id,
            signal_id: signal.id,
          });
        }

        newPatterns.push({
          id: patternData.id,
          category: suggestion.category as PatternCategory,
          title: suggestion.title,
          description: suggestion.description,
          signal_count: suggestion.signal_count,
          is_confirmed: false,
          evidence: relatedSignals,
        });
      }

      setPatterns((prev) => [...prev, ...newPatterns]);

      toast({
        title: "Patterns identified",
        description: `Found ${newPatterns.length} potential patterns in your work.`,
      });
    } catch (error) {
      console.error("Error analyzing patterns:", error);
      toast({
        title: "Analysis failed",
        description: error instanceof Error ? error.message : "Failed to analyze patterns.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConfirmPattern = async (patternId: string) => {
    try {
      const { error } = await supabase
        .from("quarterly_patterns")
        .update({ is_confirmed: true })
        .eq("id", patternId);

      if (error) throw error;

      setPatterns((prev) =>
        prev.map((p) => (p.id === patternId ? { ...p, is_confirmed: true } : p))
      );
    } catch (error) {
      console.error("Error confirming pattern:", error);
      toast({
        title: "Error",
        description: "Failed to confirm pattern.",
        variant: "destructive",
      });
    }
  };

  const handleRejectPattern = async (patternId: string) => {
    try {
      const { error } = await supabase
        .from("quarterly_patterns")
        .delete()
        .eq("id", patternId);

      if (error) throw error;

      setPatterns((prev) => prev.filter((p) => p.id !== patternId));
    } catch (error) {
      console.error("Error rejecting pattern:", error);
      toast({
        title: "Error",
        description: "Failed to remove pattern.",
        variant: "destructive",
      });
    }
  };

  const handleFinalize = async () => {
    if (!record) return;

    setIsSaving(true);

    try {
      const { error } = await supabase
        .from("quarterly_records")
        .update({
          status: "finalized",
          finalized_at: new Date().toISOString(),
        })
        .eq("id", record.id);

      if (error) throw error;

      setRecord({ ...record, status: "finalized" });
      setIsSaved(true);

      toast({
        title: "Quarter finalized",
        description: "Your quarterly record has been locked and saved.",
      });

      setTimeout(() => setIsSaved(false), 3000);
    } catch (error) {
      console.error("Error finalizing quarter:", error);
      toast({
        title: "Error",
        description: "Failed to finalize quarter.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };


  const confirmedCount = patterns.filter((p) => p.is_confirmed).length;
  const isFinalized = record?.status === "finalized";

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

  const finalizeButton = !isFinalized && confirmedCount > 0 ? (
    <Button
      variant={isSaved ? "outline" : "hero"}
      onClick={handleFinalize}
      disabled={isSaving}
      className="min-w-[100px]"
    >
      {isSaving ? (
        <span className="animate-pulse">Finalizing...</span>
      ) : isSaved ? (
        <>
          <CheckCircle size={18} />
          Finalized
        </>
      ) : (
        <>
          <Lock size={18} />
          Finalize
        </>
      )}
    </Button>
  ) : null;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <StickyRoleSelector />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div
          className="flex items-start justify-between mb-8 opacity-0 animate-fade-up"
          style={{ animationDelay: "100ms", animationFillMode: "forwards" }}
        >
          <div>
            <div className="flex items-center gap-3 text-muted-foreground mb-2">
              <Layers size={18} className="text-primary" />
              <span className="text-sm font-medium uppercase tracking-wider">
                Quarterly Distillation
              </span>
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-bold mb-4">
              Patterns & Trajectory
            </h1>
            <p className="text-muted-foreground max-w-2xl">
              Surface recurring signals, shifts in focus, and emerging themes from your weekly
              highlights. Confirm the patterns that best represent your work this quarter.
            </p>
          </div>
          {finalizeButton}
        </div>

        {/* Quarter Selector */}
        <div
          className="flex items-center justify-between mb-6 opacity-0 animate-fade-up"
          style={{ animationDelay: "150ms", animationFillMode: "forwards" }}
        >
          <QuarterSelector quarterStart={quarterStart} onChange={setQuarterStart} />

          {isFinalized && (
            <span className="flex items-center gap-2 text-sm text-primary">
              <Lock size={14} />
              Finalized
            </span>
          )}
        </div>

        {/* No Role Warning */}
        {!activeRole && (
          <div className="p-6 rounded-2xl bg-secondary/30 border border-border/50 text-center mb-8">
            <p className="text-muted-foreground">
              Select a role to view quarterly patterns.
            </p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && activeRole && (
          <div className="text-center py-12">
            <div className="animate-pulse text-muted-foreground">Loading data...</div>
          </div>
        )}

        {/* Main Content */}
        {!isLoading && activeRole && (
          <div
            className="space-y-6 opacity-0 animate-fade-up"
            style={{ animationDelay: "200ms", animationFillMode: "forwards" }}
          >
            {/* Signals summary */}
            <div className="p-4 rounded-xl bg-secondary/30 border border-border/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Weekly signals this quarter
                  </p>
                  <p className="text-2xl font-serif font-bold text-foreground">
                    {signals.length}
                  </p>
                </div>

                {signals.length > 0 && !isFinalized && (
                  <Button
                    onClick={analyzePatterns}
                    disabled={isAnalyzing}
                    className="gap-2"
                  >
                    <Sparkles size={16} />
                    {isAnalyzing ? "Analyzing..." : "Identify Patterns"}
                  </Button>
                )}
              </div>
            </div>

            {/* No signals message */}
            {signals.length === 0 && (
              <div className="text-center py-12 rounded-2xl bg-secondary/20 border border-border/30">
                <AlertCircle className="mx-auto mb-4 text-muted-foreground" size={32} />
                <p className="text-muted-foreground mb-2">
                  No weekly signals found for this quarter.
                </p>
                <p className="text-sm text-muted-foreground">
                  Complete weekly reflections to surface patterns here.
                </p>
                <Link to="/weekly">
                  <Button variant="link" className="mt-2">
                    Go to Weekly Reflection →
                  </Button>
                </Link>
              </div>
            )}

            {/* Patterns list */}
            {patterns.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-serif text-xl font-semibold">
                    Identified Patterns
                  </h2>
                  {confirmedCount > 0 && (
                    <span className="text-sm text-muted-foreground">
                      <span className="text-foreground font-medium">{confirmedCount}</span> confirmed
                    </span>
                  )}
                </div>

                {patterns.map((pattern) => (
                  <PatternCard
                    key={pattern.id}
                    id={pattern.id}
                    category={pattern.category}
                    title={pattern.title}
                    description={pattern.description}
                    signalCount={pattern.signal_count}
                    isConfirmed={pattern.is_confirmed}
                    evidence={pattern.evidence}
                    onConfirm={() => handleConfirmPattern(pattern.id)}
                    onReject={() => handleRejectPattern(pattern.id)}
                  />
                ))}
              </div>
            )}

            {/* Empty patterns state after analysis */}
            {signals.length > 0 && patterns.length === 0 && !isAnalyzing && (
              <div className="text-center py-8 rounded-2xl bg-secondary/20 border border-border/30">
                <Sparkles className="mx-auto mb-4 text-primary" size={32} />
                <p className="text-muted-foreground">
                  Click "Identify Patterns" to surface themes from your weekly signals.
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default QuarterlyDistillation;
