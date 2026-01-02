import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AppHeader } from "@/components/layout/AppHeader";
import { StickyRoleSelector } from "@/components/roles/StickyRoleSelector";
import { QuarterSelector } from "@/components/quarterly/QuarterSelector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  AlertCircle
} from "lucide-react";
import { startOfQuarter, endOfQuarter, format, subQuarters } from "date-fns";

interface Pattern {
  id: string;
  category: string;
  title: string;
  description: string;
  signal_count: number;
  is_confirmed: boolean;
}

interface STARStory {
  title: string;
  situation: string;
  task: string;
  action: string;
  result: string;
}

interface Artifacts {
  resumeBullets: string[];
  selfReview: string;
  starStories: STARStory[];
}

const Artifacts = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { activeRole, loading: rolesLoading } = useRoles();
  
  const [quarterStart, setQuarterStart] = useState(() => 
    startOfQuarter(subQuarters(new Date(), 1))
  );
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [artifacts, setArtifacts] = useState<Artifacts | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const quarterEnd = endOfQuarter(quarterStart);
  const quarterLabel = `Q${Math.ceil((quarterStart.getMonth() + 1) / 3)} ${quarterStart.getFullYear()}`;

  const loadConfirmedPatterns = useCallback(async () => {
    if (!user || !activeRole) return;

    setIsLoading(true);
    setArtifacts(null);

    try {
      // Get the quarterly record for this quarter
      const { data: record } = await supabase
        .from("quarterly_records")
        .select("id, status")
        .eq("user_id", user.id)
        .eq("role_id", activeRole.id)
        .eq("quarter_start_date", format(quarterStart, "yyyy-MM-dd"))
        .maybeSingle();

      if (!record) {
        setPatterns([]);
        setIsLoading(false);
        return;
      }

      // Get confirmed patterns
      const { data: patternsData, error } = await supabase
        .from("quarterly_patterns")
        .select("*")
        .eq("record_id", record.id)
        .eq("is_confirmed", true)
        .order("created_at");

      if (error) throw error;
      setPatterns(patternsData || []);
    } catch (error) {
      console.error("Error loading patterns:", error);
      toast.error("Failed to load patterns");
    } finally {
      setIsLoading(false);
    }
  }, [user, activeRole, quarterStart]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }
    loadConfirmedPatterns();
  }, [authLoading, user, navigate, loadConfirmedPatterns]);

  const handleGenerateArtifacts = async () => {
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
          })),
          roleTitle: activeRole.title,
          company: activeRole.company,
          quarterLabel,
        },
      });

      if (error) throw error;
      
      if (data.error) {
        toast.error(data.error);
        return;
      }

      setArtifacts(data.artifacts);
      toast.success("Artifacts generated successfully!");
    } catch (error) {
      console.error("Error generating artifacts:", error);
      toast.error("Failed to generate artifacts");
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Career Artifacts</h1>
            <p className="text-muted-foreground mt-1">
              Generate resume bullets, self-reviews, and STAR stories from your patterns
            </p>
          </div>
          <QuarterSelector
            quarterStart={quarterStart}
            onChange={setQuarterStart}
          />
        </div>

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
          <div className="space-y-6">
            {/* Patterns Summary */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">
                  {patterns.length} Confirmed Pattern{patterns.length !== 1 ? "s" : ""} for {quarterLabel}
                </CardTitle>
                <CardDescription>
                  These patterns will be used to generate your career artifacts
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
                
                {!artifacts && (
                  <Button
                    className="mt-4 gap-2"
                    onClick={handleGenerateArtifacts}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="animate-spin" size={16} />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} />
                        Generate Artifacts
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Generated Artifacts */}
            {artifacts && (
              <Tabs defaultValue="resume" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="resume" className="gap-2">
                    <FileText size={16} />
                    <span className="hidden sm:inline">Resume Bullets</span>
                    <span className="sm:hidden">Resume</span>
                  </TabsTrigger>
                  <TabsTrigger value="review" className="gap-2">
                    <MessageSquare size={16} />
                    <span className="hidden sm:inline">Self-Review</span>
                    <span className="sm:hidden">Review</span>
                  </TabsTrigger>
                  <TabsTrigger value="star" className="gap-2">
                    <Target size={16} />
                    <span className="hidden sm:inline">STAR Stories</span>
                    <span className="sm:hidden">STAR</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="resume">
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
                          text={artifacts.resumeBullets.map(b => `• ${b}`).join("\n")}
                          itemId="all-bullets"
                        />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {artifacts.resumeBullets.map((bullet, index) => (
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
                </TabsContent>

                <TabsContent value="review">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Self-Review Draft</CardTitle>
                          <CardDescription>
                            Performance review self-assessment
                          </CardDescription>
                        </div>
                        <CopyButton text={artifacts.selfReview} itemId="self-review" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">
                          {artifacts.selfReview}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="star">
                  <div className="space-y-4">
                    {artifacts.starStories.map((story, index) => (
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
                </TabsContent>
              </Tabs>
            )}

            {/* Regenerate Button */}
            {artifacts && (
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={handleGenerateArtifacts}
                  disabled={isGenerating}
                  className="gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      Regenerating...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      Regenerate Artifacts
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Artifacts;