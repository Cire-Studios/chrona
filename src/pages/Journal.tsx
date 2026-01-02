import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { JournalEntryForm } from "@/components/journal/JournalEntryForm";
import { PastEntriesList } from "@/components/journal/PastEntriesList";
import { AppHeader } from "@/components/layout/AppHeader";
import { Calendar, Save, CheckCircle, History, PenLine } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useRoles } from "@/contexts/RolesContext";
import { supabase } from "@/integrations/supabase/client";

export interface JournalEntryData {
  accomplishments: string;
  decisions: string;
  challenges: string;
  learnings: string;
  proofLinks: ProofLinkData[];
  images: ImageFileData[];
}

export interface ProofLinkData {
  id: string;
  type: "github" | "jira" | "confluence" | "slack" | "other";
  url: string;
  title: string;
}

export interface ImageFileData {
  id: string;
  file?: File;
  preview: string;
  caption: string;
  imageUrl?: string;
}

const Journal = () => {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { activeRole, loading: rolesLoading } = useRoles();
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [entryData, setEntryData] = useState<JournalEntryData>({
    accomplishments: "",
    decisions: "",
    challenges: "",
    learnings: "",
    proofLinks: [],
    images: [],
  });
  const [existingEntryId, setExistingEntryId] = useState<string | null>(null);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const todayDate = new Date().toISOString().split("T")[0];

  // Load existing entry for today when role changes
  useEffect(() => {
    const loadExistingEntry = async () => {
      if (!user || !activeRole) return;

      try {
        const { data: entry, error } = await supabase
          .from("journal_entries")
          .select("*")
          .eq("role_id", activeRole.id)
          .eq("entry_date", todayDate)
          .maybeSingle();

        if (error) throw error;

        if (entry) {
          setExistingEntryId(entry.id);
          setEntryData({
            accomplishments: entry.accomplishments || "",
            decisions: entry.decisions || "",
            challenges: entry.challenges || "",
            learnings: entry.learnings || "",
            proofLinks: [],
            images: [],
          });

          // Load proof links
          const { data: links } = await supabase
            .from("proof_links")
            .select("*")
            .eq("entry_id", entry.id);

          if (links) {
            setEntryData((prev) => ({
              ...prev,
              proofLinks: links.map((l) => ({
                id: l.id,
                type: l.link_type as ProofLinkData["type"],
                url: l.url,
                title: l.title,
              })),
            }));
          }

          // Load images
          const { data: images } = await supabase
            .from("entry_images")
            .select("*")
            .eq("entry_id", entry.id);

          if (images) {
            setEntryData((prev) => ({
              ...prev,
              images: images.map((img) => ({
                id: img.id,
                preview: img.image_url,
                caption: img.caption || "",
                imageUrl: img.image_url,
              })),
            }));
          }
        } else {
          // Reset form for new entry
          setExistingEntryId(null);
          setEntryData({
            accomplishments: "",
            decisions: "",
            challenges: "",
            learnings: "",
            proofLinks: [],
            images: [],
          });
        }
      } catch (error) {
        console.error("Error loading entry:", error);
      }
    };

    loadExistingEntry();
  }, [user, activeRole, todayDate]);

  const uploadImage = async (file: File, entryId: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `${user!.id}/${entryId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("entry-images")
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from("entry-images")
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSave = async () => {
    if (!user || !activeRole) {
      toast({
        title: "Error",
        description: "Please select a role before saving.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      let entryId = existingEntryId;

      if (existingEntryId) {
        // Update existing entry
        const { error } = await supabase
          .from("journal_entries")
          .update({
            accomplishments: entryData.accomplishments,
            decisions: entryData.decisions,
            challenges: entryData.challenges,
            learnings: entryData.learnings,
          })
          .eq("id", existingEntryId);

        if (error) throw error;
      } else {
        // Create new entry
        const { data, error } = await supabase
          .from("journal_entries")
          .insert({
            user_id: user.id,
            role_id: activeRole.id,
            entry_date: todayDate,
            accomplishments: entryData.accomplishments,
            decisions: entryData.decisions,
            challenges: entryData.challenges,
            learnings: entryData.learnings,
          })
          .select()
          .single();

        if (error) throw error;
        entryId = data.id;
        setExistingEntryId(data.id);
      }

      // Handle proof links - delete old ones and insert new
      if (entryId) {
        await supabase.from("proof_links").delete().eq("entry_id", entryId);

        if (entryData.proofLinks.length > 0) {
          const { error: linksError } = await supabase.from("proof_links").insert(
            entryData.proofLinks.map((link) => ({
              entry_id: entryId,
              user_id: user.id,
              link_type: link.type,
              url: link.url,
              title: link.title,
            }))
          );

          if (linksError) throw linksError;
        }

        // Handle images
        // Get existing image IDs to determine what to keep/delete
        const existingImageIds = entryData.images
          .filter((img) => img.imageUrl && !img.file)
          .map((img) => img.id);

        // Delete images that are no longer in the list
        const { data: currentImages } = await supabase
          .from("entry_images")
          .select("id, image_url")
          .eq("entry_id", entryId);

        if (currentImages) {
          const imagesToDelete = currentImages.filter(
            (img) => !existingImageIds.includes(img.id)
          );

          for (const img of imagesToDelete) {
            // Delete from storage
            const urlParts = img.image_url.split("/entry-images/");
            if (urlParts[1]) {
              await supabase.storage.from("entry-images").remove([urlParts[1]]);
            }
            // Delete from database
            await supabase.from("entry_images").delete().eq("id", img.id);
          }
        }

        // Upload new images
        const newImages = entryData.images.filter((img) => img.file);
        for (const img of newImages) {
          if (img.file) {
            const imageUrl = await uploadImage(img.file, entryId);

            const { error: imgError } = await supabase.from("entry_images").insert({
              entry_id: entryId,
              user_id: user.id,
              image_url: imageUrl,
              caption: img.caption,
            });

            if (imgError) throw imgError;
          }
        }

        // Update captions for existing images
        for (const img of entryData.images.filter((i) => i.imageUrl && !i.file)) {
          await supabase
            .from("entry_images")
            .update({ caption: img.caption })
            .eq("id", img.id);
        }
      }

      setIsSaved(true);
      toast({
        title: "Entry saved",
        description: "Your journal entry has been captured successfully.",
      });
      setTimeout(() => setIsSaved(false), 3000);
    } catch (error) {
      console.error("Error saving entry:", error);
      toast({
        title: "Error",
        description: "Failed to save entry. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };


  // Redirect to auth if not logged in
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

  const saveButton = (
    <Button
      variant={isSaved ? "outline" : "hero"}
      onClick={handleSave}
      disabled={isSaving || !activeRole}
      className="min-w-[120px]"
    >
      {isSaving ? (
        <span className="animate-pulse">Saving...</span>
      ) : isSaved ? (
        <>
          <CheckCircle size={18} />
          Saved
        </>
      ) : (
        <>
          <Save size={18} />
          Save Entry
        </>
      )}
    </Button>
  );

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <Tabs defaultValue="today" className="w-full">
          <div className="flex items-center justify-between mb-6">
            <TabsList className="bg-secondary/30">
              <TabsTrigger value="today" className="gap-2">
                <PenLine className="h-4 w-4" />
                Today
              </TabsTrigger>
              <TabsTrigger value="past" className="gap-2">
                <History className="h-4 w-4" />
                Past Entries
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="today" className="mt-0">
            {/* Date Header */}
            <div
              className="flex items-start justify-between mb-8 opacity-0 animate-fade-up"
              style={{ animationDelay: "100ms", animationFillMode: "forwards" }}
            >
              <div>
                <div className="flex items-center gap-3 text-muted-foreground mb-2">
                  <Calendar size={18} className="text-primary" />
                  <span className="text-sm font-medium uppercase tracking-wider">
                    Daily Capture
                  </span>
                  {activeRole && (
                    <>
                      <span className="text-border">•</span>
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: activeRole.color }}
                      />
                      <span className="text-sm">{activeRole.title}</span>
                    </>
                  )}
                </div>
                <h1 className="font-serif text-3xl md:text-4xl font-bold">{today}</h1>
              </div>
              {saveButton}
            </div>

            {/* No Role Warning */}
            {!activeRole && (
              <div className="p-6 rounded-2xl bg-secondary/30 border border-border/50 text-center mb-8">
                <p className="text-muted-foreground mb-4">
                  Create a role to start journaling. Roles help you organize entries
                  by different positions or jobs.
                </p>
              </div>
            )}

            {/* Journal Form */}
            {activeRole && (
              <div
                className="opacity-0 animate-fade-up"
                style={{ animationDelay: "200ms", animationFillMode: "forwards" }}
              >
                <JournalEntryForm
                  entryData={entryData}
                  onEntryChange={setEntryData}
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="past" className="mt-0">
            <div className="mb-6">
              <h1 className="font-serif text-2xl md:text-3xl font-bold mb-2">
                Past Entries
              </h1>
              <p className="text-muted-foreground">
                Search and filter through your journal history
              </p>
            </div>
            <PastEntriesList />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Journal;
