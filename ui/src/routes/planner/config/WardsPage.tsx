import React, { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ColumnDef } from '@tanstack/react-table';
import { useHotkeys } from 'react-hotkeys-hook';
import { DataTable } from './components/DataTable';
import { DrawerForm } from './components/DrawerForm';
import { FormField } from './components/FormFields';
import { useWards, useCreateWard, useUpdateWard, useDeleteWard, Ward } from '../../../lib/hooks';
import { useToastSuccess, useToastError, useConfirmDelete } from '../../../components';

const wardSchema = z.object({
  name: z.string().min(1, 'Ward name is required').max(100, 'Ward name must be less than 100 characters'),
  hourlyGranularity: z.boolean(),
});

type WardFormData = z.infer<typeof wardSchema>;

const columns: ColumnDef<Ward>[] = [
  {
    accessorKey: 'name',
    header: 'Ward Name',
    cell: ({ row }) => (
      <div>
        <div className="font-medium text-zinc-900">{row.getValue('name')}</div>
        <div className="text-sm text-zinc-500">ID: {row.original.id}</div>
      </div>
    ),
  },
  {
    accessorKey: 'hourlyGranularity',
    header: 'Granularity',
    cell: ({ row }) => (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
        row.getValue('hourlyGranularity') 
          ? 'bg-blue-100 text-blue-800' 
          : 'bg-zinc-100 text-zinc-800'
      }`}>
        {row.getValue('hourlyGranularity') ? 'Hourly' : 'Daily'}
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

export default function WardsPage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingWard, setEditingWard] = useState<Ward | null>(null);
  
  const { data: wardsData, isLoading } = useWards();
  const createWardMutation = useCreateWard();
  const updateWardMutation = useUpdateWard();
  const deleteWardMutation = useDeleteWard();
  
  const showSuccess = useToastSuccess();
  const showError = useToastError();
  const confirmDelete = useConfirmDelete();

  const form = useForm<WardFormData>({
    resolver: zodResolver(wardSchema),
    defaultValues: {
      name: '',
      hourlyGranularity: false,
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
    setEditingWard(null);
    form.reset({
      name: '',
      hourlyGranularity: false,
    });
    setIsDrawerOpen(true);
  };

  const handleEdit = (ward: Ward) => {
    setEditingWard(ward);
    form.reset({
      name: ward.name,
      hourlyGranularity: ward.hourlyGranularity,
    });
    setIsDrawerOpen(true);
  };

  const handleDelete = (ward: Ward) => {
    confirmDelete(
      'Delete Ward',
      `Are you sure you want to delete "${ward.name}"? This action cannot be undone.`,
      async () => {
        try {
          await deleteWardMutation.mutateAsync(ward.id);
          showSuccess('Ward deleted successfully');
        } catch (error) {
          showError('Failed to delete ward', error instanceof Error ? error.message : 'Unknown error');
        }
      }
    );
  };

  const handleSubmit = async (data: WardFormData) => {
    try {
      if (editingWard) {
        await updateWardMutation.mutateAsync({
          id: editingWard.id,
          data,
        });
        showSuccess('Ward updated successfully');
      } else {
        await createWardMutation.mutateAsync(data);
        showSuccess('Ward created successfully');
      }
      setIsDrawerOpen(false);
    } catch (error) {
      showError(
        editingWard ? 'Failed to update ward' : 'Failed to create ward',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setEditingWard(null);
    form.reset();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Wards</h1>
        <p className="text-zinc-600">Manage hospital wards and their configuration.</p>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={wardsData?.data || []}
        isLoading={isLoading}
        onNew={handleNew}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Drawer Form */}
      <DrawerForm
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        title={editingWard ? 'Edit Ward' : 'New Ward'}
        onSubmit={form.handleSubmit(handleSubmit)}
        isLoading={createWardMutation.isPending || updateWardMutation.isPending}
        submitText={editingWard ? 'Update' : 'Create'}
      >
        <FormProvider {...form}>
          <div className="space-y-6">
            <FormField
              name="name"
              label="Ward Name"
              placeholder="Enter ward name"
              required
            />
            
            <FormField
              name="hourlyGranularity"
              label="Use Hourly Granularity"
              type="checkbox"
            />
            
            <div className="text-sm text-zinc-500">
              <p>When enabled, this ward will use hourly time slots instead of daily shifts.</p>
            </div>
          </div>
        </FormProvider>
      </DrawerForm>
    </div>
  );
}
