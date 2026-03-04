import { CheckCircle2, AlertCircle, Info, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type StatusType = "success" | "error" | "info" | "loading";

interface StatusMessageProps {
  type: StatusType;
  title: string;
  description?: string;
  className?: string;
}

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
  loading: Loader2,
};

const styles = {
  success: "text-success",
  error: "text-destructive",
  info: "text-primary",
  loading: "text-primary",
};

export function StatusMessage({
  type,
  title,
  description,
  className,
}: StatusMessageProps) {
  const Icon = icons[type];

  return (
    <div className={cn("flex flex-col items-center text-center", className)}>
      <Icon
        className={cn(
          "w-16 h-16 mb-4",
          styles[type],
          type === "loading" && "animate-spin"
        )}
      />
      <h2 className="text-2xl font-semibold text-foreground mb-2">{title}</h2>
      {description && (
        <p className="text-muted-foreground max-w-md">{description}</p>
      )}
    </div>
  );
}
