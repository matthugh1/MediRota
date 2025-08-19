import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Building2, 
  Calendar, 
  Globe, 
  Shield, 
  Plus, 
  Trash2, 
  Save,
  ArrowRight,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { policyApi } from '../../../lib/api/policy';
import { queryKeys, invalidateQueries } from '../../../lib/query';
import { useWards } from '../../../lib/hooks';
import { useSchedules } from '../../../lib/hooks';

interface PolicyAssignment {
  id: string;
  scope: 'WARD' | 'SCHEDULE';
  entityId: string;
  entityName: string;
  policyId: string;
  policyLabel: string;
  isActive: boolean;
}

const PolicyAssignmentPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'wards' | 'schedules'>('wards');
  const [selectedEntity, setSelectedEntity] = useState<string>('');
  const [selectedPolicy, setSelectedPolicy] = useState<string>('');
  const queryClient = useQueryClient();

  // Fetch data
  const { data: policies } = useQuery({
    queryKey: queryKeys.policies.lists(),
    queryFn: policyApi.getAllPolicies,
  });

  const { data: wardsData } = useWards();
  const { data: schedulesData } = useSchedules();

  // Fetch assignments from API
  const { data: assignmentsData, isLoading: assignmentsLoading } = useQuery({
    queryKey: ['policy-assignments'],
    queryFn: policyApi.getAssignments,
  });

  const assignments = [
    ...(assignmentsData?.wardAssignments || []),
    ...(assignmentsData?.scheduleAssignments || [])
  ];

  const createAssignmentMutation = useMutation({
    mutationFn: async (assignment: { policyId: string; wardIds?: string[]; scheduleIds?: string[] }) => {
      return policyApi.createAssignments(assignment);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policy-assignments'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.policies.all });
    },
  });

  const deleteAssignmentMutation = useMutation({
    mutationFn: async (assignment: { policyId: string; wardIds?: string[]; scheduleIds?: string[] }) => {
      return policyApi.removeAssignments(assignment.policyId, {
        wardIds: assignment.wardIds,
        scheduleIds: assignment.scheduleIds,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policy-assignments'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.policies.all });
    },
  });

  const getEntityName = (entityId: string, scope: 'WARD' | 'SCHEDULE') => {
    if (scope === 'WARD') {
      return wardsData?.data?.find(w => w.id === entityId)?.name || `Ward ${entityId}`;
    } else {
      const schedule = schedulesData?.data?.find(s => s.id === entityId);
      if (schedule) {
        const ward = wardsData?.data?.find(w => w.id === schedule.wardId);
        return `${ward?.name || 'Unknown Ward'} - ${schedule.objective || 'Unknown Schedule'}`;
      }
      return `Schedule ${entityId}`;
    }
  };

  const getPolicyLabel = (policyId: string) => {
    return policies?.find(p => p.id === policyId)?.label || policyId;
  };

  const handleCreateAssignment = () => {
    if (!selectedEntity || !selectedPolicy) return;

    const assignmentData = {
      policyId: selectedPolicy,
      wardIds: activeTab === 'wards' ? [selectedEntity] : undefined,
      scheduleIds: activeTab === 'schedules' ? [selectedEntity] : undefined,
    };

    createAssignmentMutation.mutate(assignmentData);

    setSelectedEntity('');
    setSelectedPolicy('');
  };

  const filteredAssignments = assignments.filter(a => a.scope === (activeTab === 'wards' ? 'WARD' : 'SCHEDULE'));

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">Policy Assignments</h1>
        <p className="text-neutral-600">
          Manage which policies apply to specific wards and schedules
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-neutral-100 p-1 rounded-lg mb-6">
        <button
          onClick={() => setActiveTab('wards')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
            activeTab === 'wards'
              ? 'bg-white text-neutral-900 shadow-sm'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Ward Policies</span>
        </button>
        <button
          onClick={() => setActiveTab('schedules')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
            activeTab === 'schedules'
              ? 'bg-white text-neutral-900 shadow-sm'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Schedule Policies</span>
        </button>
      </div>

      {/* Create Assignment */}
      <div className="bg-white border border-neutral-200 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">
          Assign Policy to {activeTab === 'wards' ? 'Ward' : 'Schedule'}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              {activeTab === 'wards' ? 'Ward' : 'Schedule'}
            </label>
            <select
              value={selectedEntity}
              onChange={(e) => setSelectedEntity(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Select {activeTab === 'wards' ? 'ward' : 'schedule'}</option>
              {activeTab === 'wards' 
                ? wardsData?.data?.map(ward => (
                    <option key={ward.id} value={ward.id}>{ward.name}</option>
                  ))
                : schedulesData?.data?.map(schedule => (
                    <option key={schedule.id} value={schedule.id}>{schedule.objective}</option>
                  ))
              }
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Policy
            </label>
            <select
              value={selectedPolicy}
              onChange={(e) => setSelectedPolicy(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Select policy</option>
              {policies?.map(policy => (
                <option key={policy.id} value={policy.id}>{policy.label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleCreateAssignment}
              disabled={!selectedEntity || !selectedPolicy || createAssignmentMutation.isPending}
              className="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {createAssignmentMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Assigning...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Assign Policy
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Current Assignments */}
      <div className="bg-white border border-neutral-200 rounded-lg">
        <div className="px-6 py-4 border-b border-neutral-200">
          <h2 className="text-lg font-semibold text-neutral-900">
            Current {activeTab === 'wards' ? 'Ward' : 'Schedule'} Policy Assignments
          </h2>
        </div>

        <div className="divide-y divide-neutral-200">
          {filteredAssignments.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <Shield className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
              <p className="text-neutral-600">
                No {activeTab === 'wards' ? 'ward' : 'schedule'} policy assignments yet.
              </p>
            </div>
          ) : (
            filteredAssignments.map((assignment) => (
              <motion.div
                key={assignment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-6 py-4 hover:bg-neutral-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      {activeTab === 'wards' ? (
                        <Building2 className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Calendar className="w-4 h-4 text-green-600" />
                      )}
                      <span className="text-sm font-medium text-neutral-600">
                        {assignment.entityName}
                      </span>
                    </div>
                    
                    <ArrowRight className="w-4 h-4 text-neutral-400" />
                    
                    <div className="flex items-center space-x-2">
                      <Shield className="w-4 h-4 text-purple-600" />
                      <span className="font-medium text-neutral-900">
                        {assignment.policyLabel}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1">
                      {assignment.isActive ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600" />
                      )}
                      <span className={`text-sm ${assignment.isActive ? 'text-green-600' : 'text-red-600'}`}>
                        {assignment.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => deleteAssignmentMutation.mutate({
                      policyId: assignment.policyId,
                      wardIds: assignment.scope === 'WARD' ? [assignment.entityId] : undefined,
                      scheduleIds: assignment.scope === 'SCHEDULE' ? [assignment.entityId] : undefined,
                    })}
                    disabled={deleteAssignmentMutation.isPending}
                    className="inline-flex items-center px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Remove
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PolicyAssignmentPage;
