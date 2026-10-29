import React, { Component, type ReactNode } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("[Sara ErrorBoundary] Uncaught runtime error:", error, errorInfo);
  }

  private handleReset = () => {
    const errorMsg = this.state.error?.message || "";
    if (
      errorMsg.includes("MIME type") ||
      errorMsg.includes("Failed to fetch dynamically imported module") ||
      errorMsg.includes("Importing a module script failed")
    ) {
      window.location.reload();
      return;
    }
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  public override render(): ReactNode {
    if (this.state.hasError) {
      const errorMessage = this.state.error?.message || "An unexpected rendering error occurred.";

      return (
        <div
          role="alert"
          className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center select-none"
        >
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
            <AlertCircle size={28} />
          </div>

          <h1 className="text-xl font-semibold text-slate-800 mb-2">
            {this.props.fallbackTitle || "Something went wrong"}
          </h1>

          <p className="text-sm text-slate-500 max-w-md mb-4 leading-relaxed">
            A component encountered an issue while rendering. Your session data is intact.
          </p>

          <div className="w-full max-w-md p-3 mb-6 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 break-words max-h-32 overflow-y-auto text-left">
            {errorMessage}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <RotateCcw size={15} />
              Try Again
            </button>
            <button
              type="button"
              onClick={this.handleReload}
              className="inline-flex items-center px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
