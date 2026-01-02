import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AppHeader } from "@/components/layout/AppHeader";
import { StickyRoleSelector } from "@/components/roles/StickyRoleSelector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { TimeWindowSelector } from "@/components/artifacts/TimeWindowSelector";
import { useAuth } from "@/contexts/AuthContext";
import { useRoles } from "@/contexts/RolesContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Sparkles, 
  FileText, 
  MessageSquare, 
  Target, 
  Loader2, 
  Copy, 
  Check,
  AlertCircle,
} from "lucide-react";
import { format, parseISO, startOfQuarter, endOfQuarter } from "date-fns";

interface Pattern {
  id: string;
  category: string;
  title: string;
  description: string;
  signal_count: number;
  is_confirmed: boolean;
  quarter_start_date?: string;
}

interface QuarterRecord {
  id: string;
  quarter_start_date: string;
  quarter_end_date: string;
  pattern_count: number;
}

interface STARStory {
  title: string;
  situation: string;
  task: string;
  action: string;
  result: string;
}

type ArtifactType = "resume" | "self-review" | "star";

interface GeneratedArtifact {
  type: ArtifactType;
  resumeBullets?: string[];
  selfReview?: string;
  starStories?: STARStory[];
}

const Artifacts = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { activeRole, loading: rolesLoading } = useRoles();
  
  const [selectedRange, setSelectedRange] = useState<[Date, Date]>(() => {
    const now = new Date();
    return [startOfQuarter(new Date(now.getFullYear() - 1, 0, 1)), now];
  });
  const [quarterRecords, setQuarterRecords] = useState<QuarterRecord[]>([]);
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [artifact, setArtifact] = useState<GeneratedArtifact | null>(null);
  const [selectedType, setSelectedType] = useState<ArtifactType>("resume");
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  // Get role dates - use created_at as the minimum date for the role's lifespan
  const roleStartDate = activeRole?.created_at ? parseISO(activeRole.created_at) : null;
  const roleEndDate = new Date(); // Always use today as max

  // Initialize range based on role dates
  useEffect(() => {
    if (activeRole) {
      const start = roleStartDate || new Date(new Date().getFullYear() - 1, 0, 1);
      setSelectedRange([startOfQuarter(start), new Date()]);
    }
  }, [activeRole?.id]);

  // Load all quarterly records for the role
  const loadQuarterRecords = useCallback(async () => {
    if (!user || !activeRole) return;

    try {
      // Get all quarterly records with pattern counts
      const { data: records, error } = await supabase
        .from("quarterly_records")
        .select(`
          id,
          quarter_start_date,
          quarter_end_date,
          quarterly_patterns!inner(id)
        `)
        .eq("user_id", user.id)
        .eq("role_id", activeRole.id)
        .eq("quarterly_patterns.is_confirmed", true)
        .order("quarter_start_date", { ascending: true });

      if (error) throw error;

      // Transform to include pattern count
      const recordsWithCounts: QuarterRecord[] = (records || []).map(r => ({
        id: r.id,
        quarter_start_date: r.quarter_start_date,
        quarter_end_date: r.quarter_end_date,
        pattern_count: Array.isArray(r.quarterly_patterns) ? r.quarterly_patterns.length : 0,
      }));

      setQuarterRecords(recordsWithCounts);
    } catch (error) {
      console.error("Error loading quarter records:", error);
    }
  }, [user, activeRole]);

  // Load patterns for selected range
  const loadPatternsForRange = useCallback(async () => {
    if (!user || !activeRole) return;

    setIsLoading(true);
    setArtifact(null);

    try {
      // Get quarterly records in the selected range
      const { data: records, error: recordsError } = await supabase
        .from("quarterly_records")
        .select("id, quarter_start_date")
        .eq("user_id", user.id)
        .eq("role_id", activeRole.id)
        .gte("quarter_start_date", format(startOfQuarter(selectedRange[0]), "yyyy-MM-dd"))
        .lte("quarter_start_date", format(startOfQuarter(selectedRange[1]), "yyyy-MM-dd"));

      if (recordsError) throw recordsError;
      
      if (!records || records.length === 0) {
        setPatterns([]);
        setIsLoading(false);
        return;
      }

      // Get confirmed patterns from these quarters
      const recordIds = records.map(r => r.id);
      const { data: patternsData, error } = await supabase
        .from("quarterly_patterns")
        .select("*, quarterly_records!inner(quarter_start_date)")
        .in("record_id", recordIds)
        .eq("is_confirmed", true)
        .order("created_at");

      if (error) throw error;
      
      const patternsWithQuarter = (patternsData || []).map(p => ({
        ...p,
        quarter_start_date: p.quarterly_records?.quarter_start_date
      }));
      
      setPatterns(patternsWithQuarter);
    } catch (error) {
      console.error("Error loading patterns:", error);
      toast.error("Failed to load patterns");
    } finally {
      setIsLoading(false);
    }
  }, [user, activeRole, selectedRange]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }
    loadQuarterRecords();
  }, [authLoading, user, navigate, loadQuarterRecords]);

  useEffect(() => {
    loadPatternsForRange();
  }, [loadPatternsForRange]);

  const getDateRangeLabel = () => {
    return `${format(selectedRange[0], "MMM yyyy")} – ${format(selectedRange[1], "MMM yyyy")}`;
  };

  const handleGenerateArtifact = async () => {
    if (!activeRole || patterns.length === 0) return;

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-artifacts", {
        body: {
          patterns: patterns.map(p => ({
            category: p.category,
            title: p.title,
            description: p.description,
            signal_count: p.signal_count,
            quarter: p.quarter_start_date ? format(parseISO(p.quarter_start_date), "'Q'Q yyyy") : undefined,
          })),
          roleTitle: activeRole.title,
          company: activeRole.company,
          dateRange: getDateRangeLabel(),
          artifactType: selectedType,
        },
      });

      if (error) throw error;
      
      if (data.error) {
        toast.error(data.error);
        return;
      }

      setArtifact({
        type: selectedType,
        ...data.artifact,
      });
      toast.success("Artifact generated successfully!");
    } catch (error) {
      console.error("Error generating artifact:", error);
      toast.error("Failed to generate artifact");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (text: string, itemId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItem(itemId);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopiedItem(null), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const CopyButton = ({ text, itemId }: { text: string; itemId: string }) => (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 shrink-0"
      onClick={() => copyToClipboard(text, itemId)}
    >
      {copiedItem === itemId ? (
        <Check size={14} className="text-green-500" />
      ) : (
        <Copy size={14} />
      )}
    </Button>
  );

  const artifactTypeInfo = {
    resume: {
      icon: FileText,
      label: "Resume Bullets",
      description: "Achievement-focused statements for your resume"
    },
    "self-review": {
      icon: MessageSquare,
      label: "Self-Review",
      description: "Performance review self-assessment paragraphs"
    },
    star: {
      icon: Target,
      label: "STAR Stories",
      description: "Behavioral interview stories with Situation, Task, Action, Result"
    }
  };

  if (authLoading || rolesLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin text-muted-foreground" size={32} />
      </div>
    );
  }

  if (!activeRole) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="text-center py-12">
            <AlertCircle className="mx-auto mb-4 text-muted-foreground" size={48} />
            <p className="text-muted-foreground">Please create a role first to generate artifacts.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <StickyRoleSelector />
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Career Artifacts</h1>
          <p className="text-muted-foreground mt-1">
            Generate resume bullets, self-reviews, and STAR stories from your confirmed patterns
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Configuration Panel */}
          <div className="lg:col-span-1 space-y-4">
            {/* Time Window Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Time Period</CardTitle>
                <CardDescription className="text-xs">
                  Select the quarters to include
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TimeWindowSelector
                  roleStartDate={roleStartDate}
                  roleEndDate={roleEndDate}
                  quarterRecords={quarterRecords}
                  selectedRange={selectedRange}
                  onRangeChange={setSelectedRange}
                />
              </CardContent>
            </Card>

            {/* Artifact Type Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Artifact Type</CardTitle>
                <CardDescription className="text-xs">
                  Choose what to generate
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={selectedType}
                  onValueChange={(v) => {
                    setSelectedType(v as ArtifactType);
                    setArtifact(null);
                  }}
                  className="space-y-3"
                >
                  {(Object.entries(artifactTypeInfo) as [ArtifactType, typeof artifactTypeInfo.resume][]).map(([type, info]) => {
                    const Icon = info.icon;
                    return (
                      <div key={type} className="flex items-start space-x-3">
                        <RadioGroupItem value={type} id={type} className="mt-1" />
                        <Label
                          htmlFor={type}
                          className="flex-1 cursor-pointer space-y-1"
                        >
                          <div className="flex items-center gap-2 font-medium">
                            <Icon size={14} />
                            {info.label}
                          </div>
                          <p className="text-xs text-muted-foreground font-normal">
                            {info.description}
                          </p>
                        </Label>
                      </div>
                    );
                  })}
                </RadioGroup>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-muted-foreground" size={32} />
              </div>
            ) : patterns.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <AlertCircle className="mx-auto mb-4 text-muted-foreground" size={48} />
                  <h3 className="text-lg font-medium mb-2">No Confirmed Patterns</h3>
                  <p className="text-muted-foreground mb-4">
                    You need confirmed patterns from the Quarterly page to generate artifacts.
                  </p>
                  <Button onClick={() => navigate("/quarterly")}>
                    Go to Quarterly Distillation
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Patterns Summary */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">
                      {patterns.length} Confirmed Pattern{patterns.length !== 1 ? "s" : ""}
                    </CardTitle>
                    <CardDescription>
                      {getDateRangeLabel()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {patterns.map((pattern) => (
                        <div
                          key={pattern.id}
                          className="px-3 py-1.5 bg-secondary rounded-full text-sm"
                        >
                          {pattern.title}
                        </div>
                      ))}
                    </div>
                    
                    <Button
                      className="mt-4 gap-2"
                      onClick={handleGenerateArtifact}
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="animate-spin" size={16} />
                          Generating {artifactTypeInfo[selectedType].label}...
                        </>
                      ) : (
                        <>
                          <Sparkles size={16} />
                          Generate {artifactTypeInfo[selectedType].label}
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* Generated Artifact */}
                {artifact && artifact.type === "resume" && artifact.resumeBullets && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Resume Bullets</CardTitle>
                          <CardDescription>
                            Achievement-focused statements for your resume
                          </CardDescription>
                        </div>
                        <CopyButton
                          text={artifact.resumeBullets.map(b => `• ${b}`).join("\n")}
                          itemId="all-bullets"
                        />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {artifact.resumeBullets.map((bullet, index) => (
                          <li
                            key={index}
                            className="flex items-start gap-3 p-3 bg-secondary/50 rounded-lg"
                          >
                            <span className="flex-1 text-sm">{bullet}</span>
                            <CopyButton text={bullet} itemId={`bullet-${index}`} />
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {artifact && artifact.type === "self-review" && artifact.selfReview && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Self-Review Draft</CardTitle>
                          <CardDescription>
                            Performance review self-assessment
                          </CardDescription>
                        </div>
                        <CopyButton text={artifact.selfReview} itemId="self-review" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">
                          {artifact.selfReview}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {artifact && artifact.type === "star" && artifact.starStories && (
                  <div className="space-y-4">
                    {artifact.starStories.map((story, index) => (
                      <Card key={index}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{story.title}</CardTitle>
                            <CopyButton
                              text={`${story.title}\n\nSituation: ${story.situation}\n\nTask: ${story.task}\n\nAction: ${story.action}\n\nResult: ${story.result}`}
                              itemId={`star-${index}`}
                            />
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <h4 className="text-sm font-semibold text-primary mb-1">
                              Situation
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {story.situation}
                            </p>
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-primary mb-1">
                              Task
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {story.task}
                            </p>
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-primary mb-1">
                              Action
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {story.action}
                            </p>
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-primary mb-1">
                              Result
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {story.result}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Artifacts;