import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface CollapsiblePanelProps {
  title: string;
  children: React.ReactNode;
  defaultCollapsed?: boolean;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
}

export function CollapsiblePanel({
  title,
  children,
  defaultCollapsed = false,
  className = '',
  headerClassName = '',
  contentClassName = ''
}: CollapsiblePanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  return (
    <div className={`bg-white border border-neutral-200 rounded-lg ${className}`}>
      {/* Header */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={`w-full flex items-center justify-between p-4 text-left hover:bg-neutral-50 transition-colors ${headerClassName}`}
      >
        <h3 className="text-sm font-medium text-neutral-900">{title}</h3>
        {isCollapsed ? (
          <ChevronRight className="w-4 h-4 text-neutral-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-neutral-500" />
        )}
      </button>

      {/* Content */}
      {!isCollapsed && (
        <div className={`px-4 pb-4 ${contentClassName}`}>
          {children}
        </div>
      )}
    </div>
  );
}
