import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Globe, Lock, Link, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import type { ResumeData } from "@/pages/ResumeBuilder";

interface ResumePublishSettingsProps {
  resumeData: ResumeData;
  onResumeDataChange: (data: ResumeData) => void;
  tier: "starter" | "chronicler";
}

export const ResumePublishSettings = ({
  resumeData,
  onResumeDataChange,
  tier,
}: ResumePublishSettingsProps) => {
  const [copied, setCopied] = useState(false);
  const canPublish = tier === "chronicler";

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .substring(0, 50);
  };

  const handlePublicToggle = (checked: boolean) => {
    if (!canPublish && checked) {
      toast.error("Upgrade to Chronicler tier to enable public sharing");
      return;
    }
    onResumeDataChange({
      ...resumeData,
      isPublic: checked,
      publicSlug: checked && !resumeData.publicSlug ? generateSlug(resumeData.title) : resumeData.publicSlug,
    });
  };

  const handleSlugChange = (value: string) => {
    const cleanSlug = value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "")
      .substring(0, 50);
    onResumeDataChange({ ...resumeData, publicSlug: cleanSlug });
  };

  const publicUrl = resumeData.publicSlug
    ? `${window.location.origin}/r/${resumeData.publicSlug}`
    : null;

  const copyToClipboard = async () => {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  return (
    <div className="space-y-6">
      {/* Public Toggle */}
      <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-secondary/10">
        <div className="flex items-center gap-3">
          {resumeData.isPublic ? (
            <Globe className="h-5 w-5 text-green-500" />
          ) : (
            <Lock className="h-5 w-5 text-muted-foreground" />
          )}
          <div>
            <h4 className="font-medium">Public Resume</h4>
            <p className="text-sm text-muted-foreground">
              {resumeData.isPublic
                ? "Anyone with the link can view your resume"
                : "Only you can view this resume"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!canPublish && (
            <Badge variant="secondary" className="text-xs">
              Chronicler
            </Badge>
          )}
          <Switch
            checked={resumeData.isPublic}
            onCheckedChange={handlePublicToggle}
            disabled={!canPublish}
          />
        </div>
      </div>

      {!canPublish && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
          <p className="text-sm text-muted-foreground">
            <strong className="text-amber-600 dark:text-amber-400">Upgrade Required:</strong>{" "}
            Public resume sharing is available on the Chronicler tier. Upgrade to share your resume with employers.
          </p>
        </div>
      )}

      {resumeData.isPublic && (
        <>
          {/* Custom URL Slug */}
          <div className="space-y-2">
            <Label htmlFor="slug">Custom URL Slug</Label>
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center">
                <span className="px-3 py-2 bg-muted text-muted-foreground text-sm rounded-l-md border border-r-0 border-border">
                  {window.location.origin}/r/
                </span>
                <Input
                  id="slug"
                  value={resumeData.publicSlug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder="my-resume"
                  className="rounded-l-none"
                />
              </div>
            </div>
            {publicUrl && (
              <div className="flex items-center gap-2 mt-2">
                <Link className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-primary truncate">{publicUrl}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyToClipboard}
                  className="ml-auto"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h4 className="font-medium">Contact Information (Optional)</h4>
            <p className="text-sm text-muted-foreground">
              This information will be displayed on your public resume page.
            </p>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contactName">Name</Label>
                <Input
                  id="contactName"
                  value={resumeData.contactName}
                  onChange={(e) =>
                    onResumeDataChange({ ...resumeData, contactName: e.target.value })
                  }
                  placeholder="Your Name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={resumeData.contactEmail}
                  onChange={(e) =>
                    onResumeDataChange({ ...resumeData, contactEmail: e.target.value })
                  }
                  placeholder="you@example.com"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactLinkedin">LinkedIn URL</Label>
              <Input
                id="contactLinkedin"
                value={resumeData.contactLinkedin}
                onChange={(e) =>
                  onResumeDataChange({ ...resumeData, contactLinkedin: e.target.value })
                }
                placeholder="https://linkedin.com/in/yourprofile"
              />
            </div>
          </div>
        </>
      )}

      {/* Summary Preview */}
      <div className="mt-8 pt-6 border-t border-border">
        <h4 className="font-medium mb-4">Resume Summary</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Status:</span>{" "}
            <Badge variant={resumeData.isPublic ? "default" : "secondary"}>
              {resumeData.isPublic ? "Public" : "Private"}
            </Badge>
          </div>
          <div>
            <span className="text-muted-foreground">Roles:</span>{" "}
            {resumeData.selectedRoleIds.length}
          </div>
          <div>
            <span className="text-muted-foreground">Bullet Points:</span>{" "}
            {resumeData.roleBullets.reduce((acc, rb) => acc + rb.bullets.filter(b => b.isVisible).length, 0)}
          </div>
          <div>
            <span className="text-muted-foreground">Proofs:</span>{" "}
            {resumeData.approvedProofIds.proofLinkIds.length + resumeData.approvedProofIds.entryImageIds.length}
          </div>
        </div>
      </div>
    </div>
  );
};
