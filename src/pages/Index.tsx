import { useState, lazy, Suspense } from "react";
import { WelcomeScreen } from "@/screens/WelcomeScreen";
import { Loader2 } from "lucide-react";

const LanguageSelectionScreen = lazy(() => import("@/screens/LanguageSelectionScreen").then(m => ({ default: m.LanguageSelectionScreen })));
const SettingsScreen = lazy(() => import("@/screens/SettingsScreen").then(m => ({ default: m.SettingsScreen })));
const InstallationScreen = lazy(() => import("@/screens/InstallationScreen").then(m => ({ default: m.InstallationScreen })));
const SuccessScreen = lazy(() => import("@/screens/SuccessScreen").then(m => ({ default: m.SuccessScreen })));
const CodeNestStudio = lazy(() => import("@/screens/CodeNestStudio").then(m => ({ default: m.CodeNestStudio })));

type Screen = "welcome" | "selection" | "settings" | "installation" | "success" | "ide";

const Index = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>("welcome");
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);

  const handleGetStarted = () => {
    setCurrentScreen("selection");
  };

  const handleBackToWelcome = () => {
    setCurrentScreen("welcome");
  };

  const handleOpenSettings = () => {
    setCurrentScreen("settings");
  };

  const handleBackFromSettings = () => {
    setCurrentScreen("ide");
  };

  const handleInstall = (languages: string[]) => {
    setSelectedLanguages(languages);
    setCurrentScreen("installation");
  };

  const handleInstallComplete = () => {
    setCurrentScreen("success");
  };

  const handleCancelInstallation = () => {
    setCurrentScreen("selection");
  };

  const handleOpenEditor = () => {
    setCurrentScreen("ide");
  };

  const handleTestInstallation = () => {
    setCurrentScreen("ide");
  };

  const handleBackFromIDE = () => {
    setCurrentScreen("success");
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case "welcome":
        return <WelcomeScreen onGetStarted={handleGetStarted} />;

      case "selection":
        return (
          <LanguageSelectionScreen
            onBack={handleBackToWelcome}
            onInstall={handleInstall}
          />
        );

      case "settings":
        return (
          <SettingsScreen
            onBack={handleBackFromSettings}
          />
        );

      case "installation":
        return (
          <InstallationScreen
            languages={selectedLanguages}
            onComplete={handleInstallComplete}
            onCancel={handleCancelInstallation}
          />
        );

      case "success":
        return (
          <SuccessScreen
            languages={selectedLanguages}
            onOpenEditor={handleOpenEditor}
            onTestInstallation={handleTestInstallation}
          />
        );

      case "ide":
        return (
          <CodeNestStudio
            onBack={handleBackFromIDE}
            onOpenSettings={handleOpenSettings}
            selectedLanguages={selectedLanguages}
          />
        );

      default:
        return <WelcomeScreen onGetStarted={handleGetStarted} />;
    }
  };

  return (
    <Suspense fallback={
      <div className="w-full h-screen flex items-center justify-center bg-[#0d1117] text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    }>
      {renderScreen()}
    </Suspense>
  );
};

export default Index;
