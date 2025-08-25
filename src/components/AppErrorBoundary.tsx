import type { ReactNode } from 'react';
import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { withTranslation, type WithTranslation } from 'react-i18next';

interface Props {
  children: ReactNode;
  onRetry?: () => void;
}

type AppErrorBoundaryProps = Props & WithTranslation;


interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

class AppErrorBoundary extends React.Component<AppErrorBoundaryProps, State> {
  constructor(props: AppErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    console.error('App Error Boundary caught an error:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App Error Boundary details:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  handleGoHome = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const { t } = this.props;
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-10 h-10 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">
              {t('error_title')}
            </h1>
            <p className="text-gray-600 mb-6">
              {t('error_message')}
            </p>
            <div className="space-y-3 mb-6">
              <button
                onClick={this.handleRetry}
                className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
              >
                <RefreshCw size={16} />
                <span>{t('try_again')}</span>
              </button>
              <button
                onClick={this.handleGoHome}
                className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                <Home size={16} />
                <span>{t('restart_app')}</span>
              </button>
            </div>
            <div className="text-xs text-gray-500 space-y-2">
              <p>{t('persist_message')}</p>
              <ul className="text-left space-y-1">
                <li>• {t('refresh_page')}</li>
                <li>• {t('clear_cache')}</li>
                <li>• {t('use_browser')}</li>
                <li>• {t('try_other_pdf')}</li>
              </ul>
            </div>
            {this.state.error && (
              <details className="mt-6 text-left">
                <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                  {t('technical_details')}
                </summary>
                <div className="mt-3 p-3 bg-gray-100 rounded text-xs text-gray-700 overflow-auto max-h-32">
                  <div className="font-medium mb-2">{t('error_label')}: {this.state.error.message}</div>
                  {this.state.errorInfo && (
                    <pre className="whitespace-pre-wrap text-xs">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default withTranslation('appErrorBoundary')(AppErrorBoundary);
