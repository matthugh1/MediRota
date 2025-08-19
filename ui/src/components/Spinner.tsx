import React from 'react';
import { Loader2 } from 'lucide-react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  text?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
};

export const Spinner: React.FC<SpinnerProps> = ({ 
  size = 'md', 
  className = '', 
  text 
}) => {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <Loader2 className={`${sizeClasses[size]} animate-spin text-indigo-600`} />
      {text && (
        <p className="mt-2 text-sm text-zinc-600">{text}</p>
      )}
    </div>
  );
};

// Inline spinner for buttons and small spaces
export const InlineSpinner: React.FC<Omit<SpinnerProps, 'text'>> = ({ 
  size = 'sm', 
  className = '' 
}) => {
  return (
    <Loader2 className={`${sizeClasses[size]} animate-spin text-current ${className}`} />
  );
};

// Page loading spinner
export const PageSpinner: React.FC<{ text?: string }> = ({ text = 'Loading...' }) => {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Spinner size="lg" text={text} />
    </div>
  );
};

// Overlay spinner for modals and overlays
export const OverlaySpinner: React.FC<{ text?: string }> = ({ text = 'Loading...' }) => {
  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 shadow-lg">
        <Spinner size="lg" text={text} />
      </div>
    </div>
  );
};
