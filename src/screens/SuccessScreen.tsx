import { useState, useEffect } from "react";
import { AppButton } from "@/components/AppButton";
import { AppLayout } from "@/components/AppLayout";
import { StatusMessage } from "@/components/StatusMessage";
import { Play, Terminal, CheckCircle2, Sparkles } from "lucide-react";

interface SuccessScreenProps {
  languages: string[];
  onOpenEditor: () => void;
  onTestInstallation: () => void;
}

const languageNames: Record<string, string> = {
  python: "Python",
  cpp: "C/C++",
  java: "Java",
  javascript: "JavaScript",
  c: "C",
};

// Simple confetti-like celebration particles
function CelebrationParticles() {
  const colors = ['#38BDF8', '#22C55E', '#F59E0B', '#A78BFA', '#FB7185'];
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 rounded-full"
          style={{
            backgroundColor: colors[i % colors.length],
            left: `${10 + (i * 4.5) % 80}%`,
            top: '-5%',
            opacity: 0.7,
            animationName: 'confettiFall',
            animationDuration: `${2 + (i % 3)}s`,
            animationTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            animationIterationCount: '1',
            animationFillMode: 'forwards',
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </div>
  );
}

export function SuccessScreen({
  languages,
  onOpenEditor,
  onTestInstallation,
}: SuccessScreenProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <AppLayout>
      <CelebrationParticles />

      <div className={`flex flex-col items-center max-w-lg relative z-10 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
        {/* Success icon with glow */}
        <div className="relative mb-6">
          <div className="absolute inset-0 w-16 h-16 rounded-full bg-emerald-500/30 blur-xl animate-pulse" />
          <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Success heading */}
        <h1 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
          Everything is ready!
          <Sparkles className="w-5 h-5 text-yellow-400" />
        </h1>
        <p className="text-muted-foreground text-center mb-8">
          Your development environment has been set up successfully. You can start coding now.
        </p>

        {/* Installed languages */}
        <div className={`mb-10 w-full transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <p className="text-sm text-muted-foreground text-center mb-3">
            Installed successfully:
          </p>
          <div className="flex justify-center gap-2 flex-wrap">
            {languages.map((lang) => (
              <span
                key={lang}
                className="px-4 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 font-medium text-sm border border-emerald-500/20 flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {languageNames[lang] || lang}
              </span>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className={`flex flex-col sm:flex-row gap-3 w-full sm:w-auto transition-all duration-700 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <AppButton
            size="lg"
            onClick={onOpenEditor}
            icon={<Play className="w-5 h-5" />}
          >
            Open Code Editor
          </AppButton>
          <AppButton
            variant="secondary"
            size="lg"
            onClick={onTestInstallation}
            icon={<Terminal className="w-5 h-5" />}
          >
            Test Installation
          </AppButton>
        </div>

        {/* Reassurance */}
        <p className="text-sm text-muted-foreground mt-8 text-center">
          You're all set! The code editor includes everything you need to start writing code.
        </p>
      </div>

      {/* Confetti animation */}
      <style>{`
        @keyframes confettiFall {
          0% { transform: translateY(0) rotate(0deg) scale(1); opacity: 0.8; }
          100% { transform: translateY(100vh) rotate(720deg) scale(0.3); opacity: 0; }
        }
      `}</style>
    </AppLayout>
  );
}
