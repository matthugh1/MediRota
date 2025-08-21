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
import { useOrgScope } from '../../../../lib/orgScope.js';

import { TrustMultiSelect } from '../../../../components/trust-select/TrustMultiSelect.js';
import { HospitalMultiSelect } from '../../../../components/hospital-select/HospitalMultiSelect.js';
import { useTrustOptions } from '../../../../components/trust-select/useTrustOptions.js';
import { useHospitalOptions } from '../../../../components/hospital-select/useHospitalOptions.js';

const jobRoleSchema = z.object({
  code: z.string().min(1, 'Job role code is required').max(20, 'Job role code must be less than 20 characters'),
  name: z.string().min(1, 'Job role name is required').max(100, 'Job role name must be less than 100 characters'),
  scope: z.enum(['TRUST', 'HOSPITAL']).optional(),
  trustIds: z.array(z.string()).optional(),
  hospitalIds: z.array(z.string()).optional(),
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
    accessorKey: 'scope',
    header: 'Scope',
    cell: ({ row }) => {
      const scope = row.getValue('scope') as string;
      const trust = row.original.trust;
      const hospital = row.original.hospital;
      
      if (!scope) {
        return <div className="text-sm text-zinc-400">Global</div>;
      }
      
      if (scope === 'TRUST' && trust) {
        return (
          <div className="text-sm">
            <span className="text-blue-600 font-medium">Trust:</span> {trust.name}
          </div>
        );
      }
      
      if (scope === 'HOSPITAL' && hospital) {
        return (
          <div className="text-sm">
            <span className="text-green-600 font-medium">Hospital:</span> {hospital.name}
          </div>
        );
      }
      
      return <div className="text-sm text-zinc-500">{scope}</div>;
    },
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

  const { hospitalId, trustId } = useOrgScope();
  const { trusts, isLoading: trustsLoading, error: trustsError } = useTrustOptions();
  const { hospitals, isLoading: hospitalsLoading, error: hospitalsError } = useHospitalOptions();
  

  
  const form = useForm<JobRoleFormData>({
    resolver: zodResolver(jobRoleSchema),
    defaultValues: {
      code: '',
      name: '',
      scope: undefined,
      trustIds: [],
      hospitalIds: [],
    },
  });

  // Load job roles
  React.useEffect(() => {
    const loadJobRoles = async () => {
      try {
        setIsLoading(true);
        const params: any = {};
        
        // Apply organizational filtering if hierarchy is enabled
        if (ORG_HIERARCHY_ENABLED) {
          if (hospitalId) {
            params.hospitalId = hospitalId;
          } else if (trustId) {
            params.trustId = trustId;
          }
        }
        
        const response = await jobRolesApi.list(params);
        setJobRoles(response.data || []);
      } catch (error) {
        showError('Failed to load job roles', error instanceof Error ? error.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    loadJobRoles();
  }, [showError, hospitalId, trustId]);

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
      scope: undefined,
      trustIds: [],
      hospitalIds: [],
    });
    setIsDrawerOpen(true);
  };

  const handleEdit = (jobRole: JobRole) => {
    setEditingJobRole(jobRole);
    form.reset({
      code: jobRole.code,
      name: jobRole.name,
      scope: jobRole.scope,
      trustIds: jobRole.trust ? [jobRole.trust.id] : [],
      hospitalIds: jobRole.hospital ? [jobRole.hospital.id] : [],
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
      // Convert arrays to single values for the API and remove array properties
      const { trustIds, hospitalIds, ...restData } = data;
      const apiData = {
        ...restData,
        trustId: trustIds && trustIds.length > 0 ? trustIds[0] : undefined,
        hospitalId: hospitalIds && hospitalIds.length > 0 ? hospitalIds[0] : undefined,
      };
      
      if (editingJobRole) {
        const updated = await jobRolesApi.update(editingJobRole.id, apiData);
        setJobRoles(jobRoles.map(jr => jr.id === editingJobRole.id ? updated : jr));
        showSuccess('Job role updated successfully');
      } else {
        const created = await jobRolesApi.create(apiData);
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
            
            <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">
                      Organizational Scope
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="scope"
                          value=""
                          className="mr-2"
                          onChange={(e) => {
                            form.setValue('scope', undefined);
                            form.setValue('trustId', undefined);
                            form.setValue('hospitalId', undefined);
                          }}
                        />
                        <span className="text-sm">Global (available to all hospitals)</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="scope"
                          value="TRUST"
                          className="mr-2"
                          onChange={(e) => {
                            form.setValue('scope', 'TRUST');
                            form.setValue('hospitalId', undefined);
                          }}
                        />
                        <span className="text-sm">Trust-specific</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="scope"
                          value="HOSPITAL"
                          className="mr-2"
                          onChange={(e) => {
                            form.setValue('scope', 'HOSPITAL');
                            form.setValue('trustId', undefined);
                          }}
                        />
                        <span className="text-sm">Hospital-specific</span>
                      </label>
                    </div>
                  </div>
                  
                  {form.watch('scope') === 'TRUST' && (
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-2">
                        Trusts
                      </label>
                      <TrustMultiSelect
                        value={form.watch('trustIds') || []}
                        onChange={(ids) => form.setValue('trustIds', ids)}
                        options={trusts}
                        loading={trustsLoading}
                        error={trustsError}
                        placeholder="Select trusts..."
                        data-testid="job-role-trusts-multiselect"
                      />
                    </div>
                  )}
                  
                  {form.watch('scope') === 'HOSPITAL' && (
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-2">
                        Hospitals
                      </label>
                      <HospitalMultiSelect
                        value={form.watch('hospitalIds') || []}
                        onChange={(ids) => form.setValue('hospitalIds', ids)}
                        options={hospitals}
                        loading={hospitalsLoading}
                        error={hospitalsError}
                        placeholder="Select hospitals..."
                        groupByTrust={true}
                        data-testid="job-role-hospitals-multiselect"
                      />
                    </div>
                  )}
                </div>
            
            <div className="text-sm text-zinc-500">
              <p>The job role code is used internally and should be short and unique.</p>
              <p className="mt-1">
                Choose the organizational scope to limit where this job role can be used.
              </p>
            </div>
          </div>
        </FormProvider>
      </DrawerForm>
    </div>
  );
}
