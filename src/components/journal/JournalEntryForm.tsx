import { JournalPrompt } from "./JournalPrompt";
import { ProofLinksSection } from "./ProofLinksSection";
import { ImageUploadSection } from "./ImageUploadSection";
import type { JournalEntryData, ProofLinkData, ImageFileData } from "@/pages/Journal";

interface JournalEntryFormProps {
  entryData: JournalEntryData;
  onEntryChange: (data: JournalEntryData) => void;
}

export const JournalEntryForm = ({ entryData, onEntryChange }: JournalEntryFormProps) => {
  const updateField = (field: keyof JournalEntryData, value: string) => {
    onEntryChange({ ...entryData, [field]: value });
  };

  const updateProofLinks = (links: ProofLinkData[]) => {
    onEntryChange({ ...entryData, proofLinks: links });
  };

  const updateImages = (images: ImageFileData[]) => {
    onEntryChange({ ...entryData, images });
  };

  return (
    <div className="space-y-6">
      {/* Main Prompts */}
      <div className="space-y-4">
        <JournalPrompt
          label="What did you accomplish today?"
          placeholder="Shipped the new dashboard feature, resolved 3 customer tickets, paired with Alex on the API refactor..."
          value={entryData.accomplishments}
          onChange={(value) => updateField("accomplishments", value)}
          required
        />

        <JournalPrompt
          label="Any important decisions made?"
          placeholder="Decided to use Redis for caching instead of Memcached because..."
          value={entryData.decisions}
          onChange={(value) => updateField("decisions", value)}
        />

        <JournalPrompt
          label="Challenges or blockers?"
          placeholder="Spent 2 hours debugging a race condition in the payment flow..."
          value={entryData.challenges}
          onChange={(value) => updateField("challenges", value)}
        />

        <JournalPrompt
          label="What did you learn?"
          placeholder="Discovered that PostgreSQL's EXPLAIN ANALYZE is more powerful than I thought..."
          value={entryData.learnings}
          onChange={(value) => updateField("learnings", value)}
        />
      </div>

      {/* Proof Links */}
      <ProofLinksSection
        links={entryData.proofLinks}
        onLinksChange={updateProofLinks}
      />

      {/* Image Upload */}
      <ImageUploadSection
        images={entryData.images}
        onImagesChange={updateImages}
        maxImages={3}
      />
    </div>
  );
};
