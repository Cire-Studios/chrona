import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { format } from "date-fns";
import { Mail, Linkedin, ChevronDown, ExternalLink, Image, Loader2 } from "lucide-react";

const PublicResume = () => {
  const { slug } = useParams<{ slug: string }>();
  const [resume, setResume] = useState<any>(null);
  const [roles, setRoles] = useState<any[]>([]);
  const [bullets, setBullets] = useState<any[]>([]);
  const [proofs, setProofs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    fetchResume();
  }, [slug]);

  const fetchResume = async () => {
    try {
      const { data: resumeData, error: resumeError } = await supabase
        .from("resumes")
        .select("*")
        .eq("public_slug", slug)
        .eq("is_public", true)
        .maybeSingle();

      if (resumeError) throw resumeError;
      if (!resumeData) {
        setError("Resume not found");
        setIsLoading(false);
        return;
      }
      setResume(resumeData);

      const { data: rolesData } = await supabase
        .from("resume_roles")
        .select("*, roles(*)")
        .eq("resume_id", resumeData.id)
        .order("display_order");
      setRoles(rolesData || []);

      const { data: bulletsData } = await supabase
        .from("resume_bullets")
        .select("*")
        .eq("resume_id", resumeData.id)
        .eq("is_visible", true)
        .order("display_order");
      setBullets(bulletsData || []);

      const { data: proofsData } = await supabase
        .from("resume_proofs")
        .select("*, proof_links(*), entry_images(*)")
        .eq("resume_id", resumeData.id)
        .eq("is_approved", true);
      setProofs(proofsData || []);
    } catch (err) {
      setError("Failed to load resume");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !resume) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">{error || "Resume not found"}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-12 print:py-0">
        {/* Header */}
        <header className="mb-8 text-center">
          {resume.contact_name && <h1 className="text-4xl font-bold mb-2">{resume.contact_name}</h1>}
          <div className="flex items-center justify-center gap-4 text-muted-foreground">
            {resume.contact_email && (
              <a href={`mailto:${resume.contact_email}`} className="flex items-center gap-1 hover:text-primary">
                <Mail className="h-4 w-4" />{resume.contact_email}
              </a>
            )}
            {resume.contact_linkedin && (
              <a href={resume.contact_linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary">
                <Linkedin className="h-4 w-4" />LinkedIn
              </a>
            )}
          </div>
        </header>

        {/* Summary */}
        {resume.summary && (
          <section className="mb-8">
            <h2 className="text-xl font-semibold border-b pb-2 mb-4">Professional Summary</h2>
            <p className="text-muted-foreground">{resume.summary}</p>
          </section>
        )}

        {/* Experience */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold border-b pb-2 mb-4">Experience</h2>
          <div className="space-y-6">
            {roles.map((roleEntry) => {
              const role = roleEntry.roles;
              const roleBullets = bullets.filter((b) => b.role_id === role.id);
              const roleProofs = proofs.filter((p) => p.role_id === role.id);

              return (
                <div key={roleEntry.id}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-lg">{role.title}</h3>
                      {role.company && <p className="text-muted-foreground">{role.company}</p>}
                    </div>
                    {role.start_date && (
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(role.start_date), "MMM yyyy")} - {role.end_date ? format(new Date(role.end_date), "MMM yyyy") : "Present"}
                      </span>
                    )}
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                    {roleBullets.map((b) => <li key={b.id}>{b.bullet_text}</li>)}
                  </ul>

                  {roleProofs.length > 0 && (
                    <Collapsible className="mt-3">
                      <CollapsibleTrigger className="flex items-center gap-1 text-sm text-primary hover:underline">
                        <ChevronDown className="h-4 w-4" />View Evidence ({roleProofs.length})
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2 grid gap-2">
                        {roleProofs.map((proof) => (
                          <Card key={proof.id}>
                            <CardContent className="p-3">
                              {proof.proof_links && (
                                <a href={proof.proof_links.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline">
                                  <ExternalLink className="h-4 w-4" />{proof.proof_links.title}
                                  <Badge variant="outline">{proof.proof_links.link_type}</Badge>
                                </a>
                              )}
                              {proof.entry_images && (
                                <div className="flex items-start gap-3">
                                  <Image className="h-4 w-4 mt-1" />
                                  <img src={proof.entry_images.image_url} alt={proof.entry_images.caption || "Evidence"} className="max-w-xs rounded" />
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <footer className="text-center text-xs text-muted-foreground mt-12 print:hidden">
          Created with Chrona
        </footer>
      </div>
    </div>
  );
};

export default PublicResume;
