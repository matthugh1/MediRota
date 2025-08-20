import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutGrid, 
  Settings, 
  CalendarRange, 
  Table2, 
  Lock, 
  ActivitySquare, 
  Wand2,
  ChevronLeft,
  ChevronRight,
  Building2,
  Users,
  Clock,
  FileText,
  BarChart3,
  Search,
  Shield
} from 'lucide-react';

interface SidebarNavProps {
  collapsed: boolean;
  onToggle: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  badge?: string;
}

interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    id: 'account',
    label: 'Account',
    items: [
      { id: 'trusts', label: 'Trusts', icon: Building2, href: '/planner/config/trusts' },
      { id: 'hospitals', label: 'Hospitals', icon: Building2, href: '/planner/config/hospitals' },
      { id: 'job-roles', label: 'Job Roles', icon: Users, href: '/planner/config/job-roles' },
    ]
  },
  {
    id: 'configure',
    label: 'Configure',
    items: [
      { id: 'wards', label: 'Wards', icon: Building2, href: '/planner/config/wards' },
      { id: 'skills', label: 'Skills', icon: Users, href: '/planner/config/skills' },
      { id: 'staff', label: 'Staff', icon: Users, href: '/planner/staff' },
      { id: 'shift-types', label: 'Shift Types', icon: Clock, href: '/planner/config/shift-types' },
      
      { id: 'policy', label: 'Policy', icon: Shield, href: '/planner/config/policy' },
    ]
  },
  {
    id: 'plan',
    label: 'Plan',
    items: [
      { id: 'demand', label: 'Demand Builder', icon: Table2, href: '/planner/demand' },
      { id: 'schedules', label: 'Schedules', icon: CalendarRange, href: '/planner/schedule' },
    ]
  },
  {
    id: 'operate',
    label: 'Operate',
    items: [
      { id: 'locks', label: 'Locks', icon: Lock, href: '/planner/locks' },
      { id: 'metrics', label: 'Metrics', icon: ActivitySquare, href: '/planner/metrics' },
      { id: 'explain', label: 'Explain', icon: Wand2, href: '/planner/explain' },
    ]
  }
];

const SidebarNav: React.FC<SidebarNavProps> = ({ collapsed, onToggle }) => {
  const currentPath = window.location.pathname;

  return (
    <nav 
      className="h-full flex flex-col"
      aria-label="Primary"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-200">
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="flex items-center space-x-2"
            >
              <LayoutGrid className="w-6 h-6 text-primary-600" />
              <span className="font-semibold text-neutral-900">MediRota</span>
            </motion.div>
          )}
        </AnimatePresence>
        
        <button
          onClick={onToggle}
          className="p-1 rounded-lg hover:bg-neutral-100 focus-ring transition-colors duration-200"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!collapsed}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4 text-neutral-600" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-neutral-600" />
          )}
        </button>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-neutral-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder={collapsed ? "" : "Search..."}
            className="input pl-9 pr-3 py-2 text-sm bg-neutral-50"
            data-search-input
          />
        </div>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto py-4">
        {navGroups.map((group) => (
          <div key={group.id} className="mb-6">
            <AnimatePresence mode="wait">
              {!collapsed && (
                <motion.h3
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-4 mb-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider"
                >
                  {group.label}
                </motion.h3>
              )}
            </AnimatePresence>
            
            <ul className="space-y-1">
              {group.items.map((item) => {
                const isActive = currentPath === item.href;
                return (
                  <li key={item.id}>
                    <a
                      href={item.href}
                      className={`
                        flex items-center px-4 py-2 text-sm font-medium rounded-lg mx-2 transition-colors duration-200
                        ${isActive 
                          ? 'bg-primary-50 text-primary-700 border border-primary-200' 
                          : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900'
                        }
                        focus-ring
                      `}
                    >
                      <item.icon className={`w-4 h-4 ${collapsed ? 'mx-auto' : 'mr-3'}`} />
                      <AnimatePresence mode="wait">
                        {!collapsed && (
                          <motion.span
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: 'auto' }}
                            exit={{ opacity: 0, width: 0 }}
                            className="flex-1"
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                                             {item.badge && !collapsed && (
                         <span className="badge-primary ml-auto">
                           {item.badge}
                         </span>
                       )}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-neutral-200">
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="text-xs text-neutral-500"
            >
              <div className="mb-2">Keyboard shortcuts:</div>
              <div className="space-y-1 text-xs">
                <div><kbd className="px-1 py-0.5 bg-neutral-100 rounded text-xs">[</kbd> Collapse</div>
                <div><kbd className="px-1 py-0.5 bg-neutral-100 rounded text-xs">]</kbd> Expand</div>
                <div><kbd className="px-1 py-0.5 bg-neutral-100 rounded text-xs">g d</kbd> Demand</div>
                <div><kbd className="px-1 py-0.5 bg-neutral-100 rounded text-xs">g s</kbd> Schedule</div>
                <div><kbd className="px-1 py-0.5 bg-neutral-100 rounded text-xs">f</kbd> Search</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
};

export default SidebarNav;
