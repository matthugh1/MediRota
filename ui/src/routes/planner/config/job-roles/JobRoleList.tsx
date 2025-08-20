import React, { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ColumnDef } from '@tanstack/react-table';
import { useHotkeys } from 'react-hotkeys-hook';
import { format } from 'date-fns';
import { DataTable } from '../components/DataTable';
import { DrawerForm } from '../components/DrawerForm';
import { FormField } from '../components/FormFields';
import { useToastSuccess, useToastError, useConfirmDelete } from '../../../../components';
import { jobRolesApi, JobRole } from '../../../../lib/api/jobRoles.js';

const jobRoleSchema = z.object({
  code: z.string().min(1, 'Job role code is required').max(20, 'Job role code must be less than 20 characters'),
  name: z.string().min(1, 'Job role name is required').max(100, 'Job role name must be less than 100 characters'),
});

type JobRoleFormData = z.infer<typeof jobRoleSchema>;

const columns: ColumnDef<JobRole>[] = [
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
    header: 'Job Role Name',
    cell: ({ row }) => (
      <div className="font-medium text-zinc-900">{row.getValue('name')}</div>
    ),
  },
  {
    accessorKey: 'createdAt',
    header: 'Created',
    cell: ({ row }) => {
      const createdAt = row.getValue('createdAt') as string;
      const formattedDate = createdAt ? format(new Date(createdAt), 'dd MMM yyyy') : '—';
      return (
        <div className="text-sm text-zinc-500">
          {formattedDate}
        </div>
      );
    },
  },
];

export default function JobRoleList() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingJobRole, setEditingJobRole] = useState<JobRole | null>(null);
  const [jobRoles, setJobRoles] = useState<JobRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const showSuccess = useToastSuccess();
  const showError = useToastError();
  const confirmDelete = useConfirmDelete();

  const form = useForm<JobRoleFormData>({
    resolver: zodResolver(jobRoleSchema),
    defaultValues: {
      code: '',
      name: '',
    },
  });

  // Load job roles
  React.useEffect(() => {
    const loadJobRoles = async () => {
      try {
        setIsLoading(true);
        const response = await jobRolesApi.list();
        setJobRoles(response.data || []);
      } catch (error) {
        showError('Failed to load job roles', error instanceof Error ? error.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    loadJobRoles();
  }, [showError]);

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
    setEditingJobRole(null);
    form.reset({
      code: '',
      name: '',
    });
    setIsDrawerOpen(true);
  };

  const handleEdit = (jobRole: JobRole) => {
    setEditingJobRole(jobRole);
    form.reset({
      code: jobRole.code,
      name: jobRole.name,
    });
    setIsDrawerOpen(true);
  };

  const handleDelete = (jobRole: JobRole) => {
    confirmDelete(
      'Delete Job Role',
      `Are you sure you want to delete "${jobRole.name}"? This action cannot be undone.`,
      async () => {
        try {
          await jobRolesApi.remove(jobRole.id);
          setJobRoles(jobRoles.filter(jr => jr.id !== jobRole.id));
          showSuccess('Job role deleted successfully');
        } catch (error) {
          showError('Failed to delete job role', error instanceof Error ? error.message : 'Unknown error');
        }
      }
    );
  };

  const handleSubmit = async (data: JobRoleFormData) => {
    try {
      if (editingJobRole) {
        const updated = await jobRolesApi.update(editingJobRole.id, data);
        setJobRoles(jobRoles.map(jr => jr.id === editingJobRole.id ? updated : jr));
        showSuccess('Job role updated successfully');
      } else {
        const created = await jobRolesApi.create(data);
        setJobRoles([...jobRoles, created]);
        showSuccess('Job role created successfully');
      }
      setIsDrawerOpen(false);
    } catch (error) {
      showError(
        editingJobRole ? 'Failed to update job role' : 'Failed to create job role',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setEditingJobRole(null);
    form.reset();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Job Roles</h1>
        <p className="text-zinc-600">Manage job roles for staff members.</p>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={jobRoles}
        isLoading={isLoading}
        onNew={handleNew}
        onEdit={handleEdit}
        onDelete={handleDelete}
        emptyMessage="No job roles yet. Create one to assign to staff."
      />

      {/* Drawer Form */}
      <DrawerForm
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        title={editingJobRole ? 'Edit Job Role' : 'New Job Role'}
        onSubmit={form.handleSubmit(handleSubmit)}
        isLoading={false}
        submitText={editingJobRole ? 'Update' : 'Create'}
      >
        <FormProvider {...form}>
          <div className="space-y-6">
            <FormField
              name="code"
              label="Job Role Code"
              placeholder="e.g., nurse, consultant, radiographer"
              required
            />
            
            <FormField
              name="name"
              label="Job Role Name"
              placeholder="e.g., Nurse, Consultant, Radiographer"
              required
            />
            
            <div className="text-sm text-zinc-500">
              <p>The job role code is used internally and should be short and unique.</p>
            </div>
          </div>
        </FormProvider>
      </DrawerForm>
    </div>
  );
}
