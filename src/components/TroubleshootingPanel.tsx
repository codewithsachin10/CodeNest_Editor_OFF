import { useState } from "react";
import { AppButton } from "@/components/AppButton";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  HelpCircle,
  RefreshCw,
  X,
  Wifi,
  Shield,
  HardDrive,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TroubleshootingPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onRetry: () => void;
  onCancel: () => void;
  currentStep?: string;
}

const commonIssues = [
  {
    id: "network",
    icon: Wifi,
    title: "Network connection issues",
    description: "Check your internet connection and try again",
    solutions: [
      "Make sure you're connected to the internet",
      "Try disabling VPN if you're using one",
      "Check if your firewall is blocking the download",
      "Try connecting to a different network",
    ],
  },
  {
    id: "antivirus",
    icon: Shield,
    title: "Antivirus blocking installation",
    description: "Security software may prevent installation",
    solutions: [
      "Temporarily disable your antivirus",
      "Add CodeNest to your antivirus whitelist",
      "Run CodeNest as administrator",
      "Check Windows Defender settings",
    ],
  },
  {
    id: "disk",
    icon: HardDrive,
    title: "Not enough disk space",
    description: "Free up space on your installation drive",
    solutions: [
      "Clear temporary files and downloads",
      "Uninstall unused programs",
      "Empty your recycle bin",
      "Choose a different installation directory",
    ],
  },
];

export function TroubleshootingPanel({
  isOpen,
  onClose,
  onRetry,
  onCancel,
  currentStep,
}: TroubleshootingPanelProps) {
  const [expandedIssue, setExpandedIssue] = useState<string | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-foreground/20 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-border flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-warning" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Installation taking too long?
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Don't worry — here are some things that might help
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Current status */}
        {currentStep && (
          <div className="px-5 py-3 bg-muted/50 border-b border-border">
            <p className="text-sm text-muted-foreground">
              Currently stuck on:{" "}
              <span className="font-medium text-foreground">{currentStep}</span>
            </p>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <p className="text-sm text-muted-foreground">
            Installation can sometimes take longer on slower connections or
            older computers. If it's been more than 10 minutes, try these
            solutions:
          </p>

          {/* Common issues */}
          <div className="space-y-3">
            {commonIssues.map((issue) => (
              <div
                key={issue.id}
                className="bg-muted/30 rounded-lg border border-border overflow-hidden"
              >
                <button
                  onClick={() =>
                    setExpandedIssue(
                      expandedIssue === issue.id ? null : issue.id
                    )
                  }
                  className="w-full p-4 flex items-start gap-3 text-left hover:bg-muted/50 transition-colors"
                >
                  <issue.icon className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground">
                      {issue.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {issue.description}
                    </p>
                  </div>
                  {expandedIssue === issue.id ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />
                  )}
                </button>

                {expandedIssue === issue.id && (
                  <div className="px-4 pb-4 pt-0 ml-8">
                    <ul className="space-y-2">
                      {issue.solutions.map((solution, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-2 text-sm text-muted-foreground"
                        >
                          <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center justify-center shrink-0">
                            {index + 1}
                          </span>
                          {solution}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Still stuck */}
          <div className="bg-accent/50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <HelpCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-foreground mb-1">
                  Still having trouble?
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Visit our help center for more detailed troubleshooting guides
                  and community support.
                </p>
                <a
                  href="#"
                  className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  Open Help Center
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-5 border-t border-border flex items-center justify-between bg-muted/30">
          <AppButton variant="ghost" onClick={onCancel}>
            Cancel Installation
          </AppButton>
          <div className="flex gap-3">
            <AppButton variant="secondary" onClick={onClose}>
              Keep Waiting
            </AppButton>
            <AppButton onClick={onRetry} icon={<RefreshCw className="w-4 h-4" />}>
              Retry Installation
            </AppButton>
          </div>
        </div>
      </div>
    </div>
  );
}
