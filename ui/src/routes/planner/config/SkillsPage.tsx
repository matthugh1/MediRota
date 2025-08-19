import React, { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ColumnDef } from '@tanstack/react-table';
import { useHotkeys } from 'react-hotkeys-hook';
import { DataTable } from './components/DataTable';
import { DrawerForm } from './components/DrawerForm';
import { FormField } from './components/FormFields';
import { useSkills, useCreateSkill, useUpdateSkill, useDeleteSkill, Skill } from '../../../lib/hooks';
import { useToastSuccess, useToastError, useConfirmDelete } from '../../../components';

const skillSchema = z.object({
  code: z.string().min(1, 'Skill code is required').max(20, 'Skill code must be less than 20 characters'),
  name: z.string().min(1, 'Skill name is required').max(100, 'Skill name must be less than 100 characters'),
});

type SkillFormData = z.infer<typeof skillSchema>;

const columns: ColumnDef<Skill>[] = [
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
    header: 'Skill Name',
    cell: ({ row }) => (
      <div className="font-medium text-zinc-900">{row.getValue('name')}</div>
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

export default function SkillsPage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  
  const { data: skillsData, isLoading } = useSkills();
  const createSkillMutation = useCreateSkill();
  const updateSkillMutation = useUpdateSkill();
  const deleteSkillMutation = useDeleteSkill();
  
  const showSuccess = useToastSuccess();
  const showError = useToastError();
  const confirmDelete = useConfirmDelete();

  const form = useForm<SkillFormData>({
    resolver: zodResolver(skillSchema),
    defaultValues: {
      code: '',
      name: '',
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
    setEditingSkill(null);
    form.reset({
      code: '',
      name: '',
    });
    setIsDrawerOpen(true);
  };

  const handleEdit = (skill: Skill) => {
    setEditingSkill(skill);
    form.reset({
      code: skill.code,
      name: skill.name,
    });
    setIsDrawerOpen(true);
  };

  const handleDelete = (skill: Skill) => {
    confirmDelete(
      'Delete Skill',
      `Are you sure you want to delete "${skill.name}"? This action cannot be undone.`,
      async () => {
        try {
          await deleteSkillMutation.mutateAsync(skill.id);
          showSuccess('Skill deleted successfully');
        } catch (error) {
          showError('Failed to delete skill', error instanceof Error ? error.message : 'Unknown error');
        }
      }
    );
  };

  const handleSubmit = async (data: SkillFormData) => {
    try {
      if (editingSkill) {
        await updateSkillMutation.mutateAsync({
          id: editingSkill.id,
          data,
        });
        showSuccess('Skill updated successfully');
      } else {
        await createSkillMutation.mutateAsync(data);
        showSuccess('Skill created successfully');
      }
      setIsDrawerOpen(false);
    } catch (error) {
      showError(
        editingSkill ? 'Failed to update skill' : 'Failed to create skill',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setEditingSkill(null);
    form.reset();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Skills</h1>
        <p className="text-zinc-600">Manage staff skills and qualifications.</p>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={skillsData?.data || []}
        isLoading={isLoading}
        onNew={handleNew}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Drawer Form */}
      <DrawerForm
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        title={editingSkill ? 'Edit Skill' : 'New Skill'}
        onSubmit={form.handleSubmit(handleSubmit)}
        isLoading={createSkillMutation.isPending || updateSkillMutation.isPending}
        submitText={editingSkill ? 'Update' : 'Create'}
      >
        <FormProvider {...form}>
          <div className="space-y-6">
            <FormField
              name="code"
              label="Skill Code"
              placeholder="e.g., DR, RN, ANP"
              required
            />
            
            <FormField
              name="name"
              label="Skill Name"
              placeholder="e.g., Doctor, Registered Nurse, Advanced Nurse Practitioner"
              required
            />
            
            <div className="text-sm text-zinc-500">
              <p>The skill code is used internally and should be short and unique.</p>
            </div>
          </div>
        </FormProvider>
      </DrawerForm>
    </div>
  );
}
