import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";

interface Props {
  children: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class LandingPageErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("LandingPage error caught:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center text-white"
        >
          <div className="w-14 h-14 rounded-2xl bg-rose-950/60 border border-rose-800/40 text-rose-400 flex items-center justify-center mb-4">
            <AlertCircle size={28} />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Failed to load Landing view</h2>
          <p className="text-sm text-slate-400 max-w-md mb-6">
            {this.state.error?.message || "An unexpected error occurred while loading this screen."}
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-slate-950 text-sm font-semibold hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <RotateCcw size={16} />
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default LandingPageErrorBoundary;
