import { useState, useEffect } from "react";
import { Code2, LogIn, Zap, Shield, Layers, ArrowRight } from "lucide-react";
import { AppButton } from "@/components/AppButton";
import { AppLayout } from "@/components/AppLayout";

interface WelcomeScreenProps {
  onGetStarted: () => void;
}

// Floating code particles for ambient background effect
function FloatingCode() {
  const snippets = ['def main():', 'print("Hello")', 'for i in range:', '#include <stdio>', 'int main()', 'return 0;', 'class App:', 'import os', 'void run()', 'let x = 42'];
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden>
      {snippets.map((s, i) => (
        <span
          key={i}
          className="absolute text-sky-500/[0.06] font-mono text-sm whitespace-nowrap"
          style={{
            left: `${8 + (i * 9) % 85}%`,
            top: `${5 + (i * 13) % 80}%`,
            animationName: 'floatUp',
            animationDuration: `${18 + i * 3}s`,
            animationTimingFunction: 'linear',
            animationIterationCount: 'infinite',
            animationDelay: `${i * 1.5}s`,
          }}
        >
          {s}
        </span>
      ))}
    </div>
  );
}

const features = [
  { icon: Zap, title: 'One-Click Setup', desc: 'Install Python, C++, and Java with a single click' },
  { icon: Shield, title: 'Works Offline', desc: 'No internet needed after initial setup' },
  { icon: Layers, title: 'Full IDE', desc: 'Editor, terminal, debugger — all built in' },
];

export function WelcomeScreen({ onGetStarted }: WelcomeScreenProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Trigger entrance animations after mount
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <AppLayout>
      {/* Ambient background */}
      <FloatingCode />

      <div className={`flex flex-col items-center text-center max-w-xl relative z-10 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
        {/* Logo with glow */}
        <div className="relative mb-8">
          <div className="absolute inset-0 w-20 h-20 rounded-2xl bg-sky-500/30 blur-xl animate-pulse" />
          <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center shadow-lg shadow-sky-500/25">
            <Code2 className="w-10 h-10 text-white drop-shadow" />
          </div>
        </div>

        {/* App name with gradient */}
        <h1 className="text-5xl font-bold tracking-tight mb-3 bg-gradient-to-r from-white via-sky-100 to-sky-300 bg-clip-text text-transparent">
          CodeNest
        </h1>

        {/* Tagline */}
        <p className="text-xl text-sky-400 font-medium mb-3">
          Your first coding setup. Done right.
        </p>

        {/* Description */}
        <p className="text-muted-foreground text-base leading-relaxed mb-8 max-w-md">
          Install languages and a full code editor in just a few clicks.
          Code entirely offline with zero mandatory accounts or setup.
        </p>

        {/* Feature cards */}
        <div className={`grid grid-cols-3 gap-3 w-full mb-10 transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} role="list" aria-label="Key features">
          {features.map((f) => (
            <div
              key={f.title}
              role="listitem"
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-sky-500/20 transition-all duration-300"
            >
              <div className="w-9 h-9 rounded-lg bg-sky-500/10 flex items-center justify-center" aria-hidden="true">
                <f.icon className="w-4.5 h-4.5 text-sky-400" />
              </div>
              <span className="text-xs font-semibold text-white/90">{f.title}</span>
              <span className="text-[11px] leading-tight text-white/40">{f.desc}</span>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className={`flex flex-col items-center gap-3 w-full max-w-xs transition-all duration-700 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <AppButton
            size="lg"
            onClick={onGetStarted}
            className="w-full group"
            aria-label="Get Started with CodeNest setup"
            icon={<ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />}
          >
            Get Started
          </AppButton>
        </div>

        {/* Reassurance */}
        <div className={`flex items-center gap-4 mt-8 transition-all duration-700 delay-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
          {['No account required', 'Works 100% offline', '~5 min setup'].map((text) => (
            <span key={text} className="text-xs text-muted-foreground/50 flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-sky-500/40" />
              {text}
            </span>
          ))}
        </div>
      </div>

      {/* Animation keyframes */}
      <style>{`
        @keyframes floatUp {
          0% { transform: translateY(0) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-100vh) rotate(3deg); opacity: 0; }
        }
      `}</style>
    </AppLayout>
  );
}
