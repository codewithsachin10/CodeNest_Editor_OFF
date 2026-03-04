import { Check, Download } from "lucide-react";
import { cn } from "@/lib/utils";

interface LanguageCardProps {
  name: string;
  description: string;
  size: string;
  icon: React.ReactNode;
  selected: boolean;
  recommended?: boolean;
  onToggle: () => void;
}

export function LanguageCard({
  name,
  description,
  size,
  icon,
  selected,
  recommended,
  onToggle,
}: LanguageCardProps) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "relative w-full text-left p-5 rounded-xl border-2 transition-all duration-300 group",
        "hover:border-sky-400/40 focus:outline-none focus:ring-2 focus:ring-sky-400/20",
        "hover:shadow-lg hover:shadow-sky-500/5",
        selected
          ? "border-sky-400/60 bg-sky-400/5 shadow-md shadow-sky-400/5"
          : "border-border/50 bg-card/50 hover:bg-card/80"
      )}
    >
      {/* Checkbox indicator */}
      <div
        className={cn(
          "absolute top-4 right-4 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200",
          selected
            ? "bg-sky-500 border-sky-500 shadow-sm shadow-sky-500/30 scale-100"
            : "bg-card/50 border-border/50 group-hover:border-sky-400/30"
        )}
      >
        {selected && <Check className="w-4 h-4 text-white" />}
      </div>

      {/* Recommended badge */}
      {recommended && (
        <span className="absolute top-4 left-4 px-2.5 py-0.5 text-xs font-semibold bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
          ★ Recommended
        </span>
      )}

      <div className="flex items-start gap-4 mt-6">
        {/* Icon */}
        <div className={cn(
          "w-12 h-12 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300",
          selected ? "bg-sky-500/10" : "bg-muted group-hover:bg-sky-500/5"
        )}>
          {icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-foreground mb-1">{name}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed mb-2">
            {description}
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Download className="w-3 h-3" />
            <span>Download size: <span className="font-medium text-foreground/70">{size}</span></span>
          </div>
        </div>
      </div>
    </button>
  );
}
