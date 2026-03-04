import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function AppLayout({ children, className }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden relative" style={{ backgroundColor: '#020617' }}>
      {/* Subtle radial gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% 40%, rgba(56,189,248,0.04) 0%, transparent 70%)',
        }}
      />

      {/* Window title bar */}
      <div className="h-9 border-b border-border/50 flex items-center px-4 shrink-0 relative z-10" style={{ backgroundColor: 'rgba(15, 23, 42, 0.9)' }}>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#ff5f57] hover:brightness-110 transition-all" />
          <div className="w-3 h-3 rounded-full bg-[#febc2e] hover:brightness-110 transition-all" />
          <div className="w-3 h-3 rounded-full bg-[#28c840] hover:brightness-110 transition-all" />
        </div>
        <span className="absolute left-1/2 -translate-x-1/2 text-xs text-muted-foreground/70 font-medium">
          CodeNest Setup
        </span>
      </div>

      {/* Main content */}
      <main
        className={cn(
          "flex-1 flex flex-col items-center justify-center p-8 relative z-10",
          className
        )}
      >
        {children}
      </main>

      {/* Footer */}
      <footer className="h-10 bg-card/40 border-t border-border/30 flex items-center justify-center shrink-0 relative z-10">
        <p className="text-xs text-muted-foreground/60">
          CodeNest v1.0.0 • Made for beginners
        </p>
      </footer>
    </div>
  );
}
