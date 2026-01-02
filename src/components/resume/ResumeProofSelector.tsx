import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { ChevronDown, Link as LinkIcon, Image, FileText, ExternalLink, Loader2 } from "lucide-react";

interface ProofLink {
  id: string;
  url: string;
  title: string;
  link_type: string;
  entry_id: string;
  entry_date?: string;
  role_id?: string;
}

interface EntryImage {
  id: string;
  image_url: string;
  caption: string | null;
  entry_id: string;
  entry_date?: string;
  role_id?: string;
}

interface ResumeProofSelectorProps {
  selectedRoleIds: string[];
  approvedProofIds: { proofLinkIds: string[]; entryImageIds: string[] };
  onApprovedProofsChange: (proofs: { proofLinkIds: string[]; entryImageIds: string[] }) => void;
}

export const ResumeProofSelector = ({
  selectedRoleIds,
  approvedProofIds,
  onApprovedProofsChange,
}: ResumeProofSelectorProps) => {
  const { user } = useAuth();
  const [proofLinks, setProofLinks] = useState<ProofLink[]>([]);
  const [entryImages, setEntryImages] = useState<EntryImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedRoles, setExpandedRoles] = useState<string[]>(selectedRoleIds);

  useEffect(() => {
    const fetchProofs = async () => {
      if (!user || selectedRoleIds.length === 0) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch proof links with entry info
        const { data: linksData, error: linksError } = await supabase
          .from("proof_links")
          .select(`
            id,
            url,
            title,
            link_type,
            entry_id,
            journal_entries!inner(entry_date, role_id)
          `)
          .eq("user_id", user.id)
          .in("journal_entries.role_id", selectedRoleIds);

        if (linksError) throw linksError;

        const mappedLinks = (linksData || []).map((link: any) => ({
          id: link.id,
          url: link.url,
          title: link.title,
          link_type: link.link_type,
          entry_id: link.entry_id,
          entry_date: link.journal_entries?.entry_date,
          role_id: link.journal_entries?.role_id,
        }));
        setProofLinks(mappedLinks);

        // Fetch entry images with entry info
        const { data: imagesData, error: imagesError } = await supabase
          .from("entry_images")
          .select(`
            id,
            image_url,
            caption,
            entry_id,
            journal_entries!inner(entry_date, role_id)
          `)
          .eq("user_id", user.id)
          .in("journal_entries.role_id", selectedRoleIds);

        if (imagesError) throw imagesError;

        const mappedImages = (imagesData || []).map((img: any) => ({
          id: img.id,
          image_url: img.image_url,
          caption: img.caption,
          entry_id: img.entry_id,
          entry_date: img.journal_entries?.entry_date,
          role_id: img.journal_entries?.role_id,
        }));
        setEntryImages(mappedImages);
      } catch (error) {
        console.error("Error fetching proofs:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProofs();
  }, [user, selectedRoleIds]);

  const toggleProofLink = (proofLinkId: string) => {
    const newIds = approvedProofIds.proofLinkIds.includes(proofLinkId)
      ? approvedProofIds.proofLinkIds.filter((id) => id !== proofLinkId)
      : [...approvedProofIds.proofLinkIds, proofLinkId];
    onApprovedProofsChange({ ...approvedProofIds, proofLinkIds: newIds });
  };

  const toggleEntryImage = (entryImageId: string) => {
    const newIds = approvedProofIds.entryImageIds.includes(entryImageId)
      ? approvedProofIds.entryImageIds.filter((id) => id !== entryImageId)
      : [...approvedProofIds.entryImageIds, entryImageId];
    onApprovedProofsChange({ ...approvedProofIds, entryImageIds: newIds });
  };

  const toggleRoleExpanded = (roleId: string) => {
    setExpandedRoles((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]
    );
  };

  const getProofsForRole = (roleId: string) => {
    return {
      links: proofLinks.filter((l) => l.role_id === roleId),
      images: entryImages.filter((i) => i.role_id === roleId),
    };
  };

  const getLinkTypeIcon = (linkType: string) => {
    switch (linkType.toLowerCase()) {
      case "github":
      case "gitlab":
      case "code":
        return <FileText className="h-4 w-4" />;
      case "image":
        return <Image className="h-4 w-4" />;
      default:
        return <LinkIcon className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const hasAnyProofs = proofLinks.length > 0 || entryImages.length > 0;
  const totalSelected = approvedProofIds.proofLinkIds.length + approvedProofIds.entryImageIds.length;

  return (
    <div className="space-y-6">
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
        <h4 className="font-medium text-amber-600 dark:text-amber-400 mb-1">
          Share Your Evidence
        </h4>
        <p className="text-sm text-muted-foreground">
          Selected proofs will be visible on your public resume page. Employers can view these to verify your achievements.
        </p>
      </div>

      {!hasAnyProofs ? (
        <div className="text-center py-8 text-muted-foreground">
          <Image className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No proofs found for the selected roles.</p>
          <p className="text-sm">Add images or links to your journal entries to share evidence.</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {totalSelected} proof{totalSelected !== 1 ? "s" : ""} selected for sharing
            </p>
            <button
              onClick={() => {
                if (totalSelected === proofLinks.length + entryImages.length) {
                  onApprovedProofsChange({ proofLinkIds: [], entryImageIds: [] });
                } else {
                  onApprovedProofsChange({
                    proofLinkIds: proofLinks.map((l) => l.id),
                    entryImageIds: entryImages.map((i) => i.id),
                  });
                }
              }}
              className="text-sm text-primary hover:underline"
            >
              {totalSelected === proofLinks.length + entryImages.length ? "Deselect All" : "Select All"}
            </button>
          </div>

          <div className="space-y-4">
            {selectedRoleIds.map((roleId) => {
              const { links, images } = getProofsForRole(roleId);
              const proofCount = links.length + images.length;
              const isExpanded = expandedRoles.includes(roleId);

              if (proofCount === 0) return null;

              return (
                <Collapsible
                  key={roleId}
                  open={isExpanded}
                  onOpenChange={() => toggleRoleExpanded(roleId)}
                >
                  <Card>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-secondary/20 transition-colors py-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base font-medium">
                            {proofCount} proof{proofCount !== 1 ? "s" : ""} available
                          </CardTitle>
                          <ChevronDown
                            className={`h-4 w-4 transition-transform ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                          />
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0 space-y-3">
                        {/* Proof Links */}
                        {links.map((link) => (
                          <div
                            key={link.id}
                            className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-secondary/10 transition-colors"
                          >
                            <Checkbox
                              checked={approvedProofIds.proofLinkIds.includes(link.id)}
                              onCheckedChange={() => toggleProofLink(link.id)}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                {getLinkTypeIcon(link.link_type)}
                                <span className="font-medium truncate">{link.title}</span>
                                <Badge variant="outline" className="text-xs">
                                  {link.link_type}
                                </Badge>
                              </div>
                              <a
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline flex items-center gap-1 mt-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {link.url.length > 50 ? link.url.substring(0, 50) + "..." : link.url}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                              {link.entry_date && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  From entry on {format(new Date(link.entry_date), "MMM d, yyyy")}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}

                        {/* Entry Images */}
                        {images.map((image) => (
                          <div
                            key={image.id}
                            className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-secondary/10 transition-colors"
                          >
                            <Checkbox
                              checked={approvedProofIds.entryImageIds.includes(image.id)}
                              onCheckedChange={() => toggleEntryImage(image.id)}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start gap-3">
                                <img
                                  src={image.image_url}
                                  alt={image.caption || "Evidence image"}
                                  className="w-20 h-20 object-cover rounded-md"
                                />
                                <div>
                                  <div className="flex items-center gap-2">
                                    <Image className="h-4 w-4" />
                                    <span className="font-medium">
                                      {image.caption || "Image evidence"}
                                    </span>
                                  </div>
                                  {image.entry_date && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      From entry on {format(new Date(image.entry_date), "MMM d, yyyy")}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
