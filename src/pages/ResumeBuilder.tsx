import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Save, Loader2 } from "lucide-react";
import { ResumeRoleSelector } from "@/components/resume/ResumeRoleSelector";
import { ResumeContentEditor } from "@/components/resume/ResumeContentEditor";
import { ResumeProofSelector } from "@/components/resume/ResumeProofSelector";
import { ResumePublishSettings } from "@/components/resume/ResumePublishSettings";

interface Role {
  id: string;
  title: string;
  company: string | null;
  start_date: string | null;
  end_date: string | null;
  description: string | null;
  is_active: boolean;
}

interface Pattern {
  id: string;
  title: string;
  description: string;
  category: string;
  signal_count: number;
  role_id: string;
}

interface Bullet {
  id?: string;
  text: string;
  sourcePatternId: string | null;
  isVisible: boolean;
  displayOrder: number;
}

interface RoleBullets {
  roleId: string;
  bullets: Bullet[];
}

export interface ResumeData {
  id?: string;
  title: string;
  summary: string;
  selectedRoleIds: string[];
  roleBullets: RoleBullets[];
  approvedProofIds: { proofLinkIds: string[]; entryImageIds: string[] };
  isPublic: boolean;
  publicSlug: string;
  contactName: string;
  contactEmail: string;
  contactLinkedin: string;
}

const STEPS = [
  { id: 1, title: "Select Roles", description: "Choose which roles to include" },
  { id: 2, title: "Generate Content", description: "AI-powered bullet points" },
  { id: 3, title: "Select Proofs", description: "Choose evidence to share" },
  { id: 4, title: "Publish", description: "Finalize and share" },
];

const ResumeBuilder = () => {
  const { user } = useAuth();
  const { tier } = useSubscription();
  const navigate = useNavigate();
  const { id: resumeId } = useParams();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  
  const [resumeData, setResumeData] = useState<ResumeData>({
    title: "My Resume",
    summary: "",
    selectedRoleIds: [],
    roleBullets: [],
    approvedProofIds: { proofLinkIds: [], entryImageIds: [] },
    isPublic: false,
    publicSlug: "",
    contactName: "",
    contactEmail: "",
    contactLinkedin: "",
  });

  // Fetch roles and patterns
  useEffect(() => {
    if (!user) return;
    
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch all roles (active and archived)
        const { data: rolesData, error: rolesError } = await supabase
          .from("roles")
          .select("*")
          .eq("user_id", user.id)
          .order("start_date", { ascending: false });
        
        if (rolesError) throw rolesError;
        setRoles(rolesData || []);

        // Fetch confirmed patterns
        const { data: patternsData, error: patternsError } = await supabase
          .from("quarterly_patterns")
          .select(`
            id,
            title,
            description,
            category,
            signal_count,
            record_id,
            quarterly_records!inner(role_id)
          `)
          .eq("user_id", user.id)
          .eq("is_confirmed", true);

        if (patternsError) throw patternsError;
        
        // Map patterns with role_id
        const mappedPatterns = (patternsData || []).map((p: any) => ({
          id: p.id,
          title: p.title,
          description: p.description,
          category: p.category,
          signal_count: p.signal_count,
          role_id: p.quarterly_records?.role_id,
        }));
        setPatterns(mappedPatterns);

        // If editing existing resume, load its data
        if (resumeId) {
          await loadExistingResume(resumeId);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, resumeId]);

  const loadExistingResume = async (id: string) => {
    try {
      const { data: resume, error: resumeError } = await supabase
        .from("resumes")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      
      if (resumeError) throw resumeError;
      if (!resume) {
        toast.error("Resume not found");
        navigate("/resumes");
        return;
      }

      // Fetch resume roles
      const { data: resumeRoles, error: rolesError } = await supabase
        .from("resume_roles")
        .select("role_id, display_order")
        .eq("resume_id", id)
        .order("display_order");

      if (rolesError) throw rolesError;

      // Fetch resume bullets
      const { data: bullets, error: bulletsError } = await supabase
        .from("resume_bullets")
        .select("*")
        .eq("resume_id", id)
        .order("display_order");

      if (bulletsError) throw bulletsError;

      // Fetch approved proofs
      const { data: proofs, error: proofsError } = await supabase
        .from("resume_proofs")
        .select("proof_link_id, entry_image_id")
        .eq("resume_id", id)
        .eq("is_approved", true);

      if (proofsError) throw proofsError;

      // Build role bullets map
      const roleBulletsMap: { [key: string]: Bullet[] } = {};
      (bullets || []).forEach((b: any) => {
        if (!roleBulletsMap[b.role_id]) {
          roleBulletsMap[b.role_id] = [];
        }
        roleBulletsMap[b.role_id].push({
          id: b.id,
          text: b.bullet_text,
          sourcePatternId: b.source_pattern_id,
          isVisible: b.is_visible,
          displayOrder: b.display_order,
        });
      });

      setResumeData({
        id: resume.id,
        title: resume.title,
        summary: resume.summary || "",
        selectedRoleIds: (resumeRoles || []).map((r: any) => r.role_id),
        roleBullets: Object.entries(roleBulletsMap).map(([roleId, bullets]) => ({
          roleId,
          bullets,
        })),
        approvedProofIds: {
          proofLinkIds: (proofs || []).filter((p: any) => p.proof_link_id).map((p: any) => p.proof_link_id),
          entryImageIds: (proofs || []).filter((p: any) => p.entry_image_id).map((p: any) => p.entry_image_id),
        },
        isPublic: resume.is_public,
        publicSlug: resume.public_slug || "",
        contactName: resume.contact_name || "",
        contactEmail: resume.contact_email || "",
        contactLinkedin: resume.contact_linkedin || "",
      });
    } catch (error) {
      console.error("Error loading resume:", error);
      toast.error("Failed to load resume");
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      // Create or update resume
      const resumePayload = {
        user_id: user.id,
        title: resumeData.title,
        summary: resumeData.summary,
        is_public: resumeData.isPublic,
        public_slug: resumeData.publicSlug || null,
        contact_name: resumeData.contactName || null,
        contact_email: resumeData.contactEmail || null,
        contact_linkedin: resumeData.contactLinkedin || null,
      };

      let savedResumeId = resumeData.id;

      if (resumeData.id) {
        const { error } = await supabase
          .from("resumes")
          .update(resumePayload)
          .eq("id", resumeData.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("resumes")
          .insert(resumePayload)
          .select("id")
          .single();
        if (error) throw error;
        savedResumeId = data.id;
        setResumeData(prev => ({ ...prev, id: savedResumeId }));
      }

      // Delete existing related data and re-insert
      await supabase.from("resume_roles").delete().eq("resume_id", savedResumeId);
      await supabase.from("resume_bullets").delete().eq("resume_id", savedResumeId);
      await supabase.from("resume_proofs").delete().eq("resume_id", savedResumeId);

      // Insert resume roles
      if (resumeData.selectedRoleIds.length > 0) {
        const roleInserts = resumeData.selectedRoleIds.map((roleId, index) => ({
          resume_id: savedResumeId,
          role_id: roleId,
          display_order: index,
          user_id: user.id,
        }));
        const { error } = await supabase.from("resume_roles").insert(roleInserts);
        if (error) throw error;
      }

      // Insert resume bullets
      const bulletInserts: any[] = [];
      resumeData.roleBullets.forEach(rb => {
        rb.bullets.forEach((bullet, index) => {
          bulletInserts.push({
            resume_id: savedResumeId,
            role_id: rb.roleId,
            bullet_text: bullet.text,
            source_pattern_id: bullet.sourcePatternId,
            display_order: index,
            is_visible: bullet.isVisible,
            user_id: user.id,
          });
        });
      });
      if (bulletInserts.length > 0) {
        const { error } = await supabase.from("resume_bullets").insert(bulletInserts);
        if (error) throw error;
      }

      // Insert resume proofs
      const proofInserts: any[] = [];
      resumeData.approvedProofIds.proofLinkIds.forEach(proofLinkId => {
        proofInserts.push({
          resume_id: savedResumeId,
          proof_link_id: proofLinkId,
          is_approved: true,
          user_id: user.id,
          role_id: resumeData.selectedRoleIds[0], // Will be fixed in proof selector
        });
      });
      resumeData.approvedProofIds.entryImageIds.forEach(entryImageId => {
        proofInserts.push({
          resume_id: savedResumeId,
          entry_image_id: entryImageId,
          is_approved: true,
          user_id: user.id,
          role_id: resumeData.selectedRoleIds[0], // Will be fixed in proof selector
        });
      });
      if (proofInserts.length > 0) {
        const { error } = await supabase.from("resume_proofs").insert(proofInserts);
        if (error) throw error;
      }

      toast.success("Resume saved successfully");
    } catch (error) {
      console.error("Error saving resume:", error);
      toast.error("Failed to save resume");
    } finally {
      setIsSaving(false);
    }
  };

  const canGoNext = () => {
    switch (currentStep) {
      case 1:
        return resumeData.selectedRoleIds.length > 0;
      case 2:
        return resumeData.roleBullets.some(rb => rb.bullets.length > 0);
      case 3:
        return true; // Proofs are optional
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/resumes")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Resumes
          </Button>
          <h1 className="text-3xl font-bold text-foreground">
            {resumeId ? "Edit Resume" : "Build Your Resume"}
          </h1>
          <p className="text-muted-foreground mt-2">
            Create an AI-powered resume backed by verified achievements
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <Progress value={(currentStep / 4) * 100} className="h-2 mb-4" />
          <div className="flex justify-between">
            {STEPS.map((step) => (
              <div
                key={step.id}
                className={`text-center flex-1 ${
                  step.id === currentStep
                    ? "text-primary"
                    : step.id < currentStep
                    ? "text-muted-foreground"
                    : "text-muted-foreground/50"
                }`}
              >
                <div className="text-sm font-medium">{step.title}</div>
                <div className="text-xs hidden sm:block">{step.description}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{STEPS[currentStep - 1].title}</CardTitle>
            <CardDescription>{STEPS[currentStep - 1].description}</CardDescription>
          </CardHeader>
          <CardContent>
            {currentStep === 1 && (
              <ResumeRoleSelector
                roles={roles}
                patterns={patterns}
                selectedRoleIds={resumeData.selectedRoleIds}
                onSelectionChange={(ids) =>
                  setResumeData((prev) => ({ ...prev, selectedRoleIds: ids }))
                }
              />
            )}
            {currentStep === 2 && (
              <ResumeContentEditor
                roles={roles.filter((r) => resumeData.selectedRoleIds.includes(r.id))}
                patterns={patterns}
                resumeData={resumeData}
                onResumeDataChange={setResumeData}
              />
            )}
            {currentStep === 3 && (
              <ResumeProofSelector
                selectedRoleIds={resumeData.selectedRoleIds}
                approvedProofIds={resumeData.approvedProofIds}
                onApprovedProofsChange={(proofs) =>
                  setResumeData((prev) => ({ ...prev, approvedProofIds: proofs }))
                }
              />
            )}
            {currentStep === 4 && (
              <ResumePublishSettings
                resumeData={resumeData}
                onResumeDataChange={setResumeData}
                tier={tier}
              />
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Draft
            </Button>

            {currentStep < 4 ? (
              <Button onClick={handleNext} disabled={!canGoNext()}>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Finish & Save
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ResumeBuilder;
