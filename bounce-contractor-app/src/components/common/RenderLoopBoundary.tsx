import React, { Component, ReactNode } from "react";
import { errorLogger } from "../../services/debug/errorLogger";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorCount: number;
  lastErrorTime: number;
}

/**
 * Error boundary specifically designed to catch and prevent infinite render loops
 */
class RenderLoopBoundary extends Component<Props, State> {
  private resetTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorCount: 0,
      lastErrorTime: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const now = Date.now();
    return {
      hasError: true,
      error,
      lastErrorTime: now,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const now = Date.now();
    const timeSinceLastError = now - this.state.lastErrorTime;

    // Detect potential render loop (multiple errors in quick succession)
    const isRenderLoop = timeSinceLastError < 1000; // Less than 1 second between errors

    this.setState((prevState) => ({
      errorCount: prevState.errorCount + 1,
    }));

    errorLogger.logError(
      "render-loop-boundary",
      "Component error caught",
      error,
      {
        componentStack: errorInfo.componentStack,
        errorCount: this.state.errorCount + 1,
        timeSinceLastError,
        isRenderLoop,
        errorStack: error.stack,
      },
    );

    // Call custom error handler if provided
    if (this.props.onError) {
      try {
        this.props.onError(error, errorInfo);
      } catch (handlerError) {
        errorLogger.logError(
          "render-loop-boundary",
          "Error in custom error handler",
          handlerError,
        );
      }
    }

    // If this looks like a render loop, don't auto-reset
    if (isRenderLoop || this.state.errorCount >= 3) {
      errorLogger.logError(
        "render-loop-boundary",
        "Render loop detected - preventing auto-reset",
        error,
        {
          errorCount: this.state.errorCount + 1,
          timeSinceLastError,
        },
      );
      return;
    }

    // Auto-reset after 5 seconds for single errors
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }

    this.resetTimeoutId = setTimeout(() => {
      errorLogger.logInfo(
        "render-loop-boundary",
        "Auto-resetting error boundary",
      );
      this.setState({
        hasError: false,
        error: null,
        errorCount: 0,
        lastErrorTime: 0,
      });
    }, 5000);
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  private handleManualReset = () => {
    errorLogger.logInfo("render-loop-boundary", "Manual reset triggered");
    this.setState({
      hasError: false,
      error: null,
      errorCount: 0,
      lastErrorTime: 0,
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="error-boundary-fallback p-4 m-4 border border-red-300 rounded-lg bg-red-50">
          <h2 className="text-lg font-semibold text-red-800 mb-2">
            Something went wrong
          </h2>
          <p className="text-red-700 mb-4">
            {this.state.errorCount > 1
              ? `Multiple errors detected (${this.state.errorCount}). This might be a render loop.`
              : "An error occurred while rendering this component."}
          </p>
          <details className="mb-4">
            <summary className="cursor-pointer text-red-600 hover:text-red-800">
              Error Details
            </summary>
            <pre className="mt-2 p-2 bg-red-100 rounded text-xs overflow-auto max-h-32">
              {this.state.error?.message}
              {"\n\n"}
              {this.state.error?.stack}
            </pre>
          </details>
          <button
            onClick={this.handleManualReset}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default RenderLoopBoundary;
