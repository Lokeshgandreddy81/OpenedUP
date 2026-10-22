import React, { Component, type ReactNode } from "react";

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
    console.error("[Shoebox ErrorBoundary] Uncaught runtime error:", error, errorInfo);
  }

  private handleReset = () => {
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
        <div className="w-full h-full min-h-[400px] flex items-center justify-center p-8 bg-[#006EFF] text-white select-none">
          <div className="max-w-[560px] w-full flex flex-col items-start gap-5">
            <span className="font-mono-badge px-2 py-0.5 bg-white text-[#006EFF] text-xs uppercase tracking-wider font-semibold">
              Stability Shield · Recovered
            </span>

            <h1 className="text-3xl md:text-4xl font-normal tracking-tight leading-none m-0">
              {this.props.fallbackTitle || "Something went wrong"}
            </h1>

            <p className="text-white/85 text-base md:text-lg leading-relaxed m-0">
              A component encountered an issue while rendering the document. Your session data is
              intact. You can reset this view or reload the workspace.
            </p>

            <div className="w-full p-3.5 bg-black/20 border border-white/15 rounded text-xs font-mono text-white/80 break-words max-h-32 overflow-y-auto">
              {errorMessage}
            </div>

            <div className="flex items-center gap-4 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="px-5 py-2.5 bg-white text-[#006EFF] font-semibold text-sm rounded hover:bg-white/90 active:scale-[0.98] transition cursor-pointer"
              >
                Try Again
              </button>
              <button
                type="button"
                onClick={this.handleReload}
                className="px-5 py-2.5 bg-transparent border border-white/40 text-white font-medium text-sm rounded hover:bg-white/10 active:scale-[0.98] transition cursor-pointer"
              >
                Reload App
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
