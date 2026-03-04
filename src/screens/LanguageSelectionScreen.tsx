import { useState } from "react";
import { AppButton } from "@/components/AppButton";
import { AppLayout } from "@/components/AppLayout";
import { LanguageCard } from "@/components/LanguageCard";
import { ArrowLeft, ArrowRight, Package } from "lucide-react";
import { cppIcon, pythonIcon, javaIcon, jsIcon as javascriptIcon } from "@/utils/languageIcons";

interface LanguageSelectionScreenProps {
  onBack: () => void;
  onInstall: (languages: string[]) => void;
}

const languages = [
  {
    id: "python",
    name: "Python",
    description:
      "Perfect for beginners. Simple syntax, great for learning programming concepts.",
    size: "~150 MB",
    icon: <img src={pythonIcon} alt="Python" className="w-7 h-7" draggable={false} />,
    recommended: true,
  },
  {
    id: "cpp",
    name: "C / C++",
    description:
      "Foundation of computer science. Used in system programming and competitive coding.",
    size: "~300 MB",
    icon: <img src={cppIcon} alt="C++" className="w-7 h-7" draggable={false} />,
    recommended: false,
  },
  {
    id: "java",
    name: "Java",
    description:
      "Industry standard for enterprise applications. Write once, run anywhere.",
    size: "~200 MB",
    icon: <img src={javaIcon} alt="Java" className="w-7 h-7" draggable={false} />,
    recommended: false,
  },
  {
    id: "javascript",
    name: "JavaScript (Node.js)",
    description:
      "The language of the web. Run JavaScript outside the browser with Node.js.",
    size: "~100 MB",
    icon: <img src={javascriptIcon} alt="JavaScript" className="w-7 h-7" draggable={false} />,
    recommended: false,
  },
];

export function LanguageSelectionScreen({
  onBack,
  onInstall,
}: LanguageSelectionScreenProps) {
  const [selected, setSelected] = useState<string[]>(["python"]);

  const toggleLanguage = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]
    );
  };

  const handleInstall = () => {
    if (selected.length > 0) {
      onInstall(selected);
    }
  };

  // Calculate total download size
  const totalSize = selected.reduce((acc, id) => {
    const lang = languages.find(l => l.id === id);
    const sizeNum = parseInt(lang?.size?.replace(/[^0-9]/g, '') || '0', 10);
    return acc + sizeNum;
  }, 0);

  return (
    <AppLayout>
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Choose what you want to install
          </h1>
          <p className="text-muted-foreground">
            Select the programming languages you need. You can always add more later.
          </p>
        </div>

        {/* Language cards */}
        <div className="space-y-3 mb-8">
          {languages.map((lang) => (
            <LanguageCard
              key={lang.id}
              name={lang.name}
              description={lang.description}
              size={lang.size}
              icon={lang.icon}
              selected={selected.includes(lang.id)}
              recommended={lang.recommended}
              onToggle={() => toggleLanguage(lang.id)}
            />
          ))}
        </div>

        {/* Selected summary */}
        <div className="text-center mb-6 space-y-1">
          <p className="text-sm text-muted-foreground">
            {selected.length === 0
              ? "Select at least one language to continue"
              : `${selected.length} language${selected.length > 1 ? "s" : ""} selected`}
          </p>
          {selected.length > 0 && (
            <p className="text-xs text-muted-foreground/60 flex items-center justify-center gap-1">
              <Package className="w-3 h-3" />
              Estimated total: ~{totalSize} MB
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AppButton variant="ghost" onClick={onBack} icon={<ArrowLeft className="w-4 h-4" />}>
              Back
            </AppButton>
          </div>
          <AppButton
            size="lg"
            onClick={handleInstall}
            disabled={selected.length === 0}
            icon={<ArrowRight className="w-5 h-5" />}
          >
            Install Selected
          </AppButton>
        </div>
      </div>
    </AppLayout>
  );
}
