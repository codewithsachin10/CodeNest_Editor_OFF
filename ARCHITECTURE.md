# CodeNest Studio — Internal Architecture

CodeNest Studio is built on a process-isolated architecture heavily inspired by professional developer tools like JetBrains IDEs and VS Code. The core philosophy is **Fail-Safe Execution**: no matter how broken, infinite, or resource-heavy student code is, the IDE itself must remain entirely stable and responsive.

## 1. Process Structure

Unlike naive Electron apps that run compilers in the main or renderer threads, CodeNest uses a strict multi-process model:

*   **Electron Main Process**: Acts as the orchestrator. It manages the lifecycle, Window limits, and IPC communication.
*   **Renderer Process**: Pure UI. Hosts the local Monaco instance, file tree, and outputs. It has **no** ability to spawn compilers directly.
*   **Execution Sandbox Worker (ProcessManager)**: A dedicated system layer that handles spawning, monitoring, and terminating user programs securely.

## 2. The Execution Engine

JetBrains IDEs isolate execution into "Run Configurations". CodeNest implements this via the `ExecutionService`. When a student presses "Run":

1.  **Validation**: Main validates file paths and project structures.
2.  **Locking**: The `ProcessManager` enforces a single active execution at a time to prevent CPU saturation.
3.  **Spawn**: The program runs strictly as a separated child process. We do not use `shell: true` to prevent command injection.

## 3. The Secure Sandbox

User code runs with strict, hardcoded safeguards designed to prevent the system from crashing, hanging, or exhausting resources:

*   **Time Watchdog (Infinite Loop Protection)**: A strict 5000ms (5s) time limit. Timeouts are enforced reliably by the main process, not the renderer. `while(true)` loops will automatically be killed.
*   **Output Buffer Limit (Infinite Print Protection)**: Programs like `while True: print('x')` will exhaust system memory. We cap `stdout` and `stderr` buffers strictly at **10MB**. If breached, the program is force-killed immediately.
*   **Memory Enforcement**: A periodic watchdog polls OS-level metrics (e.g., via `ps` or `wmic`) for the spawned child's PID. If it exceeds **256MB**, it is forcefully terminated to prevent the student's laptop from locking up.
*   **Filesystem Isolation Guard**: The `ExecutionService` validates that the program being executed strictly resides within the user's `workspace` boundaries. Executing binaries in global spaces like `/system` or `C:\Windows` is intercepted and blocked at the IPC entry point.

## 4. Crash Recovery

If a program segfaults or throws `OutOfMemory`, only the isolated sandbox dies. The Main Process captures the exit code, runs the `ErrorClassifier` heavily optimized for human-readable student output, and pipes the context back to the IDE Terminal area.

## 5. File & Performance Offloading

Heavy IDE tasks (Auto-Save, Error formatting) occur asynchronously or are debounced. File reading is decoupled from the main thread via IPC to ensure the Monaco editor never drops below 60FPS.
