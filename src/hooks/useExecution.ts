/**
 * CodeNest Studio — useExecution Hook
 *
 * The ONLY interface between React UI and the execution engine.
 *
 * RULES:
 *   1. UI components call useExecution().run() — nothing else.
 *   2. No electronAPI.pty.spawn() for the Run button.
 *   3. No electronAPI.terminal.execute() for code execution.
 *   4. The hook returns an ExecutionResult — the UI renders from that.
 *   5. Debounce protection prevents rapid Run spam.
 *
 * The PTY API (electronAPI.pty.*) is STILL used for the interactive terminal shell.
 * This hook is ONLY for the "Run" / "Stop" code execution flow.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { ExecutionResult, ExecutionState } from '../core/types';

interface UseExecutionOptions {
    /** Called when stdout data arrives during execution */
    onStdout?: (data: string) => void;

    /** Called when stderr data arrives during execution */
    onStderr?: (data: string) => void;

    /** Called when execution state changes (saving → compiling → running → done) */
    onStateChange?: (state: ExecutionState) => void;
}

interface UseExecutionReturn {
    /** Current execution state */
    executionState: 'idle' | 'running';

    /** The granular pipeline state (saving, validating, compiling, running, done) */
    pipelineState: ExecutionState;

    /** Last execution result (null if no execution has completed) */
    result: ExecutionResult | null;

    /** Run a file through the execution pipeline */
    run: (request: {
        filePath: string;
        content: string;
        cwd: string;
        timeoutMs: number;
    }) => Promise<ExecutionResult | null>;

    /** Stop the current execution */
    stop: () => Promise<void>;

    /** Whether the engine is ready (not debounced) */
    isReady: boolean;
}

export function useExecution(options: UseExecutionOptions = {}): UseExecutionReturn {
    const [executionState, setExecutionState] = useState<'idle' | 'running'>('idle');
    const [pipelineState, setPipelineState] = useState<ExecutionState>('idle');
    const [result, setResult] = useState<ExecutionResult | null>(null);
    const [isReady, setIsReady] = useState(true);

    // Debounce guard — prevents rapid Run spam
    const runLockRef = useRef(false);

    // Store callbacks in refs to avoid stale closures
    const onStdoutRef = useRef(options.onStdout);
    const onStderrRef = useRef(options.onStderr);
    const onStateChangeRef = useRef(options.onStateChange);

    // Keep refs in sync
    onStdoutRef.current = options.onStdout;
    onStderrRef.current = options.onStderr;
    onStateChangeRef.current = options.onStateChange;

    // ─── Set up IPC event listeners ──────────────────────────────────────

    useEffect(() => {
        const api = (window as any).electronAPI;
        if (!api?.execution) return;

        // Listen for stdout streaming during execution
        const cleanupStdout = api.execution.onStdout((data: { data: string }) => {
            onStdoutRef.current?.(data.data);
        });

        // Listen for stderr streaming during execution
        const cleanupStderr = api.execution.onStderr((data: { data: string }) => {
            onStderrRef.current?.(data.data);
        });

        // Listen for state transitions
        const cleanupState = api.execution.onStateChange((data: { state: ExecutionState }) => {
            setPipelineState(data.state);
            onStateChangeRef.current?.(data.state);

            if (data.state === 'done') {
                setExecutionState('idle');
            }
        });

        return () => {
            // Cleanup all listeners on unmount
            cleanupStdout?.();
            cleanupStderr?.();
            cleanupState?.();
        };
    }, []);

    // ─── Run ─────────────────────────────────────────────────────────────

    const run = useCallback(async (request: {
        filePath: string;
        content: string;
        cwd: string;
        timeoutMs: number;
    }): Promise<ExecutionResult | null> => {
        // Debounce: prevent rapid spam
        if (runLockRef.current) {
            return null;
        }

        const api = (window as any).electronAPI;
        if (!api?.execution) {
            console.error('useExecution: electronAPI.execution not available');
            return null;
        }

        runLockRef.current = true;
        setIsReady(false);
        setExecutionState('running');
        setPipelineState('saving');
        setResult(null);

        try {
            const res: ExecutionResult = await api.execution.run(request);
            setResult(res);
            setExecutionState('idle');
            setPipelineState('done');
            return res;
        } catch (err: any) {
            const errorResult: ExecutionResult = {
                success: false,
                stdout: '',
                stderr: err.message || 'Unknown error',
                exitCode: 1,
                errorType: 'system',
                errorMessage: err.message || 'Unknown error',
                language: 'unknown',
                durationMs: 0,
                killed: false,
                errorLine: null,
                errorColumn: null,
            };
            setResult(errorResult);
            setExecutionState('idle');
            setPipelineState('done');
            return errorResult;
        } finally {
            // Release debounce after 300ms
            setTimeout(() => {
                runLockRef.current = false;
                setIsReady(true);
            }, 300);
        }
    }, []);

    // ─── Stop ────────────────────────────────────────────────────────────

    const stop = useCallback(async () => {
        const api = (window as any).electronAPI;
        if (!api?.execution) return;

        try {
            await api.execution.stop();
        } catch (err) {
            console.error('useExecution: Stop failed:', err);
        }

        setExecutionState('idle');
        setPipelineState('done');
    }, []);

    return {
        executionState,
        pipelineState,
        result,
        run,
        stop,
        isReady,
    };
}
