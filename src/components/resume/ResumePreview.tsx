import { format } from "date-fns";
import { Mail, Linkedin, ExternalLink, Image, Printer, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import type { ResumeData } from "@/pages/ResumeBuilder";

interface Role {
  id: string;
  title: string;
  company: string | null;
  start_date: string | null;
  end_date: string | null;
  description: string | null;
  is_active: boolean;
}

interface Proof {
  id: string;
  type: "link" | "image";
  title?: string;
  url: string;
  linkType?: string;
  caption?: string;
  roleId: string;
}

interface ResumePreviewProps {
  resumeData: ResumeData;
  roles: Role[];
  proofs: Proof[];
  onClose: () => void;
}

export const ResumePreview = ({ resumeData, roles, proofs, onClose }: ResumePreviewProps) => {
  const selectedRoles = roles.filter((r) => resumeData.selectedRoleIds.includes(r.id));

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-auto">
      {/* Toolbar - hidden when printing */}
      <div className="sticky top-0 bg-background/95 backdrop-blur border-b z-10 print:hidden">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <h2 className="font-semibold text-lg">Resume Preview</h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Resume Content */}
      <div className="max-w-3xl mx-auto px-4 py-12 print:py-8 print:px-0">
        {/* Header */}
        <header className="mb-8 text-center">
          {resumeData.contactName && (
            <h1 className="text-4xl font-bold mb-2">{resumeData.contactName}</h1>
          )}
          <div className="flex items-center justify-center gap-4 text-muted-foreground flex-wrap">
            {resumeData.contactEmail && (
              <a
                href={`mailto:${resumeData.contactEmail}`}
                className="flex items-center gap-1 hover:text-primary"
              >
                <Mail className="h-4 w-4" />
                {resumeData.contactEmail}
              </a>
            )}
            {resumeData.contactLinkedin && (
              <a
                href={resumeData.contactLinkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-primary"
              >
                <Linkedin className="h-4 w-4" />
                LinkedIn
              </a>
            )}
          </div>
        </header>

        {/* Summary */}
        {resumeData.summary && (
          <section className="mb-8">
            <h2 className="text-xl font-semibold border-b pb-2 mb-4">Professional Summary</h2>
            <p className="text-muted-foreground">{resumeData.summary}</p>
          </section>
        )}

        {/* Experience */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold border-b pb-2 mb-4">Experience</h2>
          <div className="space-y-6">
            {selectedRoles.map((role) => {
              const roleBulletsData = resumeData.roleBullets.find((rb) => rb.roleId === role.id);
              const visibleBullets = roleBulletsData?.bullets.filter((b) => b.isVisible) || [];
              const roleProofs = proofs.filter((p) => p.roleId === role.id);

              return (
                <div key={role.id}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-lg">{role.title}</h3>
                      {role.company && <p className="text-muted-foreground">{role.company}</p>}
                    </div>
                    {role.start_date && (
                      <span className="text-sm text-muted-foreground whitespace-nowrap">
                        {format(new Date(role.start_date), "MMM yyyy")} -{" "}
                        {role.end_date ? format(new Date(role.end_date), "MMM yyyy") : "Present"}
                      </span>
                    )}
                  </div>
                  {visibleBullets.length > 0 && (
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                      {visibleBullets.map((bullet, idx) => (
                        <li key={bullet.id || idx}>{bullet.text}</li>
                      ))}
                    </ul>
                  )}

                  {roleProofs.length > 0 && (
                    <Collapsible className="mt-3 print:hidden">
                      <CollapsibleTrigger className="flex items-center gap-1 text-sm text-primary hover:underline">
                        <ChevronDown className="h-4 w-4" />
                        View Evidence ({roleProofs.length})
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2 grid gap-2">
                        {roleProofs.map((proof) => (
                          <Card key={proof.id}>
                            <CardContent className="p-3">
                              {proof.type === "link" && (
                                <a
                                  href={proof.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 text-primary hover:underline"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                  {proof.title}
                                  {proof.linkType && <Badge variant="outline">{proof.linkType}</Badge>}
                                </a>
                              )}
                              {proof.type === "image" && (
                                <div className="flex items-start gap-3">
                                  <Image className="h-4 w-4 mt-1 flex-shrink-0" />
                                  <div>
                                    <img
                                      src={proof.url}
                                      alt={proof.caption || "Evidence"}
                                      className="max-w-xs rounded"
                                    />
                                    {proof.caption && (
                                      <p className="text-sm text-muted-foreground mt-1">{proof.caption}</p>
                                    )}
                                  </div>
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

        {/* Public link notice */}
        {resumeData.isPublic && resumeData.publicSlug && (
          <div className="text-center text-sm text-muted-foreground print:hidden">
            <p>
              Public link:{" "}
              <span className="text-primary font-mono">
                {window.location.origin}/r/{resumeData.publicSlug}
              </span>
            </p>
          </div>
        )}

        <footer className="text-center text-xs text-muted-foreground mt-12 print:mt-8">
          Created with Chrona
        </footer>
      </div>
    </div>
  );
};
