import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class PDFErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    console.error('PDF Error Boundary caught an error:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('PDF Error Boundary details:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-96 bg-red-50 border-2 border-red-200 rounded-lg">
          <div className="text-center p-6 max-w-md">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            
            <h3 className="text-lg font-semibold text-red-900 mb-2">
              PDF Display Error
            </h3>
            
            <p className="text-red-700 text-sm mb-4">
              There was an error displaying the PDF document. This might be due to:
            </p>
            
            <ul className="text-red-600 text-xs text-left mb-6 space-y-1">
              <li>• Corrupted PDF file</li>
              <li>• Invalid signature data</li>
              <li>• Browser compatibility issues</li>
              <li>• Memory limitations</li>
            </ul>
            
            <div className="space-y-3">
              <button
                onClick={this.handleRetry}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors mx-auto"
              >
                <RefreshCw size={16} />
                <span>Try Again</span>
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="block text-red-600 text-sm hover:text-red-800 transition-colors mx-auto"
              >
                Refresh Page
              </button>
            </div>
            
            {this.state.error && (
              <details className="mt-4 text-left">
                <summary className="text-xs text-red-500 cursor-pointer">
                  Technical Details
                </summary>
                <pre className="text-xs text-red-600 mt-2 bg-red-100 p-2 rounded overflow-auto max-h-32">
                  {this.state.error.message}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default PDFErrorBoundary;
