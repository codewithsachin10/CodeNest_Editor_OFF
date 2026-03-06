/// <reference types="vite/client" />

interface Window {
  electronAPI: {
    fs: {
      readFile: (path: string) => Promise<string>;
      writeFile: (path: string, content: string) => Promise<void>;
      exists: (path: string) => Promise<boolean>;
      join: (...args: string[]) => Promise<string>;
      mkdir: (path: string) => Promise<void>;
    };
    terminal: {
      execute: (command: string, cwd: string, options?: { env?: Record<string, string> }) => Promise<{ output: string; exitCode: number }>;
      spawn: (command: string, args: string[], cwd: string) => Promise<number>;
    };
    execution: {
      run: (request: Record<string, unknown>) => Promise<Record<string, unknown>>;
      stop: () => Promise<void>;
      getState: () => Promise<Record<string, unknown>>;
      onStdout: (callback: (data: string) => void) => void;
      onStderr: (callback: (data: string) => void) => void;
      onStateChange: (callback: (state: unknown) => void) => void;
    };
    workspace: {
      set: (path: string) => Promise<void>;
    };
    dialog: {
      showOpenDialog: (options: Record<string, unknown>) => Promise<{ canceled: boolean; filePaths: string[] }>;
    };
    pty: {
      onData: (callback: (data: { id: string; data: string }) => void) => () => void;
      onExit: (callback: (data: { id: string; exitCode: number }) => void) => () => void;
      write: (id: string, data: string) => Promise<void>;
      kill: (id: string) => Promise<void>;
      spawn: (options: { cmd: string; args: string[]; cwd: string; cols?: number; rows?: number }) => Promise<{ success: boolean; id: string; error?: string }>;
    };
    app: {
      getPath: (name: string) => Promise<string>;
      getInfo: () => Promise<{ platform: string; version: string; isPackaged: boolean }>;
    };
    window: {
      close: () => void;
      minimize: () => void;
      maximize: () => void;
    };
    git: {
      init: (path: string) => Promise<{ success: boolean; message?: string; error?: string }>;
      status: (path: string) => Promise<{ success: boolean; files?: { status: string; filePath: string }[]; error?: string }>;
      commit: (path: string, msg: string) => Promise<{ success: boolean; data?: string; error?: string }>;
      log: (path: string) => Promise<{ success: boolean; commits?: { hash: string; author: string; date: string; message: string }[]; error?: string }>;
      restore: (path: string, hash: string) => Promise<{ success: boolean; error?: string }>;
    };
  };
}
