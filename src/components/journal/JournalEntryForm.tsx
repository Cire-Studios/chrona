import { useState } from "react";
import { JournalPrompt } from "./JournalPrompt";
import { ProofLinksSection } from "./ProofLinksSection";
import { ImageUploadSection } from "./ImageUploadSection";

export interface JournalEntry {
  accomplishments: string;
  decisions: string;
  challenges: string;
  learnings: string;
  proofLinks: ProofLink[];
  images: ImageFile[];
}

export interface ProofLink {
  id: string;
  type: "github" | "jira" | "confluence" | "slack" | "other";
  url: string;
  title: string;
}

export interface ImageFile {
  id: string;
  file: File;
  preview: string;
  caption: string;
}

export const JournalEntryForm = () => {
  const [entry, setEntry] = useState<JournalEntry>({
    accomplishments: "",
    decisions: "",
    challenges: "",
    learnings: "",
    proofLinks: [],
    images: [],
  });

  const updateField = (field: keyof JournalEntry, value: string) => {
    setEntry((prev) => ({ ...prev, [field]: value }));
  };

  const updateProofLinks = (links: ProofLink[]) => {
    setEntry((prev) => ({ ...prev, proofLinks: links }));
  };

  const updateImages = (images: ImageFile[]) => {
    setEntry((prev) => ({ ...prev, images }));
  };

  return (
    <div className="space-y-6">
      {/* Main Prompts */}
      <div className="space-y-4">
        <JournalPrompt
          label="What did you accomplish today?"
          placeholder="Shipped the new dashboard feature, resolved 3 customer tickets, paired with Alex on the API refactor..."
          value={entry.accomplishments}
          onChange={(value) => updateField("accomplishments", value)}
          required
        />

        <JournalPrompt
          label="Any important decisions made?"
          placeholder="Decided to use Redis for caching instead of Memcached because..."
          value={entry.decisions}
          onChange={(value) => updateField("decisions", value)}
        />

        <JournalPrompt
          label="Challenges or blockers?"
          placeholder="Spent 2 hours debugging a race condition in the payment flow..."
          value={entry.challenges}
          onChange={(value) => updateField("challenges", value)}
        />

        <JournalPrompt
          label="What did you learn?"
          placeholder="Discovered that PostgreSQL's EXPLAIN ANALYZE is more powerful than I thought..."
          value={entry.learnings}
          onChange={(value) => updateField("learnings", value)}
        />
      </div>

      {/* Proof Links */}
      <ProofLinksSection 
        links={entry.proofLinks} 
        onLinksChange={updateProofLinks} 
      />

      {/* Image Upload */}
      <ImageUploadSection 
        images={entry.images} 
        onImagesChange={updateImages}
        maxImages={3}
      />
    </div>
  );
};
