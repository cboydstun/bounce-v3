import React, { Component, ReactNode } from "react";
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonButton,
} from "@ionic/react";
import { errorLogger } from "../../services/debug/errorLogger";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error
    errorLogger.logError("error-boundary", "Component crashed", error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
    });

    this.setState({ error, errorInfo });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <IonCard color="danger">
          <IonCardHeader>
            <IonCardTitle className="text-white">
              Something went wrong
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <p className="text-white text-sm mb-4">
              An error occurred in this component. This has been logged for
              debugging.
            </p>
            {this.state.error && (
              <details className="mb-4">
                <summary className="text-white text-xs cursor-pointer">
                  Error Details
                </summary>
                <pre className="text-white text-xs mt-2 overflow-auto">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <IonButton
              fill="outline"
              color="light"
              size="small"
              onClick={this.handleReset}
            >
              Try Again
            </IonButton>
          </IonCardContent>
        </IonCard>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
