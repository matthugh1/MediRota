import React, { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ColumnDef } from '@tanstack/react-table';
import { useHotkeys } from 'react-hotkeys-hook';
import { DataTable } from './components/DataTable';
import { DrawerForm } from './components/DrawerForm';
import { FormField, SelectField } from './components/FormFields';
import { useShiftTypes, useCreateShiftType, useUpdateShiftType, useDeleteShiftType, useHospitals, useWards, ShiftType } from '../../../lib/hooks';
import { useToastSuccess, useToastError, useConfirmDelete } from '../../../components';

const shiftTypeSchema = z.object({
  code: z.string().min(1, 'Shift code is required').max(20, 'Shift code must be less than 20 characters'),
  name: z.string().min(1, 'Shift name is required').max(100, 'Shift name must be less than 100 characters'),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Start time must be in HH:MM format'),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'End time must be in HH:MM format'),
  isNight: z.boolean(),
  durationMinutes: z.number().min(1, 'Duration must be at least 1 minute').max(1440, 'Duration cannot exceed 24 hours'),
  scope: z.enum(['TRUST', 'HOSPITAL', 'WARD']).optional(),
  trustId: z.string().optional(),
  hospitalId: z.string().optional(),
  wardId: z.string().optional(),
});

type ShiftTypeFormData = z.infer<typeof shiftTypeSchema>;

const columns: ColumnDef<ShiftType>[] = [
  {
    accessorKey: 'code',
    header: 'Code',
    cell: ({ row }) => (
      <div className="font-mono text-sm bg-zinc-100 px-2 py-1 rounded">
        {row.getValue('code')}
      </div>
    ),
  },
  {
    accessorKey: 'name',
    header: 'Shift Name',
    cell: ({ row }) => (
      <div className="font-medium text-zinc-900">{row.getValue('name')}</div>
    ),
  },
  {
    accessorKey: 'startTime',
    header: 'Start Time',
    cell: ({ row }) => (
      <div className="text-sm text-zinc-900">{row.getValue('startTime')}</div>
    ),
  },
  {
    accessorKey: 'endTime',
    header: 'End Time',
    cell: ({ row }) => (
      <div className="text-sm text-zinc-900">{row.getValue('endTime')}</div>
    ),
  },
  {
    accessorKey: 'durationMinutes',
    header: 'Duration',
    cell: ({ row }) => {
      const minutes = row.getValue('durationMinutes') as number;
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return (
        <div className="text-sm text-zinc-900">
          {hours}h {mins}m
        </div>
      );
    },
  },
  {
    accessorKey: 'isNight',
    header: 'Type',
    cell: ({ row }) => (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
        row.getValue('isNight') 
          ? 'bg-purple-100 text-purple-800' 
          : 'bg-green-100 text-green-800'
      }`}>
        {row.getValue('isNight') ? 'Night' : 'Day'}
      </span>
    ),
  },
  {
    accessorKey: 'scope',
    header: 'Scope',
    cell: ({ row }) => {
      const scope = row.getValue('scope') as string;
      const getScopeColor = (scope: string) => {
        switch (scope) {
          case 'TRUST': return 'bg-blue-100 text-blue-800';
          case 'HOSPITAL': return 'bg-orange-100 text-orange-800';
          case 'WARD': return 'bg-green-100 text-green-800';
          default: return 'bg-gray-100 text-gray-800';
        }
      };
      return (
        <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getScopeColor(scope)}`}>
          {scope || 'TRUST'}
        </span>
      );
    },
  },
];

export default function ShiftTypesPage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingShiftType, setEditingShiftType] = useState<ShiftType | null>(null);
  
  const { data: shiftTypesData, isLoading } = useShiftTypes();
  const { data: hospitalsData } = useHospitals();
  const { data: wardsData } = useWards();
  const createShiftTypeMutation = useCreateShiftType();
  const updateShiftTypeMutation = useUpdateShiftType();
  const deleteShiftTypeMutation = useDeleteShiftType();
  
  const showSuccess = useToastSuccess();
  const showError = useToastError();
  const confirmDelete = useConfirmDelete();

  const form = useForm<ShiftTypeFormData>({
    resolver: zodResolver(shiftTypeSchema),
    defaultValues: {
      code: '',
      name: '',
      startTime: '08:00',
      endTime: '16:00',
      isNight: false,
      durationMinutes: 480,
      scope: 'TRUST',
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
    setEditingShiftType(null);
    form.reset({
      code: '',
      name: '',
      startTime: '08:00',
      endTime: '16:00',
      isNight: false,
      durationMinutes: 480,
      scope: 'TRUST',
    });
    setIsDrawerOpen(true);
  };

  const handleEdit = (shiftType: ShiftType) => {
    setEditingShiftType(shiftType);
    form.reset({
      code: shiftType.code,
      name: shiftType.name,
      startTime: shiftType.startTime,
      endTime: shiftType.endTime,
      isNight: shiftType.isNight,
      durationMinutes: shiftType.durationMinutes,
      scope: shiftType.scope || 'TRUST',
      trustId: shiftType.trustId,
      hospitalId: shiftType.hospitalId,
      wardId: shiftType.wardId,
    });
    setIsDrawerOpen(true);
  };

  const handleDelete = (shiftType: ShiftType) => {
    confirmDelete(
      'Delete Shift Type',
      `Are you sure you want to delete "${shiftType.name}"? This action cannot be undone.`,
      async () => {
        try {
          await deleteShiftTypeMutation.mutateAsync(shiftType.id);
          showSuccess('Shift type deleted successfully');
        } catch (error) {
          showError('Failed to delete shift type', error instanceof Error ? error.message : 'Unknown error');
        }
      }
    );
  };

  const handleSubmit = async (data: ShiftTypeFormData) => {
    try {
      if (editingShiftType) {
        await updateShiftTypeMutation.mutateAsync({
          id: editingShiftType.id,
          data,
        });
        showSuccess('Shift type updated successfully');
      } else {
        await createShiftTypeMutation.mutateAsync(data);
        showSuccess('Shift type created successfully');
      }
      setIsDrawerOpen(false);
    } catch (error) {
      showError(
        editingShiftType ? 'Failed to update shift type' : 'Failed to create shift type',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setEditingShiftType(null);
    form.reset();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Shift Types</h1>
        <p className="text-zinc-600">Manage shift types and their timing configurations.</p>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={shiftTypesData?.data || []}
        isLoading={isLoading}
        onNew={handleNew}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Drawer Form */}
      <DrawerForm
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        title={editingShiftType ? 'Edit Shift Type' : 'New Shift Type'}
        onSubmit={form.handleSubmit(handleSubmit)}
        isLoading={createShiftTypeMutation.isPending || updateShiftTypeMutation.isPending}
        submitText={editingShiftType ? 'Update' : 'Create'}
      >
        <FormProvider {...form}>
          <div className="space-y-6">
            <FormField
              name="code"
              label="Shift Code"
              placeholder="e.g., DAY, NIGHT, EARLY"
              required
            />
            
            <FormField
              name="name"
              label="Shift Name"
              placeholder="e.g., Day Shift, Night Shift, Early Shift"
              required
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                name="startTime"
                label="Start Time"
                type="text"
                placeholder="08:00"
                required
              />
              
              <FormField
                name="endTime"
                label="End Time"
                type="text"
                placeholder="16:00"
                required
              />
            </div>
            
            <FormField
              name="durationMinutes"
              label="Duration (minutes)"
              type="number"
              placeholder="480"
              required
            />
            
            <FormField
              name="isNight"
              label="Night Shift"
              type="checkbox"
            />
            
            {/* Scope Configuration */}
            <div className="border-t border-zinc-200 pt-6">
              <h3 className="text-lg font-medium text-zinc-900 mb-4">Scope Configuration</h3>
              
              <SelectField
                name="scope"
                label="Scope"
                options={[
                  { value: 'TRUST', label: 'Trust' },
                  { value: 'HOSPITAL', label: 'Hospital' },
                  { value: 'WARD', label: 'Ward' },
                ]}
                required
              />
              
              {form.watch('scope') === 'HOSPITAL' && (
                <SelectField
                  name="hospitalId"
                  label="Hospital"
                  options={hospitalsData?.data?.map(hospital => ({
                    value: hospital.id,
                    label: hospital.name
                  })) || []}
                  required
                />
              )}
              
              {form.watch('scope') === 'WARD' && (
                <>
                  <SelectField
                    name="hospitalId"
                    label="Hospital"
                    options={hospitalsData?.data?.map(hospital => ({
                      value: hospital.id,
                      label: hospital.name
                    })) || []}
                    required
                  />
                  <SelectField
                    name="wardId"
                    label="Ward"
                    options={wardsData?.data?.map(ward => ({
                      value: ward.id,
                      label: ward.name
                    })) || []}
                    required
                  />
                </>
              )}
            </div>
            
            <div className="text-sm text-zinc-500">
              <p>Times should be in 24-hour format (HH:MM). Duration is calculated automatically but can be overridden.</p>
            </div>
          </div>
        </FormProvider>
      </DrawerForm>
    </div>
  );
}
