import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Sparkles, ChevronDown, GripVertical, Plus, Trash2 } from "lucide-react";
import type { ResumeData } from "@/pages/ResumeBuilder";

interface Role {
  id: string;
  title: string;
  company: string | null;
  start_date: string | null;
  end_date: string | null;
  description: string | null;
}

interface Pattern {
  id: string;
  title: string;
  description: string;
  category: string;
  signal_count: number;
  role_id: string;
}

interface ResumeContentEditorProps {
  roles: Role[];
  patterns: Pattern[];
  resumeData: ResumeData;
  onResumeDataChange: (data: ResumeData) => void;
}

export const ResumeContentEditor = ({
  roles,
  patterns,
  resumeData,
  onResumeDataChange,
}: ResumeContentEditorProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedRoles, setExpandedRoles] = useState<string[]>(roles.map(r => r.id));

  const handleGenerate = async () => {
    if (roles.length === 0) {
      toast.error("Please select at least one role first");
      return;
    }

    setIsGenerating(true);
    try {
      const rolesWithPatterns = roles.map((role) => ({
        role: {
          id: role.id,
          title: role.title,
          company: role.company,
          start_date: role.start_date,
          end_date: role.end_date,
          description: role.description,
        },
        patterns: patterns.filter((p) => p.role_id === role.id),
      }));

      const { data, error } = await supabase.functions.invoke("generate-resume", {
        body: { rolesWithPatterns },
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      // Update resume data with generated content
      const newRoleBullets = (data.roles || []).map((roleData: any) => ({
        roleId: roleData.roleId,
        bullets: (roleData.bullets || []).map((bullet: any, index: number) => ({
          text: bullet.text,
          sourcePatternId: bullet.sourcePatternId || null,
          isVisible: true,
          displayOrder: index,
        })),
      }));

      onResumeDataChange({
        ...resumeData,
        summary: data.summary || resumeData.summary,
        roleBullets: newRoleBullets,
      });

      toast.success("Resume content generated successfully!");
    } catch (error) {
      console.error("Error generating resume:", error);
      toast.error("Failed to generate resume content");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSummaryChange = (value: string) => {
    onResumeDataChange({ ...resumeData, summary: value });
  };

  const handleTitleChange = (value: string) => {
    onResumeDataChange({ ...resumeData, title: value });
  };

  const handleBulletChange = (roleId: string, bulletIndex: number, text: string) => {
    const newRoleBullets = resumeData.roleBullets.map((rb) => {
      if (rb.roleId === roleId) {
        const newBullets = [...rb.bullets];
        newBullets[bulletIndex] = { ...newBullets[bulletIndex], text };
        return { ...rb, bullets: newBullets };
      }
      return rb;
    });
    onResumeDataChange({ ...resumeData, roleBullets: newRoleBullets });
  };

  const handleBulletVisibilityChange = (roleId: string, bulletIndex: number, isVisible: boolean) => {
    const newRoleBullets = resumeData.roleBullets.map((rb) => {
      if (rb.roleId === roleId) {
        const newBullets = [...rb.bullets];
        newBullets[bulletIndex] = { ...newBullets[bulletIndex], isVisible };
        return { ...rb, bullets: newBullets };
      }
      return rb;
    });
    onResumeDataChange({ ...resumeData, roleBullets: newRoleBullets });
  };

  const handleAddBullet = (roleId: string) => {
    const existingRoleBullets = resumeData.roleBullets.find((rb) => rb.roleId === roleId);
    const newBullet = {
      text: "",
      sourcePatternId: null,
      isVisible: true,
      displayOrder: existingRoleBullets ? existingRoleBullets.bullets.length : 0,
    };

    if (existingRoleBullets) {
      const newRoleBullets = resumeData.roleBullets.map((rb) => {
        if (rb.roleId === roleId) {
          return { ...rb, bullets: [...rb.bullets, newBullet] };
        }
        return rb;
      });
      onResumeDataChange({ ...resumeData, roleBullets: newRoleBullets });
    } else {
      onResumeDataChange({
        ...resumeData,
        roleBullets: [...resumeData.roleBullets, { roleId, bullets: [newBullet] }],
      });
    }
  };

  const handleRemoveBullet = (roleId: string, bulletIndex: number) => {
    const newRoleBullets = resumeData.roleBullets.map((rb) => {
      if (rb.roleId === roleId) {
        const newBullets = rb.bullets.filter((_, i) => i !== bulletIndex);
        return { ...rb, bullets: newBullets };
      }
      return rb;
    });
    onResumeDataChange({ ...resumeData, roleBullets: newRoleBullets });
  };

  const getRoleBullets = (roleId: string) => {
    return resumeData.roleBullets.find((rb) => rb.roleId === roleId)?.bullets || [];
  };

  const toggleRoleExpanded = (roleId: string) => {
    setExpandedRoles((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]
    );
  };

  const hasAnyPatterns = patterns.length > 0;

  return (
    <div className="space-y-6">
      {/* Resume Title */}
      <div className="space-y-2">
        <Label htmlFor="title">Resume Title</Label>
        <Input
          id="title"
          value={resumeData.title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="e.g., Software Engineer Resume 2025"
        />
      </div>

      {/* Generate Button */}
      <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg border border-border">
        <div>
          <h4 className="font-medium">AI-Powered Generation</h4>
          <p className="text-sm text-muted-foreground">
            {hasAnyPatterns
              ? "Generate bullet points from your verified achievements"
              : "No verified patterns found. Add patterns in Quarterly Distillation first."}
          </p>
        </div>
        <Button onClick={handleGenerate} disabled={isGenerating || !hasAnyPatterns}>
          {isGenerating ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4 mr-2" />
          )}
          Generate
        </Button>
      </div>

      {/* Professional Summary */}
      <div className="space-y-2">
        <Label htmlFor="summary">Professional Summary</Label>
        <Textarea
          id="summary"
          value={resumeData.summary}
          onChange={(e) => handleSummaryChange(e.target.value)}
          placeholder="A brief professional summary synthesizing your experience..."
          rows={4}
        />
      </div>

      {/* Role Sections */}
      <div className="space-y-4">
        <Label>Experience Bullets</Label>
        {roles.map((role) => {
          const bullets = getRoleBullets(role.id);
          const isExpanded = expandedRoles.includes(role.id);

          return (
            <Collapsible
              key={role.id}
              open={isExpanded}
              onOpenChange={() => toggleRoleExpanded(role.id)}
            >
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-secondary/20 transition-colors py-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-medium">
                        {role.title}
                        {role.company && (
                          <span className="text-muted-foreground font-normal">
                            {" "}at {role.company}
                          </span>
                        )}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {bullets.length} bullet{bullets.length !== 1 ? "s" : ""}
                        </span>
                        <ChevronDown
                          className={`h-4 w-4 transition-transform ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0 space-y-3">
                    {bullets.map((bullet, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <GripVertical className="h-5 w-5 text-muted-foreground/50 mt-2 cursor-move" />
                        <Checkbox
                          checked={bullet.isVisible}
                          onCheckedChange={(checked) =>
                            handleBulletVisibilityChange(role.id, index, !!checked)
                          }
                          className="mt-2.5"
                        />
                        <Textarea
                          value={bullet.text}
                          onChange={(e) =>
                            handleBulletChange(role.id, index, e.target.value)
                          }
                          placeholder="Enter bullet point..."
                          rows={2}
                          className={`flex-1 ${!bullet.isVisible ? "opacity-50" : ""}`}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveBullet(role.id, index)}
                          className="text-destructive hover:text-destructive/80"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddBullet(role.id)}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Bullet
                    </Button>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
};
