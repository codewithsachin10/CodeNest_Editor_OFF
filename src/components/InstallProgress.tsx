import { cn } from "@/lib/utils";

interface InstallProgressProps {
  progress: number;
  status: string;
  details?: string[];
  showDetails?: boolean;
}

export function InstallProgress({
  progress,
  status,
  details = [],
  showDetails = false,
}: InstallProgressProps) {
  return (
    <div className="w-full space-y-6">
      {/* Status message */}
      <div className="text-center">
        <p className="text-lg font-medium text-foreground">{status}</p>
        <p className="text-sm text-muted-foreground mt-1">
          {progress}% complete
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-full h-3 bg-muted/50 rounded-full overflow-hidden backdrop-blur-sm border border-white/5">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out relative",
            progress < 100 ? "bg-gradient-to-r from-sky-500 to-sky-400" : "bg-gradient-to-r from-emerald-500 to-emerald-400"
          )}
          style={{ width: `${Math.max(progress, 2)}%` }}
        >
          {progress < 100 && progress > 5 && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
          )}
        </div>
      </div>

      {/* Details section */}
      {showDetails && details.length > 0 && (
        <div className="bg-muted/30 rounded-lg p-4 max-h-48 overflow-y-auto border border-white/5">
          <div className="space-y-1 font-mono text-xs text-muted-foreground">
            {details.map((detail, index) => (
              <p key={index} className={cn(
                index === details.length - 1 && "text-foreground/70"
              )}>{detail}</p>
            ))}
          </div>
        </div>
      )}

      {/* Shimmer animation */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        .animate-shimmer { animation: shimmer 1.5s infinite; }
      `}</style>
    </div>
  );
}
