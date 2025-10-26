import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { 
      hasError: true, 
      error,
      errorInfo: null 
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  private handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null,
      errorInfo: null 
    });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="max-w-2xl w-full border-destructive/50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-8 w-8 text-destructive" />
                <div>
                  <CardTitle>Something Went Wrong</CardTitle>
                  <CardDescription>
                    An unexpected error occurred in the application
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {this.state.error && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold">Error Message:</p>
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <code className="text-sm text-destructive">
                      {this.state.error.message}
                    </code>
                  </div>
                </div>
              )}

              {this.state.errorInfo && (
                <details className="text-sm">
                  <summary className="cursor-pointer font-semibold mb-2">
                    Technical Details (Click to expand)
                  </summary>
                  <div className="p-3 bg-muted rounded-lg overflow-auto max-h-64">
                    <pre className="text-xs whitespace-pre-wrap">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </div>
                </details>
              )}

              <div className="flex gap-2 pt-4">
                <Button onClick={this.handleReset} className="flex-1">
                  Reload Application
                </Button>
                <Button 
                  onClick={() => window.history.back()} 
                  variant="outline"
                  className="flex-1"
                >
                  Go Back
                </Button>
              </div>

              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground">
                  If this error persists, please try:
                </p>
                <ul className="text-xs text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                  <li>Clearing your browser cache</li>
                  <li>Logging out and logging back in</li>
                  <li>Checking your internet connection</li>
                  <li>Waiting a few minutes if edge functions are deploying</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
