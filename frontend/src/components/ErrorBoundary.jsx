import React from 'react';
import { withTranslation } from 'react-i18next';
import { logger } from '../utils/logger';

/**
 * Error Boundary component to catch and log React rendering errors.
 *
 * NOTE: This uses a class component because React does not provide a
 * hooks-based API for error boundaries (componentDidCatch and
 * getDerivedStateFromError are only available in class components).
 * Once React provides a functional alternative, this should be refactored.
 *
 * Wraps the application and provides a fallback UI when errors occur,
 * while logging the error details for debugging.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    logger.error('React error boundary caught error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    const { t } = this.props;

    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
          <div className="glass-card rounded-xl p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-500/20 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-rose-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <h2 className="text-xl font-bold text-slate-100 mb-2">
              {t('error.appError')}
            </h2>
            <p className="text-slate-400 mb-6">
              {t('error.appErrorDesc')}
            </p>

            {import.meta.env.DEV && this.state.error && (
              <div className="mb-6 p-3 bg-slate-800/50 rounded-lg text-left">
                <p className="text-xs font-mono text-rose-400 break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <button
              onClick={this.handleReload}
              className="btn-primary"
            >
              {t('error.reload')}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default withTranslation()(ErrorBoundary);
