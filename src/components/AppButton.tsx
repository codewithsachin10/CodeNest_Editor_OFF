import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface AppButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "default" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
}

export const AppButton = forwardRef<HTMLButtonElement, AppButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "default",
      loading = false,
      icon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles = cn(
      "inline-flex items-center justify-center gap-2 font-medium transition-all rounded-xl",
      "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 focus:ring-offset-background",
      "disabled:opacity-50 disabled:cursor-not-allowed",
      "active:scale-[0.98]"
    );

    const variants = {
      primary: cn(
        "bg-gradient-to-b from-sky-400 to-sky-500 text-white shadow-md shadow-sky-500/20",
        "hover:from-sky-400 hover:to-sky-400 hover:shadow-lg hover:shadow-sky-500/30",
        "active:from-sky-600 active:to-sky-600"
      ),
      secondary: cn(
        "bg-secondary text-secondary-foreground border border-border/50",
        "hover:bg-muted hover:border-border active:bg-muted/80"
      ),
      ghost: cn(
        "text-foreground/80",
        "hover:bg-muted hover:text-foreground active:bg-muted/80"
      ),
      danger: cn(
        "bg-red-500/15 text-red-400 border border-red-500/20",
        "hover:bg-red-500/25 hover:border-red-500/30 active:bg-red-500/35"
      ),
    };

    const sizes = {
      sm: "h-8 px-3 text-xs rounded-lg",
      default: "h-11 px-6 text-sm",
      lg: "h-14 px-8 text-base",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : icon ? (
          icon
        ) : null}
        {children}
      </button>
    );
  }
);

AppButton.displayName = "AppButton";
