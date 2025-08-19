import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import api from '../../../lib/api.js';
import { useToast } from '../../../components/Toast.js';
import { useConfirmDialog } from '../../../components/ConfirmDialog.js';

interface Hospital {
  id: string;
  name: string;
  trustId: string | null;
  trust: {
    id: string;
    name: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

interface Trust {
  id: string;
  name: string;
}

interface CreateHospitalData {
  name: string;
  trustId?: string;
}

interface UpdateHospitalData {
  name: string;
  trustId?: string;
}

export default function HospitalsPage() {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingTrustId, setEditingTrustId] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const [newHospitalName, setNewHospitalName] = useState('');
  const [newHospitalTrustId, setNewHospitalTrustId] = useState<string>('');
  
  const { showToast } = useToast();
  const { showConfirmDialog } = useConfirmDialog();
  const queryClient = useQueryClient();

  // Fetch hospitals
  const { data: hospitals = [], isLoading, error } = useQuery({
    queryKey: ['hospitals'],
    queryFn: async () => {
      const response = await api.get('/hospitals');
      return response.data;
    },
  });

  // Fetch trusts for dropdowns
  const { data: trusts = [] } = useQuery({
    queryKey: ['trusts'],
    queryFn: async () => {
      const response = await api.get('/trusts');
      return response.data;
    },
  });

  // Create hospital mutation
  const createMutation = useMutation({
    mutationFn: async (data: CreateHospitalData) => {
      const response = await api.post('/hospitals', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hospitals'] });
      showToast('Hospital created successfully', 'success');
      setIsCreating(false);
      setNewHospitalName('');
      setNewHospitalTrustId('');
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to create hospital', 'error');
    },
  });

  // Update hospital mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateHospitalData }) => {
      const response = await api.put(`/hospitals/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hospitals'] });
      showToast('Hospital updated successfully', 'success');
      setEditingId(null);
      setEditingName('');
      setEditingTrustId('');
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to update hospital', 'error');
    },
  });

  // Delete hospital mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/hospitals/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hospitals'] });
      showToast('Hospital deleted successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to delete hospital', 'error');
    },
  });

  const handleCreate = () => {
    if (!newHospitalName.trim()) {
      showToast('Hospital name is required', 'error');
      return;
    }
    const data: CreateHospitalData = { name: newHospitalName.trim() };
    if (newHospitalTrustId) {
      data.trustId = newHospitalTrustId;
    }
    createMutation.mutate(data);
  };

  const handleUpdate = (id: string) => {
    if (!editingName.trim()) {
      showToast('Hospital name is required', 'error');
      return;
    }
    const data: UpdateHospitalData = { name: editingName.trim() };
    if (editingTrustId) {
      data.trustId = editingTrustId;
    }
    updateMutation.mutate({ id, data });
  };

  const handleDelete = (hospital: Hospital) => {
    showConfirmDialog({
      title: 'Delete Hospital',
      message: `Are you sure you want to delete "${hospital.name}"? This action cannot be undone.`,
      onConfirm: () => deleteMutation.mutate(hospital.id),
    });
  };

  const startEditing = (hospital: Hospital) => {
    setEditingId(hospital.id);
    setEditingName(hospital.name);
    setEditingTrustId(hospital.trustId || '');
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingName('');
    setEditingTrustId('');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading hospitals...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-600">Error loading hospitals</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Hospitals</h1>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          <span>Add Hospital</span>
        </button>
      </div>

      {/* Create new hospital */}
      {isCreating && (
        <div className="p-4 bg-gray-50 rounded-md">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              value={newHospitalName}
              onChange={(e) => setNewHospitalName(e.target.value)}
              placeholder="Enter hospital name"
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && handleCreate()}
            />
            <select
              value={newHospitalTrustId}
              onChange={(e) => setNewHospitalTrustId(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Trust (Optional)</option>
              {trusts.map((trust: Trust) => (
                <option key={trust.id} value={trust.id}>
                  {trust.name}
                </option>
              ))}
            </select>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleCreate}
                disabled={createMutation.isPending}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>Save</span>
              </button>
              <button
                onClick={() => {
                  setIsCreating(false);
                  setNewHospitalName('');
                  setNewHospitalTrustId('');
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hospitals list */}
      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trust
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Updated
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {hospitals.map((hospital: Hospital) => (
                <tr key={hospital.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === hospital.id ? (
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onKeyPress={(e) => e.key === 'Enter' && handleUpdate(hospital.id)}
                      />
                    ) : (
                      <div className="text-sm font-medium text-gray-900">{hospital.name}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === hospital.id ? (
                      <select
                        value={editingTrustId}
                        onChange={(e) => setEditingTrustId(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">No Trust</option>
                        {trusts.map((trust: Trust) => (
                          <option key={trust.id} value={trust.id}>
                            {trust.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="text-sm text-gray-500">
                        {hospital.trust?.name || 'No Trust'}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(hospital.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(hospital.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {editingId === hospital.id ? (
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleUpdate(hospital.id)}
                          disabled={updateMutation.isPending}
                          className="text-green-600 hover:text-green-900 disabled:opacity-50"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => startEditing(hospital)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(hospital)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
