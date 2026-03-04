import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryProps {
    children: ReactNode;
    /** Name shown in the fallback UI (e.g. "Editor", "Terminal") */
    name?: string;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

/**
 * React Error Boundary — catches render-time crashes in a subtree and
 * shows a recovery UI instead of bringing down the whole app.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error(`[ErrorBoundary${this.props.name ? ` — ${this.props.name}` : ''}]`, error, info.componentStack);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center select-none">
                    <AlertTriangle className="w-8 h-8 text-amber-400" />
                    <h3 className="text-sm font-semibold opacity-80">
                        {this.props.name ? `${this.props.name} crashed` : 'Something went wrong'}
                    </h3>
                    <p className="text-xs opacity-50 max-w-xs">
                        {this.state.error?.message || 'An unexpected error occurred.'}
                    </p>
                    <button
                        onClick={this.handleReset}
                        className="flex items-center gap-1.5 px-3 py-1.5 mt-2 text-xs rounded-md bg-white/10 hover:bg-white/20 transition-colors"
                    >
                        <RotateCcw className="w-3 h-3" /> Retry
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
