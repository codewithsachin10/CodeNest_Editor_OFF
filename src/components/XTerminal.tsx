import { useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';

interface XTerminalProps {
    fontSize?: number;
    fontFamily?: string;
    cursorStyle?: 'block' | 'bar' | 'underline';
    cursorBlink?: boolean;
    scrollback?: number;
    isDarkTheme?: boolean;
    onData?: (data: string) => void;
    onReady?: () => void;
}

export interface XTerminalHandle {
    write: (data: string) => void;
    writeln: (data: string) => void;
    clear: () => void;
    focus: () => void;
    fit: () => void;
    getTerminal: () => Terminal | null;
    getDimensions: () => { cols: number; rows: number };
}

export const XTerminal = forwardRef<XTerminalHandle, XTerminalProps>(({
    fontSize = 14,
    fontFamily = "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
    cursorStyle = 'block',
    cursorBlink = true,
    scrollback = 1000,
    isDarkTheme = true,
    onData,
    onReady,
}, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const terminalRef = useRef<Terminal | null>(null);
    const fitAddonRef = useRef<FitAddon | null>(null);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
        write: (data: string) => {
            terminalRef.current?.write(data);
        },
        writeln: (data: string) => {
            terminalRef.current?.writeln(data);
        },
        clear: () => {
            terminalRef.current?.clear();
        },
        focus: () => {
            terminalRef.current?.focus();
        },
        fit: () => {
            fitAddonRef.current?.fit();
        },
        getTerminal: () => terminalRef.current,
        getDimensions: () => ({
            cols: terminalRef.current?.cols || 80,
            rows: terminalRef.current?.rows || 24,
        }),
    }));

    // Handle resize (debounced)
    const handleResize = useCallback(() => {
        if (fitAddonRef.current) {
            try {
                fitAddonRef.current.fit();
            } catch (e) {
                // Ignore fit errors on unmount
            }
        }
    }, []);

    const resizeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const debouncedResize = useCallback(() => {
        if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);
        resizeTimerRef.current = setTimeout(handleResize, 50);
    }, [handleResize]);

    // Keep latest onData ref
    const onDataRef = useRef(onData);
    useEffect(() => {
        onDataRef.current = onData;
    }, [onData]);

    // Initialize terminal
    useEffect(() => {
        if (!containerRef.current) return;

        // Create terminal
        const terminal = new Terminal({
            fontSize,
            fontFamily,
            cursorBlink,
            cursorStyle: cursorStyle === 'line' ? 'bar' : cursorStyle,
            scrollback,
            theme: isDarkTheme ? {
                background: '#0F172A',
                foreground: '#E5E7EB',
                cursor: '#38BDF8',
                cursorAccent: '#0F172A',
                selectionBackground: 'rgba(56, 189, 248, 0.25)',
                black: '#020617',
                red: '#EF4444',
                green: '#22C55E',
                yellow: '#F59E0B',
                blue: '#60A5FA',
                magenta: '#A78BFA',
                cyan: '#22D3EE',
                white: '#E5E7EB',
                brightBlack: '#64748B',
                brightRed: '#F87171',
                brightGreen: '#4ADE80',
                brightYellow: '#FBBF24',
                brightBlue: '#93C5FD',
                brightMagenta: '#C4B5FD',
                brightCyan: '#67E8F9',
                brightWhite: '#F8FAFC',
            } : {
                background: '#F1F5F9',
                foreground: '#1E293B',
                cursor: '#0284C7',
                cursorAccent: '#F1F5F9',
                selectionBackground: 'rgba(2, 132, 199, 0.2)',
                black: '#1E293B',
                red: '#DC2626',
                green: '#16A34A',
                yellow: '#CA8A04',
                blue: '#2563EB',
                magenta: '#9333EA',
                cyan: '#0891B2',
                white: '#F1F5F9',
                brightBlack: '#64748B',
                brightRed: '#EF4444',
                brightGreen: '#22C55E',
                brightYellow: '#EAB308',
                brightBlue: '#3B82F6',
                brightMagenta: '#A855F7',
                brightCyan: '#06B6D4',
                brightWhite: '#FFFFFF',
            },
        });

        // Add fit addon
        const fitAddon = new FitAddon();
        terminal.loadAddon(fitAddon);
        fitAddonRef.current = fitAddon;

        // Add web links addon
        const webLinksAddon = new WebLinksAddon();
        terminal.loadAddon(webLinksAddon);

        // Open terminal
        terminal.open(containerRef.current);
        terminalRef.current = terminal;

        // Fit after opening
        setTimeout(() => {
            fitAddon.fit();
            onReady?.();
        }, 0);

        // Listen for user input using ref to avoid stale closure
        terminal.onData((data) => {
            onDataRef.current?.(data);
        });

        // Add resize observer (debounced)
        const resizeObserver = new ResizeObserver(debouncedResize);
        resizeObserver.observe(containerRef.current);

        // Window resize handler
        window.addEventListener('resize', debouncedResize);

        return () => {
            resizeObserver.disconnect();
            window.removeEventListener('resize', debouncedResize);
            if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);
            terminal.dispose();
            terminalRef.current = null;
            fitAddonRef.current = null;
        };
    }, []);

    // Update theme when it changes
    useEffect(() => {
        if (!terminalRef.current) return;

        terminalRef.current.options.theme = isDarkTheme ? {
            background: '#0F172A',
            foreground: '#E5E7EB',
            cursor: '#38BDF8',
        } : {
            background: '#F1F5F9',
            foreground: '#1E293B',
            cursor: '#0284C7',
        };
    }, [isDarkTheme]);

    // Update font size
    useEffect(() => {
        if (terminalRef.current) {
            terminalRef.current.options.fontSize = fontSize;
            handleResize();
        }
    }, [fontSize, handleResize]);

    // Update fontFamily
    useEffect(() => {
        if (terminalRef.current) {
            terminalRef.current.options.fontFamily = fontFamily;
            handleResize();
        }
    }, [fontFamily, handleResize]);

    // Update cursorStyle
    useEffect(() => {
        if (terminalRef.current) {
            terminalRef.current.options.cursorStyle = cursorStyle === 'line' ? 'bar' : cursorStyle;
        }
    }, [cursorStyle]);

    // Update cursorBlink
    useEffect(() => {
        if (terminalRef.current) {
            terminalRef.current.options.cursorBlink = cursorBlink;
        }
    }, [cursorBlink]);

    // Update scrollback
    useEffect(() => {
        if (terminalRef.current) {
            terminalRef.current.options.scrollback = scrollback;
        }
    }, [scrollback]);

    return (
        <div
            ref={containerRef}
            className="w-full h-full"
            style={{
                backgroundColor: isDarkTheme ? '#0F172A' : '#F1F5F9',
            }}
        />
    );
});

XTerminal.displayName = 'XTerminal';

export default XTerminal;
