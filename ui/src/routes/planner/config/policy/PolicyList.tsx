import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Shield,
  Building2,
  Calendar,
  Globe,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { policyApi } from '../../../../lib/api/policy';
import { queryKeys } from '../../../../lib/query';

interface Policy {
  id: string;
  scope: 'ORG' | 'WARD' | 'SCHEDULE';
  wardId?: string;
  scheduleId?: string;
  label: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const PolicyList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [scopeFilter, setScopeFilter] = useState<'ALL' | 'ORG' | 'WARD' | 'SCHEDULE'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  const { data: policies, isLoading, error } = useQuery({
    queryKey: queryKeys.policies.lists(),
    queryFn: policyApi.getAllPolicies,
    retry: 1,
    onError: (error) => {
      console.error('Policy API Error:', error);
    },
  });

  const filteredPolicies = policies?.filter((policy: Policy) => {
    const matchesSearch = policy.label.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesScope = scopeFilter === 'ALL' || policy.scope === scopeFilter;
    const matchesStatus = statusFilter === 'ALL' || 
      (statusFilter === 'ACTIVE' && policy.isActive) ||
      (statusFilter === 'INACTIVE' && !policy.isActive);
    
    return matchesSearch && matchesScope && matchesStatus;
  }) || [];

  const getScopeIcon = (scope: string) => {
    switch (scope) {
      case 'ORG':
        return <Globe className="w-4 h-4" />;
      case 'WARD':
        return <Building2 className="w-4 h-4" />;
      case 'SCHEDULE':
        return <Calendar className="w-4 h-4" />;
      default:
        return <Shield className="w-4 h-4" />;
    }
  };

  const getScopeLabel = (scope: string) => {
    switch (scope) {
      case 'ORG':
        return 'Organization';
      case 'WARD':
        return 'Ward';
      case 'SCHEDULE':
        return 'Schedule';
      default:
        return scope;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-neutral-900 mb-2">Error loading policies</h3>
        <p className="text-neutral-600">Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Policy Configuration</h1>
          <p className="text-neutral-600 mt-1">
            Manage solver policies for different scopes and configurations
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center space-x-2 px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 focus-ring transition-colors duration-200"
            onClick={() => window.location.href = '/planner/config/policy/assignments'}
          >
            <Shield className="w-4 h-4" />
            <span>Assignments</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus-ring transition-colors duration-200"
            onClick={() => window.location.href = '/planner/config/policy/new'}
          >
            <Plus className="w-4 h-4" />
            <span>New Policy</span>
          </motion.button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-neutral-200 p-4">
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search policies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Scope Filter */}
          <select
            value={scopeFilter}
            onChange={(e) => setScopeFilter(e.target.value as any)}
            className="px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="ALL">All Scopes</option>
            <option value="ORG">Organization</option>
            <option value="WARD">Ward</option>
            <option value="SCHEDULE">Schedule</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      {/* Policies List */}
      <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
        {filteredPolicies.length === 0 ? (
          <div className="text-center py-12">
            <Shield className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 mb-2">No policies found</h3>
            <p className="text-neutral-600 mb-4">
              {searchTerm || scopeFilter !== 'ALL' || statusFilter !== 'ALL' 
                ? 'Try adjusting your filters.' 
                : 'Create your first policy to get started.'
              }
            </p>
                         {!searchTerm && scopeFilter === 'ALL' && statusFilter === 'ALL' && (
               <button
                 onClick={() => window.location.href = '/planner/config/policy/new'}
                 className="inline-flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus-ring transition-colors duration-200"
               >
                <Plus className="w-4 h-4" />
                <span>Create Policy</span>
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-neutral-200">
            {filteredPolicies.map((policy: Policy) => (
              <motion.div
                key={policy.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 hover:bg-neutral-50 transition-colors duration-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      {getScopeIcon(policy.scope)}
                      <span className="text-sm font-medium text-neutral-600">
                        {getScopeLabel(policy.scope)}
                      </span>
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-neutral-900">{policy.label}</h3>
                      <p className="text-sm text-neutral-600">
                        {policy.wardId && `Ward: ${policy.wardId}`}
                        {policy.scheduleId && `Schedule: ${policy.scheduleId}`}
                        {!policy.wardId && !policy.scheduleId && 'Organization-wide'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    {/* Status */}
                    <div className="flex items-center space-x-2">
                      {policy.isActive ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                      <span className={`text-sm font-medium ${
                        policy.isActive ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {policy.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                                             <button
                         onClick={() => window.location.href = `/planner/config/policy/${policy.id}`}
                         className="p-1 rounded hover:bg-neutral-200 transition-colors duration-200"
                         title="View"
                       >
                        <Eye className="w-4 h-4 text-neutral-600" />
                      </button>
                                             <button
                         onClick={() => window.location.href = `/planner/config/policy/${policy.id}/edit`}
                         className="p-1 rounded hover:bg-neutral-200 transition-colors duration-200"
                         title="Edit"
                       >
                        <Edit className="w-4 h-4 text-neutral-600" />
                      </button>
                      <button
                        className="p-1 rounded hover:bg-neutral-200 transition-colors duration-200"
                        title="More options"
                      >
                        <MoreVertical className="w-4 h-4 text-neutral-600" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PolicyList;
