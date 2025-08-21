import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ChevronDown, 
  User, 
  Settings, 
  LogOut, 
  Bell,
  Search,
  Building2,
  MapPin
} from 'lucide-react';
import { Menu, Transition } from '@headlessui/react';
import { useOrgScope } from '../../../lib/orgScope.js';
import api from '../../../lib/api.js';

interface Trust {
  id: string;
  name: string;
}

interface Hospital {
  id: string;
  name: string;
  trustId: string;
}

interface TopBarProps {
  navCollapsed: boolean;
}

const TopBar: React.FC<TopBarProps> = ({ navCollapsed }) => {
  const { scope, setTrust, setHospital, isHierarchyEnabled } = useOrgScope();
  const [trusts, setTrusts] = useState<Trust[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(false);

  const getPageTitle = () => {
    const path = window.location.pathname;
    if (path.includes('/planner/demand')) return 'Demand Builder';
    if (path.includes('/planner/schedules')) return 'Schedules';
    if (path.includes('/planner/wards')) return 'Wards';
    if (path.includes('/planner/skills')) return 'Skills';
    if (path.includes('/planner/shift-types')) return 'Shift Types';
    
    if (path.includes('/planner/locks')) return 'Locks';
    if (path.includes('/planner/metrics')) return 'Metrics';
    if (path.includes('/planner/explain')) return 'Explain';
    return 'Dashboard';
  };

  // Load trusts on mount
  useEffect(() => {
    const loadTrusts = async () => {
      try {
        setLoading(true);
        const response = await api.get('/trusts');
        setTrusts(response.data);
      } catch (error) {
        console.error('Failed to load trusts:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTrusts();
  }, []);

  // Load hospitals when trust changes
  useEffect(() => {
    if (!scope.trustId) {
      setHospitals([]);
      return;
    }

    const loadHospitals = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/hospitals?trustId=${scope.trustId}`);
        setHospitals(response.data);
      } catch (error) {
        console.error('Failed to load hospitals:', error);
      } finally {
        setLoading(false);
      }
    };

    loadHospitals();
  }, [scope.trustId]);

  // Render breadcrumb text
  const renderBreadcrumb = () => {
    const items = [];
    if (scope.trustName) {
      items.push(scope.trustName);
    }
    if (scope.hospitalName) {
      items.push(scope.hospitalName);
    }
    
    if (items.length === 0) return null;
    
    return (
      <div className="flex items-center text-sm text-neutral-600">
        <MapPin className="w-4 h-4 mr-2" />
        {items.join(' / ')}
      </div>
    );
  };

  return (
    <div className="flex items-center justify-between px-6 py-4">
      {/* Left side - Page title and breadcrumb */}
      <div className="flex items-center space-x-6">
        <div>
          <h1 className="h3 text-neutral-900">{getPageTitle()}</h1>
          {renderBreadcrumb()}
        </div>
      </div>

      {/* Center - Trust and Hospital selectors */}
      <div className="flex items-center space-x-4">
          {/* Trust Selector */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-neutral-700">Trust:</label>
            <select
              value={scope.trustId || ''}
              onChange={(e) => {
                const trust = trusts.find(t => t.id === e.target.value);
                if (trust) {
                  setTrust(trust.id, trust.name);
                }
              }}
              className="px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
              disabled={loading}
            >
              <option value="">Select Trust</option>
              {trusts.map(trust => (
                <option key={trust.id} value={trust.id}>
                  {trust.name}
                </option>
              ))}
            </select>
          </div>

          {/* Hospital Selector */}
          {scope.trustId && (
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-neutral-700">Hospital:</label>
              <select
                value={scope.hospitalId || ''}
                onChange={(e) => {
                  const hospital = hospitals.find(h => h.id === e.target.value);
                  if (hospital) {
                    setHospital(hospital.id, hospital.name);
                  }
                }}
                className="px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                disabled={loading}
              >
                <option value="">Select Hospital</option>
                {hospitals.map(hospital => (
                  <option key={hospital.id} value={hospital.id}>
                    {hospital.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {loading && (
            <div className="text-sm text-neutral-500">
              Loading...
            </div>
          )}
        </div>

      {/* Right side - Notifications and user menu */}
      <div className="flex items-center space-x-3">
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
