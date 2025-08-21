import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { trustsApi } from '../../../lib/api/trusts.js';
import { useToast } from '../../../components/Toast.js';
import { useConfirmDialog } from '../../../components/ConfirmDialog.js';

interface Trust {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateTrustData {
  name: string;
}

interface UpdateTrustData {
  name: string;
}

export default function TrustsPage() {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newTrustName, setNewTrustName] = useState('');
  
  const { showToast } = useToast();
  const { showConfirmDialog } = useConfirmDialog();
  const queryClient = useQueryClient();

  // Fetch trusts
  const { data: trusts = [], isLoading, error } = useQuery({
    queryKey: ['trusts'],
    queryFn: async () => {
      const response = await trustsApi.list();
      return response.data;
    },
  });

  // Create trust mutation
  const createMutation = useMutation({
    mutationFn: async (data: CreateTrustData) => {
      const response = await trustsApi.create(data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trusts'] });
      showToast('Trust created successfully', 'success');
      setIsCreating(false);
      setNewTrustName('');
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to create trust', 'error');
    },
  });

  // Update trust mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTrustData }) => {
      const response = await trustsApi.update(id, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trusts'] });
      showToast('Trust updated successfully', 'success');
      setEditingId(null);
      setEditingName('');
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to update trust', 'error');
    },
  });

  // Delete trust mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await trustsApi.remove(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trusts'] });
      showToast('Trust deleted successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to delete trust', 'error');
    },
  });

  const handleCreate = () => {
    if (!newTrustName.trim()) {
      showToast('Trust name is required', 'error');
      return;
    }
    createMutation.mutate({ name: newTrustName.trim() });
  };

  const handleUpdate = (id: string) => {
    if (!editingName.trim()) {
      showToast('Trust name is required', 'error');
      return;
    }
    updateMutation.mutate({ id, data: { name: editingName.trim() } });
  };

  const handleDelete = (trust: Trust) => {
    showConfirmDialog({
      title: 'Delete Trust',
      message: `Are you sure you want to delete "${trust.name}"? This action cannot be undone.`,
      onConfirm: () => deleteMutation.mutate(trust.id),
    });
  };

  const startEditing = (trust: Trust) => {
    setEditingId(trust.id);
    setEditingName(trust.name);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingName('');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading trusts...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-600">Error loading trusts</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Trusts</h1>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          <span>Add Trust</span>
        </button>
      </div>

      {/* Create new trust */}
      {isCreating && (
        <div className="p-4 bg-gray-50 rounded-md">
          <div className="flex items-center space-x-4">
            <input
              type="text"
              value={newTrustName}
              onChange={(e) => setNewTrustName(e.target.value)}
              placeholder="Enter trust name"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && handleCreate()}
            />
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
                setNewTrustName('');
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              <X className="w-4 h-4" />
              <span>Cancel</span>
            </button>
          </div>
        </div>
      )}

      {/* Trusts list */}
      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
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
              {trusts.map((trust: Trust) => (
                <tr key={trust.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === trust.id ? (
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onKeyPress={(e) => e.key === 'Enter' && handleUpdate(trust.id)}
                      />
                    ) : (
                      <div className="text-sm font-medium text-gray-900">{trust.name}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(trust.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(trust.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {editingId === trust.id ? (
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleUpdate(trust.id)}
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
                          onClick={() => startEditing(trust)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(trust)}
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
