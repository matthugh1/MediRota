import React, { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ColumnDef } from '@tanstack/react-table';
import { useHotkeys } from 'react-hotkeys-hook';
import { DataTable } from './components/DataTable';
import { DrawerForm } from './components/DrawerForm';
import { FormField, SelectField } from './components/FormFields';
import { RulesEditor } from './components/RulesEditor';
import { useWards, useRuleSets, useCreateRuleSet, useUpdateRuleSet, useDeleteRuleSet, RuleSet, Ward } from '../../../lib/hooks';
import { useToastSuccess, useToastError, useConfirmDelete } from '../../../components';

const ruleSchema = z.object({
  key: z.string().min(1, 'Rule key is required'),
  value: z.string().min(1, 'Rule value is required'),
});

const ruleSetSchema = z.object({
  name: z.string().min(1, 'Rule set name is required').max(100, 'Rule set name must be less than 100 characters'),
  description: z.string().optional(),
  wardId: z.string().min(1, 'Ward is required'),
  active: z.boolean(),
  rules: z.array(ruleSchema).min(1, 'At least one rule is required'),
});

type RuleSetFormData = z.infer<typeof ruleSetSchema>;

const columns: ColumnDef<RuleSet>[] = [
  {
    accessorKey: 'name',
    header: 'Rule Set Name',
    cell: ({ row }) => (
      <div>
        <div className="font-medium text-zinc-900">{row.getValue('name')}</div>
        {row.original.description && (
          <div className="text-sm text-zinc-500">{row.original.description}</div>
        )}
      </div>
    ),
  },
  {
    accessorKey: 'wardId',
    header: 'Ward',
    cell: ({ row }) => (
      <div className="text-sm text-zinc-900">
        {/* This would need to be populated with actual ward data */}
        Ward ID: {row.getValue('wardId')}
      </div>
    ),
  },
  {
    accessorKey: 'rules',
    header: 'Rules',
    cell: ({ row }) => (
      <div className="text-sm text-zinc-500">
        {row.original.rules?.length || 0} rules
      </div>
    ),
  },
  {
    accessorKey: 'active',
    header: 'Status',
    cell: ({ row }) => (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
        row.getValue('active') 
          ? 'bg-green-100 text-green-800' 
          : 'bg-zinc-100 text-zinc-800'
      }`}>
        {row.getValue('active') ? 'Active' : 'Inactive'}
      </span>
    ),
  },
  {
    accessorKey: 'createdAt',
    header: 'Created',
    cell: ({ row }) => (
      <div className="text-sm text-zinc-500">
        {new Date(row.getValue('createdAt')).toLocaleDateString()}
      </div>
    ),
  },
];

export default function RuleSetsPage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingRuleSet, setEditingRuleSet] = useState<RuleSet | null>(null);
  const [selectedWardId, setSelectedWardId] = useState<string>('');
  
  const { data: wardsData, isLoading: wardsLoading } = useWards();
  const { data: ruleSetsData, isLoading: ruleSetsLoading } = useRuleSets(selectedWardId || 'all');
  const createRuleSetMutation = useCreateRuleSet();
  const updateRuleSetMutation = useUpdateRuleSet();
  const deleteRuleSetMutation = useDeleteRuleSet();
  
  const showSuccess = useToastSuccess();
  const showError = useToastError();
  const confirmDelete = useConfirmDelete();

  const form = useForm<RuleSetFormData>({
    resolver: zodResolver(ruleSetSchema),
    defaultValues: {
      name: '',
      description: '',
      wardId: '',
      active: false,
      rules: [
        { key: 'minRestHours', value: '11' },
        { key: 'maxConsecutiveNights', value: '3' },
        { key: 'oneShiftPerDay', value: 'true' },
      ],
    },
  });

  // Keyboard shortcuts
  useHotkeys('n', (e) => {
    e.preventDefault();
    handleNew();
  });

  useHotkeys('/', (e) => {
    e.preventDefault();
    const searchInput = document.querySelector('input[placeholder="Search..."]') as HTMLInputElement;
    if (searchInput) {
      searchInput.focus();
    }
  });

  const handleNew = () => {
    setEditingRuleSet(null);
    form.reset({
      name: '',
      description: '',
      wardId: selectedWardId || '',
      active: false,
      rules: [
        { key: 'minRestHours', value: '11' },
        { key: 'maxConsecutiveNights', value: '3' },
        { key: 'oneShiftPerDay', value: 'true' },
      ],
    });
    setIsDrawerOpen(true);
  };

  const handleEdit = (ruleSet: RuleSet) => {
    setEditingRuleSet(ruleSet);
    form.reset({
      name: ruleSet.name,
      description: ruleSet.description || '',
      wardId: ruleSet.wardId,
      active: ruleSet.active,
      rules: ruleSet.rules || [],
    });
    setIsDrawerOpen(true);
  };

  const handleDelete = (ruleSet: RuleSet) => {
    confirmDelete(
      'Delete Rule Set',
      `Are you sure you want to delete "${ruleSet.name}"? This action cannot be undone.`,
      async () => {
        try {
          await deleteRuleSetMutation.mutateAsync(ruleSet.id);
          showSuccess('Rule set deleted successfully');
        } catch (error) {
          showError('Failed to delete rule set', error instanceof Error ? error.message : 'Unknown error');
        }
      }
    );
  };

  const handleSubmit = async (data: RuleSetFormData) => {
    try {
      // Transform form data to API format
      const apiData = {
        name: data.name,
        description: data.description,
        wardId: data.wardId,
        active: data.active,
        rules: data.rules.map(rule => ({
          key: rule.key,
          value: rule.value,
        })),
      };

      if (editingRuleSet) {
        await updateRuleSetMutation.mutateAsync({
          id: editingRuleSet.id,
          data: apiData as any,
        });
        showSuccess('Rule set updated successfully');
      } else {
        await createRuleSetMutation.mutateAsync(apiData as any);
        showSuccess('Rule set created successfully');
      }
      setIsDrawerOpen(false);
    } catch (error) {
      showError(
        editingRuleSet ? 'Failed to update rule set' : 'Failed to create rule set',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setEditingRuleSet(null);
    form.reset();
  };

  const handleActivateRuleSet = async (ruleSet: RuleSet) => {
    try {
      await updateRuleSetMutation.mutateAsync({
        id: ruleSet.id,
        data: { active: true },
      });
      showSuccess('Rule set activated successfully');
    } catch (error) {
      showError('Failed to activate rule set', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const wardOptions = wardsData?.data?.map(ward => ({
    value: ward.id,
    label: ward.name,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Rule Sets</h1>
        <p className="text-zinc-600">Manage scheduling rules and constraints for wards.</p>
      </div>

      {/* Ward Filter */}
      <div className="bg-white border border-zinc-200 rounded-lg p-4">
        <label className="block text-sm font-medium text-zinc-700 mb-2">
          Filter by Ward
        </label>
        <select
          value={selectedWardId}
          onChange={(e) => setSelectedWardId(e.target.value)}
          className="w-full max-w-xs px-3 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          <option value="">All Wards</option>
          {wardOptions.map(ward => (
            <option key={ward.value} value={ward.value}>
              {ward.label}
            </option>
          ))}
        </select>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={ruleSetsData?.data || []}
        isLoading={ruleSetsLoading}
        onNew={handleNew}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Drawer Form */}
      <DrawerForm
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        title={editingRuleSet ? 'Edit Rule Set' : 'New Rule Set'}
        onSubmit={form.handleSubmit(handleSubmit)}
        isLoading={createRuleSetMutation.isPending || updateRuleSetMutation.isPending}
        submitText={editingRuleSet ? 'Update' : 'Create'}
      >
        <FormProvider {...form}>
          <div className="space-y-6">
            <FormField
              name="name"
              label="Rule Set Name"
              placeholder="e.g., Standard Rules, Night Shift Rules"
              required
            />
            
            <FormField
              name="description"
              label="Description"
              type="textarea"
              placeholder="Optional description of this rule set"
              rows={3}
            />
            
            <SelectField
              name="wardId"
              label="Ward"
              options={wardOptions}
              placeholder="Select a ward"
              required
            />
            
            <FormField
              name="active"
              label="Active"
              type="checkbox"
            />
            
            <RulesEditor
              name="rules"
              label="Rules"
            />
            
            <div className="text-sm text-zinc-500">
              <p>Only one rule set can be active per ward at a time. Activating this rule set will deactivate any other active rule sets for the selected ward.</p>
            </div>
          </div>
        </FormProvider>
      </DrawerForm>
    </div>
  );
}
