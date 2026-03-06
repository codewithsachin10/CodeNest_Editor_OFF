import { useState, useEffect, useRef } from "react";
import { AppButton } from "@/components/AppButton";
import { AppLayout } from "@/components/AppLayout";
import { InstallProgress } from "@/components/InstallProgress";
import { TroubleshootingPanel } from "@/components/TroubleshootingPanel";
import { ChevronDown, ChevronUp, HelpCircle, WifiOff } from "lucide-react";
import { isOnline, onConnectivityChange } from "@/utils/offlineUtils";

interface InstallationScreenProps {
  languages: string[];
  onComplete: () => void;
  onCancel: () => void;
}

const languageNames: Record<string, string> = {
  python: "Python",
  cpp: "C/C++",
  java: "Java",
  javascript: "JavaScript",
  c: "C",
};

const installSteps = [
  "Preparing installation...",
  "Downloading files...",
  "Extracting packages...",
  "Setting up compiler...",
  "Configuring environment...",
  "Finalizing installation...",
];

export function InstallationScreen({
  languages,
  onComplete,
  onCancel,
}: InstallationScreenProps) {
  const [progress, setProgress] = useState(0);
  const [currentLangIndex, setCurrentLangIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [details, setDetails] = useState<string[]>([]);
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);
  const [stuckTime, setStuckTime] = useState(0);
  const [offline, setOffline] = useState(!isOnline());
  const lastProgressRef = useRef(0);

  // Track connectivity changes
  useEffect(() => {
    return onConnectivityChange((online) => setOffline(!online));
  }, []);

  const currentLang = languages[currentLangIndex];
  const isComplete = currentLangIndex >= languages.length;

  // Track if installation seems stuck
  useEffect(() => {
    const stuckChecker = setInterval(() => {
      if (lastProgressRef.current === progress && !isComplete) {
        setStuckTime((prev) => prev + 1);
      } else {
        setStuckTime(0);
        lastProgressRef.current = progress;
      }
    }, 1000);

    return () => clearInterval(stuckChecker);
  }, [progress, isComplete]);

  // Auto-show troubleshooting if stuck for 15+ seconds (simulated - using 8 for demo)
  useEffect(() => {
    if (stuckTime >= 8 && !showTroubleshooting) {
      // In real app, this would be longer
      // For demo purposes, we won't auto-trigger
    }
  }, [stuckTime, showTroubleshooting]);

  // Real installation logic
  useEffect(() => {
    if (isComplete) {
      setTimeout(onComplete, 1000);
      return;
    }

    const installCurrentLanguage = async () => {
      const lang = languages[currentLangIndex];

      try {
        if (lang === 'python') {
          // Check if running in browser (no Electron)
          if (!(window as any).electronAPI) {
            setDetails(prev => [...prev, `→ Web mode detected: Simulating installation...`]);
            await new Promise(r => setTimeout(r, 1500));
            setDetails(prev => [...prev, `✓ Python detected (Web Simulation)`, `✓ Ready to use`]);
            setProgress(100);
            return;
          }

          // Import runtimeManager dynamically to avoid SSR issues if any
          const { runtimeManager } = await import('@/utils/runtimeManager');

          setDetails(prev => [...prev, `→ Checking for Python runtime...`]);

          // Check existing
          const check = await runtimeManager.checkPython();
          if (check.path) {
            setDetails(prev => [...prev, `✓ Found Python ${check.version || ''} at ${check.path}`, `✓ Skipping download`]);
            setProgress(100);
          } else {
            // Install
            setDetails(prev => [...prev, `→ Python not found. Starting download...`]);

            const result = await runtimeManager.installPython((progress, stage) => {
              setProgress(progress);
              setStepIndex(stage === 'downloading' ? 1 : 2); // Map to installSteps

              if (progress % 10 === 0) {
                // Throttle logs
                // setDetails(prev => [...prev.slice(-10), `→ ${stage}: ${progress}%`]);
              }
            });

            if (result.success) {
              setDetails(prev => [...prev, `✓ Python installed successfully!`, `✓ Configured embedded runtime`]);
              setProgress(100);
            } else {
              setDetails(prev => [...prev, `✗ Installation failed: ${result.error}`]);
              // Trigger troubleshooting
              setShowTroubleshooting(true);
            }
          }
        } else if (lang === 'c' || lang === 'cpp') {
            const { runtimeManager } = await import('@/utils/runtimeManager');
            setDetails(prev => [...prev, `→ Installing C/C++ compiler (MinGW)...`]);
            
            const result = await runtimeManager.installC((progress, stage) => {
              setProgress(progress);
              setStepIndex(stage === 'downloading' ? 1 : 2);
            });

            if (result.success) {
              setDetails(prev => [...prev, `✓ C/C++ installed successfully!`, `✓ Configured embedded runtime`]);
              setProgress(100);
            } else {
              setDetails(prev => [...prev, `✗ Installation failed: ${result.error}`]);
              setShowTroubleshooting(true);
            }
        } else if (lang === 'java') {
            const { runtimeManager } = await import('@/utils/runtimeManager');
            setDetails(prev => [...prev, `→ Installing Java (JDK 21)...`]);
            
            const result = await runtimeManager.installJava((progress, stage) => {
              setProgress(progress);
              setStepIndex(stage === 'downloading' ? 1 : 2);
            });

            if (result.success) {
              setDetails(prev => [...prev, `✓ Java installed successfully!`, `✓ Configured embedded runtime`]);
              setProgress(100);
            } else {
              setDetails(prev => [...prev, `✗ Installation failed: ${result.error}`]);
              setShowTroubleshooting(true);
            }
        } else {
            setDetails(prev => [...prev, `→ ${languageNames[lang]} configured (uses system default)`]);
            await new Promise(r => setTimeout(r, 1000));
            setProgress(100);
        }
      } catch (e: unknown) {
        setDetails(prev => [...prev, `✗ Critical error: ${(e as Error).message}`]);
        setShowTroubleshooting(true);
      }
    };

    installCurrentLanguage();
  }, [currentLangIndex, isComplete, languages, onComplete]);

  // Handle successful progress
  useEffect(() => {
    if (progress >= 100 && !isComplete) {
      const timer = setTimeout(() => {
        setCurrentLangIndex(prev => prev + 1);
        setProgress(0);
        setStepIndex(0);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [progress, isComplete]);

  const getStatus = () => {
    if (isComplete) {
      return "Installation complete!";
    }
    return `${installSteps[stepIndex]} (${languageNames[currentLang]})`;
  };

  const getOverallProgress = () => {
    if (isComplete) return 100;
    const langProgress = (currentLangIndex / languages.length) * 100;
    const currentProgress = progress / languages.length;
    return Math.round(langProgress + currentProgress);
  };

  const handleRetry = () => {
    setShowTroubleshooting(false);
    setProgress(0);
    setStepIndex(0);
    setStuckTime(0);
  };

  return (
    <AppLayout>
      <div className="w-full max-w-lg">
        {/* Offline Warning Banner */}
        {offline && (
          <div className="mb-4 flex items-center gap-3 rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-3 text-sm text-amber-300">
            <WifiOff size={18} className="shrink-0" />
            <div>
              <p className="font-medium">You're offline</p>
              <p className="text-xs text-amber-400/70 mt-0.5">Runtime downloads require an internet connection. Already-installed languages will still work.</p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Installing your tools
          </h1>
          <p className="text-muted-foreground">
            Please wait while we set everything up for you.
          </p>
        </div>

        {/* Progress */}
        <InstallProgress
          progress={getOverallProgress()}
          status={getStatus()}
          details={details}
          showDetails={showDetails}
        />

        {/* Toggle details */}
        <div className="mt-6 flex items-center justify-center gap-4">
          <AppButton
            variant="ghost"
            onClick={() => setShowDetails((prev) => !prev)}
            icon={
              showDetails ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )
            }
          >
            {showDetails ? "Hide details" : "View details"}
          </AppButton>
          <AppButton
            variant="ghost"
            onClick={() => setShowTroubleshooting(true)}
            icon={<HelpCircle className="w-4 h-4" />}
          >
            Need help?
          </AppButton>
        </div>

        {/* Languages being installed */}
        <div className="mt-8 pt-6 border-t border-border">
          <p className="text-sm text-muted-foreground text-center mb-3">
            Installing:
          </p>
          <div className="flex justify-center gap-2">
            {languages.map((lang, index) => (
              <span
                key={lang}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-all duration-300 ${index < currentLangIndex
                  ? "bg-success/10 text-success border border-success/20"
                  : index === currentLangIndex
                    ? "bg-primary/10 text-primary border border-primary/20 shadow-sm shadow-primary/10"
                    : "bg-muted text-muted-foreground border border-transparent"
                  }`}
              >
                {index < currentLangIndex && <span className="text-success">✓</span>}
                {index === currentLangIndex && <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
                {languageNames[lang] || lang}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Troubleshooting Panel */}
      <TroubleshootingPanel
        isOpen={showTroubleshooting}
        onClose={() => setShowTroubleshooting(false)}
        onRetry={handleRetry}
        onCancel={onCancel}
        currentStep={getStatus()}
      />
    </AppLayout>
  );
}
