import React from 'react';
import { AlertTriangle, RefreshCw, XCircle } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  error?: Error | string;
  onRetry?: () => void;
  onDismiss?: () => void;
  variant?: 'page' | 'inline' | 'toast';
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message,
  error,
  onRetry,
  onDismiss,
  variant = 'page',
  className = '',
}) => {
  const errorMessage = message || (error instanceof Error ? error.message : error) || 'An unexpected error occurred.';

  if (variant === 'toast') {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-start">
          <XCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-red-800">{title}</h3>
            <p className="text-sm text-red-700 mt-1">{errorMessage}</p>
          </div>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="ml-3 text-red-400 hover:text-red-600"
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-start">
          <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-red-800">{title}</h3>
            <p className="text-sm text-red-700 mt-1">{errorMessage}</p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="mt-2 inline-flex items-center text-sm text-red-600 hover:text-red-800"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Try again
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Page variant (default)
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 ${className}`}>
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <AlertTriangle className="w-8 h-8 text-red-600" />
      </div>
      
      <h3 className="text-lg font-medium text-zinc-900 mb-2">{title}</h3>
      
      <p className="text-sm text-zinc-600 text-center max-w-sm mb-6">
        {errorMessage}
      </p>
      
      <div className="flex items-center space-x-3">
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try again
          </button>
        )}
        
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
};

// Predefined error states
export const ErrorStateNetwork: React.FC<{ onRetry?: () => void }> = ({ onRetry }) => (
  <ErrorState
    title="Network Error"
    message="Unable to connect to the server. Please check your internet connection and try again."
    onRetry={onRetry}
  />
);

export const ErrorStateNotFound: React.FC<{ resource?: string }> = ({ resource = 'item' }) => (
  <ErrorState
    title="Not Found"
    message={`The ${resource} you're looking for doesn't exist or has been removed.`}
  />
);

export const ErrorStateUnauthorized: React.FC = () => (
  <ErrorState
    title="Access Denied"
    message="You don't have permission to view this content. Please contact your administrator."
  />
);

export const ErrorStateServer: React.FC<{ onRetry?: () => void }> = ({ onRetry }) => (
  <ErrorState
    title="Server Error"
    message="Something went wrong on our end. Please try again later."
    onRetry={onRetry}
  />
);
