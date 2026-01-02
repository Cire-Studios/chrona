import { useRef } from "react";
import { ImagePlus, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { ImageFileData } from "@/pages/Journal";

interface ImageUploadSectionProps {
  images: ImageFileData[];
  onImagesChange: (images: ImageFileData[]) => void;
  maxImages: number;
}

export const ImageUploadSection = ({
  images,
  onImagesChange,
  maxImages,
}: ImageUploadSectionProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (images.length + files.length > maxImages) {
      toast({
        title: "Too many images",
        description: `You can only upload up to ${maxImages} images.`,
        variant: "destructive",
      });
      return;
    }

    const newImages: ImageFileData[] = files.map((file) => ({
      id: crypto.randomUUID(),
      file,
      preview: URL.createObjectURL(file),
      caption: "",
    }));

    onImagesChange([...images, ...newImages]);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = (id: string) => {
    const image = images.find((img) => img.id === id);
    if (image && image.file) {
      URL.revokeObjectURL(image.preview);
    }
    onImagesChange(images.filter((img) => img.id !== id));
  };

  const handleCaptionChange = (id: string, caption: string) => {
    onImagesChange(
      images.map((img) =>
        img.id === id ? { ...img, caption } : img
      )
    );
  };

  const canAddMore = images.length < maxImages;

  return (
    <div className="p-5 rounded-2xl bg-gradient-card border border-border/50">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-serif text-lg font-semibold">Screenshots & Evidence</h3>
          <p className="text-sm text-muted-foreground">
            Optional: Add up to {maxImages} images ({images.length}/{maxImages})
          </p>
        </div>
      </div>

      {/* Image Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Existing Images */}
        {images.map((image) => (
          <div
            key={image.id}
            className="group relative aspect-video rounded-xl overflow-hidden bg-secondary/30 border border-border/50"
          >
            <img
              src={image.preview}
              alt="Upload preview"
              className="w-full h-full object-cover"
            />
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Button
                variant="destructive"
                size="icon"
                onClick={() => handleRemoveImage(image.id)}
                className="h-8 w-8"
              >
                <X size={16} />
              </Button>
            </div>

            {/* Caption Input */}
            <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-background/90 to-transparent">
              <input
                type="text"
                placeholder="Add caption..."
                value={image.caption}
                onChange={(e) => handleCaptionChange(image.id, e.target.value)}
                className={cn(
                  "w-full px-2 py-1 text-xs rounded-md",
                  "bg-secondary/50 border-0",
                  "placeholder:text-muted-foreground/50",
                  "focus:outline-none focus:ring-1 focus:ring-primary/50"
                )}
              />
            </div>
          </div>
        ))}

        {/* Add New Image Button */}
        {canAddMore && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "aspect-video rounded-xl border-2 border-dashed border-border/50",
              "flex flex-col items-center justify-center gap-2",
              "text-muted-foreground hover:text-foreground",
              "hover:border-primary/50 hover:bg-secondary/20",
              "transition-all duration-300"
            )}
          >
            <ImagePlus size={24} />
            <span className="text-xs">Add Image</span>
          </button>
        )}
      </div>

      {/* Empty State */}
      {images.length === 0 && (
        <div className="text-center py-4 text-muted-foreground text-sm mt-2">
          <ImageIcon size={24} className="mx-auto mb-2 opacity-40" />
          <p>Screenshots, diagrams, or other visual proof</p>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};
