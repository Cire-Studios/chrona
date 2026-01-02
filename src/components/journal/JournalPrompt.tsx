import { cn } from "@/lib/utils";

interface JournalPromptProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

export const JournalPrompt = ({
  label,
  placeholder,
  value,
  onChange,
  required = false,
}: JournalPromptProps) => {
  return (
    <div className="group">
      <label className="block mb-2">
        <span className="text-sm font-medium text-foreground">
          {label}
        </span>
        {required && (
          <span className="text-primary ml-1">*</span>
        )}
      </label>
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className={cn(
            "w-full px-4 py-3 rounded-xl resize-none",
            "bg-secondary/30 border border-border/50",
            "text-foreground placeholder:text-muted-foreground/50",
            "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50",
            "transition-all duration-300",
            "font-sans text-sm leading-relaxed"
          )}
        />
        <div 
          className={cn(
            "absolute bottom-3 right-3 text-xs text-muted-foreground/50",
            "opacity-0 group-focus-within:opacity-100 transition-opacity"
          )}
        >
          {value.length} chars
        </div>
      </div>
    </div>
  );
};
