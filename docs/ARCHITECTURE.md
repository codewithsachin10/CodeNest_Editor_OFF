# CodeNest Studio - Architecture Overview

## Motivation
CodeNest Studio is designed as a fully independent, offline-first execution environment built on Electron and React for computer lab students. It prioritizes stability, deterministic execution, and zero reliance on cloud services. 

## High Level Components

```mermaid
graph TD;
    Main[Electron Main Process] -->|IPC| IPC[Context Bridge];
    IPC <--> UI[React Renderer UI];
    
    UI --> Editor[Monaco Editor]
    UI --> XTerm[Web Terminal (XTerminal)]
    UI --> Runtimes[Local Compiler Setup]
```

## Directory Structure
- `electron/main.cjs` - The host process handling pure native capabilities (`child_process`, `fs`).
- `electron/preload.cjs` - The bridge that exposes exactly typed APIs (`execution`, `fs`, `runtime`) to the frontend safely.
- `src/core/` - The beating heart of CodeNest. Here resides the `ExecutionService.ts` running an immutable 10-step safe pipeline to execute code cross-platform without blocking the UI thread.
- `src/components/` - Strict React functions separated from heavy component trees for isolation.
- `src/themes/` - Abstracted VS Code style tokenization engines driving Monaco Editor syntax mappings.

## State Management
We rely entirely on Prop-Drilling paired with pure functional hooks (like `useFileSystem`) combined with isolated contexts (like `SettingsContext.tsx`) to avoid state-bloat libraries like Redux. No remote-server context wrappers exist (`@tanstack/react-query`) per Option B configuration.

## System Interfaces
- **Compiler Interop**: Commands execute entirely within standard `node-pty` buffers for pseudo-terminal streams.
- **Runtimes Extraction**: On execution of "install C", raw pre-compiled GCC zip bundles mapped inside `/public` binaries are unzipped into native `%APPDATA%` or OS equivalents to instantly run locally. 
