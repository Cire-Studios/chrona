import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AppHeader } from "@/components/layout/AppHeader";
import { StickyRoleSelector } from "@/components/roles/StickyRoleSelector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
  CalendarIcon,
  X
} from "lucide-react";
import { format, parseISO, isAfter, isBefore, startOfQuarter } from "date-fns";
import { cn } from "@/lib/utils";

interface Pattern {
  id: string;
  category: string;
  title: string;
  description: string;
  signal_count: number;
  is_confirmed: boolean;
  quarter_start_date?: string;
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
  
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [artifact, setArtifact] = useState<GeneratedArtifact | null>(null);
  const [selectedType, setSelectedType] = useState<ArtifactType>("resume");
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  // Calculate date range label
  const getDateRangeLabel = () => {
    if (!activeRole) return "";
    
    const roleStart = activeRole.start_date ? parseISO(activeRole.start_date) : null;
    const roleEnd = activeRole.end_date ? parseISO(activeRole.end_date) : new Date();
    
    const effectiveStart = startDate || roleStart;
    const effectiveEnd = endDate || roleEnd;
    
    if (effectiveStart && effectiveEnd) {
      return `${format(effectiveStart, "MMM yyyy")} - ${format(effectiveEnd, "MMM yyyy")}`;
    } else if (effectiveStart) {
      return `From ${format(effectiveStart, "MMM yyyy")}`;
    } else if (effectiveEnd) {
      return `Until ${format(effectiveEnd, "MMM yyyy")}`;
    }
    return "All time";
  };

  const loadConfirmedPatterns = useCallback(async () => {
    if (!user || !activeRole) return;

    setIsLoading(true);
    setArtifact(null);

    try {
      // Determine date range - default to role lifespan
      const roleStart = activeRole.start_date ? parseISO(activeRole.start_date) : null;
      const roleEnd = activeRole.end_date ? parseISO(activeRole.end_date) : new Date();
      
      const effectiveStart = startDate || roleStart;
      const effectiveEnd = endDate || roleEnd;

      // Get all quarterly records for this role within the date range
      let query = supabase
        .from("quarterly_records")
        .select("id, quarter_start_date, quarter_end_date")
        .eq("user_id", user.id)
        .eq("role_id", activeRole.id);

      if (effectiveStart) {
        query = query.gte("quarter_start_date", format(startOfQuarter(effectiveStart), "yyyy-MM-dd"));
      }
      if (effectiveEnd) {
        query = query.lte("quarter_start_date", format(effectiveEnd, "yyyy-MM-dd"));
      }

      const { data: records, error: recordsError } = await query;

      if (recordsError) throw recordsError;
      
      if (!records || records.length === 0) {
        setPatterns([]);
        setIsLoading(false);
        return;
      }

      // Get confirmed patterns from all quarters
      const recordIds = records.map(r => r.id);
      const { data: patternsData, error } = await supabase
        .from("quarterly_patterns")
        .select("*, quarterly_records!inner(quarter_start_date)")
        .in("record_id", recordIds)
        .eq("is_confirmed", true)
        .order("created_at");

      if (error) throw error;
      
      // Add quarter info to patterns
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
  }, [user, activeRole, startDate, endDate]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }
    loadConfirmedPatterns();
  }, [authLoading, user, navigate, loadConfirmedPatterns]);

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
            quarter: p.quarter_start_date ? format(parseISO(p.quarter_start_date), "Q'Q' yyyy") : undefined,
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
            {/* Date Range Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Time Period</CardTitle>
                <CardDescription className="text-xs">
                  Defaults to role lifespan. Optionally filter to specific dates.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm">Start Date</Label>
                  <div className="flex gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "flex-1 justify-start text-left font-normal",
                            !startDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? format(startDate, "MMM d, yyyy") : "Role start"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={setStartDate}
                          defaultMonth={startDate || (activeRole.start_date ? parseISO(activeRole.start_date) : undefined)}
                          disabled={(date) => 
                            (endDate ? isAfter(date, endDate) : false) ||
                            isAfter(date, new Date())
                          }
                        />
                      </PopoverContent>
                    </Popover>
                    {startDate && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setStartDate(undefined)}
                        className="shrink-0"
                      >
                        <X size={16} />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">End Date</Label>
                  <div className="flex gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "flex-1 justify-start text-left font-normal",
                            !endDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? format(endDate, "MMM d, yyyy") : "Present"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                          defaultMonth={endDate}
                          disabled={(date) => 
                            (startDate ? isBefore(date, startDate) : false) ||
                            isAfter(date, new Date())
                          }
                        />
                      </PopoverContent>
                    </Popover>
                    {endDate && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEndDate(undefined)}
                        className="shrink-0"
                      >
                        <X size={16} />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="pt-2 text-xs text-muted-foreground">
                  Using: {getDateRangeLabel()}
                </div>
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