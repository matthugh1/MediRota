import React from 'react';
import { LucideIcon, Plus, Search, FileText, Users, Calendar } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  };
  className?: string;
}

const defaultIcons = {
  default: FileText,
  search: Search,
  create: Plus,
  users: Users,
  calendar: Calendar,
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  className = '',
}) => {
  const DefaultIcon = defaultIcons.default;
  const DisplayIcon = Icon || DefaultIcon;

  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 ${className}`}>
      <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mb-4">
        <DisplayIcon className="w-8 h-8 text-zinc-400" />
      </div>
      
      <h3 className="text-lg font-medium text-zinc-900 mb-2">{title}</h3>
      
      {description && (
        <p className="text-sm text-zinc-600 text-center max-w-sm mb-6">
          {description}
        </p>
      )}
      
      {action && (
        <button
          onClick={action.onClick}
          className={`
            inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors
            ${action.variant === 'primary'
              ? 'bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
              : 'bg-white text-zinc-700 border border-zinc-300 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
            }
          `}
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

// Predefined empty states
export const EmptyStateSearch: React.FC<{ query: string }> = ({ query }) => (
  <EmptyState
    icon={defaultIcons.search}
    title="No results found"
    description={`No items match "${query}". Try adjusting your search terms.`}
  />
);

export const EmptyStateCreate: React.FC<{
  title: string;
  description?: string;
  onCreate: () => void;
}> = ({ title, description, onCreate }) => (
  <EmptyState
    icon={defaultIcons.create}
    title={title}
    description={description}
    action={{
      label: 'Create new',
      onClick: onCreate,
      variant: 'primary',
    }}
  />
);

export const EmptyStateNoData: React.FC<{
  title: string;
  description?: string;
}> = ({ title, description }) => (
  <EmptyState
    icon={defaultIcons.default}
    title={title}
    description={description || 'No data available yet.'}
  />
);
