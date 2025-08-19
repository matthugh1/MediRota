import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ChevronDown, 
  User, 
  Settings, 
  LogOut, 
  Play,
  RotateCcw,
  Bell,
  Search,
  Building2
} from 'lucide-react';
import { Menu, Transition } from '@headlessui/react';

interface TopBarProps {
  navCollapsed: boolean;
}

const TopBar: React.FC<TopBarProps> = ({ navCollapsed }) => {
  const [selectedWard, setSelectedWard] = useState('General Ward');
  const [isWardMenuOpen, setIsWardMenuOpen] = useState(false);

  const wards = [
    'General Ward',
    'ICU',
    'Emergency Department',
    'Surgical Ward',
    'Maternity Ward'
  ];

  const getPageTitle = () => {
    const path = window.location.pathname;
    if (path.includes('/planner/demand')) return 'Demand Builder';
    if (path.includes('/planner/schedules')) return 'Schedules';
    if (path.includes('/planner/wards')) return 'Wards';
    if (path.includes('/planner/skills')) return 'Skills';
    if (path.includes('/planner/shift-types')) return 'Shift Types';
    if (path.includes('/planner/rule-sets')) return 'Rule Sets';
    if (path.includes('/planner/locks')) return 'Locks';
    if (path.includes('/planner/metrics')) return 'Metrics';
    if (path.includes('/planner/explain')) return 'Explain';
    return 'Dashboard';
  };

  return (
    <div className="flex items-center justify-between px-6 py-4">
      {/* Left side - Page title and breadcrumb */}
      <div className="flex items-center space-x-4">
        <div>
          <h1 className="h3 text-neutral-900">{getPageTitle()}</h1>
          <p className="caption text-neutral-500">Planner • {selectedWard}</p>
        </div>
      </div>

      {/* Center - Ward selector */}
      <div className="flex items-center space-x-4">
        <div className="relative">
          <Menu as="div" className="relative inline-block text-left">
                         <Menu.Button className="btn-secondary inline-flex items-center justify-center w-full">
              <Building2 className="w-4 h-4 mr-2" />
              {selectedWard}
              <ChevronDown className="w-4 h-4 ml-2" />
            </Menu.Button>
            <Transition
              as={React.Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="card absolute right-0 z-10 w-56 mt-2 origin-top-right shadow-lg">
                <div className="py-1">
                  {wards.map((ward) => (
                    <Menu.Item key={ward}>
                      {({ active }) => (
                        <button
                          onClick={() => setSelectedWard(ward)}
                          className={`
                            ${active ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-700'}
                            group flex items-center w-full px-4 py-2 text-sm transition-colors duration-200
                          `}
                        >
                          {ward}
                          {selectedWard === ward && (
                            <motion.div
                              layoutId="activeWard"
                              className="w-2 h-2 bg-primary-500 rounded-full ml-auto"
                            />
                          )}
                        </button>
                      )}
                    </Menu.Item>
                  ))}
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>

      {/* Right side - Actions and user menu */}
      <div className="flex items-center space-x-3">
        {/* Action buttons */}
        <div className="flex items-center space-x-2">
          <button className="btn-primary">
            <Play className="w-4 h-4 mr-2" />
            Solve
          </button>
          <button className="btn-secondary">
            <RotateCcw className="w-4 h-4 mr-2" />
            Repair
          </button>
        </div>

        {/* Notifications */}
        <button className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg focus-ring transition-colors duration-200">
          <Bell className="w-5 h-5" />
        </button>

        {/* User menu */}
        <Menu as="div" className="relative inline-block text-left">
          <Menu.Button className="inline-flex items-center justify-center w-8 h-8 text-sm font-medium text-neutral-700 bg-neutral-100 border border-neutral-300 rounded-lg hover:bg-neutral-200 focus-ring transition-colors duration-200">
            <User className="w-4 h-4" />
          </Menu.Button>
          <Transition
            as={React.Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="card absolute right-0 z-10 w-48 mt-2 origin-top-right shadow-lg">
              <div className="py-1">
                <Menu.Item>
                  {({ active }) => (
                    <a
                      href="#"
                      className={`
                        ${active ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-700'}
                        group flex items-center px-4 py-2 text-sm transition-colors duration-200
                      `}
                    >
                      <User className="w-4 h-4 mr-3" />
                      Profile
                    </a>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <a
                      href="#"
                      className={`
                        ${active ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-700'}
                        group flex items-center px-4 py-2 text-sm transition-colors duration-200
                      `}
                    >
                      <Settings className="w-4 h-4 mr-3" />
                      Settings
                    </a>
                  )}
                </Menu.Item>
                <div className="border-t border-neutral-200 my-1" />
                <Menu.Item>
                  {({ active }) => (
                    <a
                      href="#"
                      className={`
                        ${active ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-700'}
                        group flex items-center px-4 py-2 text-sm transition-colors duration-200
                      `}
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      Sign out
                    </a>
                  )}
                </Menu.Item>
              </div>
            </Menu.Items>
          </Transition>
        </Menu>
      </div>
    </div>
  );
};

export default TopBar;
