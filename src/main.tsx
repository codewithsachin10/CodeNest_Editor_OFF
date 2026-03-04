import { createRoot } from "react-dom/client";
import App from "./App.tsx";

// Self-hosted fonts — offline-first (replaces Google Fonts CDN)
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import "@fontsource/jetbrains-mono/600.css";

import "./index.css";

// Initialize Monaco with local workers (offline-first) — must run before any Editor renders
import "./utils/monacoConfig";

createRoot(document.getElementById("root")!).render(<App />);
