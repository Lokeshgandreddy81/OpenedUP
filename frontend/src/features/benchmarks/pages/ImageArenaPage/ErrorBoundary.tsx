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

export class ImageArenaPageErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ImageArenaPage error caught:", error, errorInfo);
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
          className="min-h-screen bg-[#FBFBFC] flex flex-col items-center justify-center p-6 text-center"
        >
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
            <AlertCircle size={28} />
          </div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">
            Failed to render Image Arena view
          </h2>
          <p className="text-sm text-slate-500 max-w-md mb-6">
            {this.state.error?.message || "An unexpected error occurred while loading Image Arena."}
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors cursor-pointer"
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

export default ImageArenaPageErrorBoundary;
