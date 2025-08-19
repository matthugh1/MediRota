import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, Search } from 'lucide-react';
import { useHotkeys } from 'react-hotkeys-hook';
import { motionPresets } from '../../../lib/motion';
import { 
  useStaffList, 
  useStaffStats, 
  useJobs, 
  useSkills, 
  useWards,
  useCreateStaff,
  useUpdateStaff,
  useDeleteStaff,
  CreateStaffData,
  Staff
} from '../../../lib/hooks/index';
import { useToast } from '../../../components/Toast';
import { useConfirmDialog } from '../../../components/ConfirmDialog';
import StaffTable from './StaffTable';
import StaffDrawer from './StaffDrawer';

const StaffPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJob, setSelectedJob] = useState('');
  const [selectedWard, setSelectedWard] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | undefined>();
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  
  const { addToast } = useToast();
  const { showDialog } = useConfirmDialog();
  
  // Data hooks
  const { data: staffList, isLoading, error, refetch } = useStaffList({
    search: searchTerm || undefined,
    jobId: selectedJob || undefined,
    wardId: selectedWard || undefined,
    limit: 50,
  });
  
  const { total, active, averageSkills } = useStaffStats();
  const { data: jobs = [] } = useJobs();
  const { data: skills = [] } = useSkills();
  const { data: wards = [] } = useWards();
  
  // Mutation hooks
  const createStaffMutation = useCreateStaff();
  const updateStaffMutation = useUpdateStaff();
  const deleteStaffMutation = useDeleteStaff();

  // Keyboard shortcuts
  useHotkeys('/', (e) => {
    e.preventDefault();
    const searchInput = document.querySelector('[data-testid="staff-search"]') as HTMLInputElement;
    searchInput?.focus();
  });

  useHotkeys('n', (e) => {
    e.preventDefault();
    handleNewStaff();
  });

  // Event handlers
  const handleNewStaff = () => {
    setEditingStaff(undefined);
    setServerErrors({});
    setIsDrawerOpen(true);
  };

  const handleEditStaff = (staff: Staff) => {
    setEditingStaff(staff);
    setServerErrors({});
    setIsDrawerOpen(true);
  };

  const handleDeleteStaff = (staff: Staff) => {
    showDialog({
      title: 'Delete Staff Member',
      message: `Are you sure you want to delete ${staff.fullName}? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
      onConfirm: async () => {
        try {
          await deleteStaffMutation.mutateAsync(staff.id);
          addToast({
            title: 'Staff Deleted',
            message: `${staff.fullName} has been deleted successfully.`,
            type: 'success',
          });
        } catch (error) {
          addToast({
            title: 'Error',
            message: error instanceof Error ? error.message : 'Failed to delete staff member',
            type: 'error',
          });
        }
      },
    });
  };

  const handleSubmitStaff = async (data: CreateStaffData) => {
    setServerErrors({});
    
    try {
      if (editingStaff) {
        await updateStaffMutation.mutateAsync({
          id: editingStaff.id,
          ...data,
        });
        addToast({
          title: 'Staff Updated',
          message: `${data.fullName} has been updated successfully.`,
          type: 'success',
        });
      } else {
        await createStaffMutation.mutateAsync(data);
        addToast({
          title: 'Staff Created',
          message: `${data.fullName} has been created successfully.`,
          type: 'success',
        });
      }
      setIsDrawerOpen(false);
      refetch();
    } catch (error: any) {
      if (error.data?.message) {
        // Handle validation errors
        const errors: Record<string, string> = {};
        if (Array.isArray(error.data.message)) {
          error.data.message.forEach((msg: string) => {
            const [field] = msg.split(' ');
            errors[field] = msg;
          });
        } else {
          errors.general = error.data.message;
        }
        setServerErrors(errors);
      } else {
        addToast({
          title: 'Error',
          message: error.message || 'Failed to save staff member',
          type: 'error',
        });
      }
    }
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setEditingStaff(undefined);
    setServerErrors({});
  };

  return (
    <motion.div
      {...motionPresets.fadeInUp}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="h2">Staff Management</h1>
          <p className="body text-neutral-600 mt-1">
            Manage staff members, their jobs, and competencies
          </p>
        </div>
        <button 
          onClick={handleNewStaff}
          className="btn-primary"
          data-testid="staff-new"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Staff
        </button>
      </div>

      {/* Staff Table */}
      {staffList?.data && staffList.data.length > 0 ? (
        <StaffTable
          staff={staffList.data}
          isLoading={isLoading}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onEdit={handleEditStaff}
          onDelete={handleDeleteStaff}
          onNew={handleNewStaff}
        />
      ) : (
        <div className="card">
          <div className="p-6">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="body text-neutral-600">Loading staff...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 bg-error-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-error-600 text-xl">!</span>
                </div>
                <h3 className="h4 text-neutral-900 mb-2">Error Loading Staff</h3>
                <p className="body text-neutral-600 mb-6">
                  {error instanceof Error ? error.message : 'Failed to load staff data'}
                </p>
                <button className="btn-primary" onClick={() => window.location.reload()}>
                  Try Again
                </button>
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                <h3 className="h4 text-neutral-900 mb-2">No Staff Members</h3>
                <p className="body text-neutral-600 mb-6">
                  {searchTerm || selectedJob || selectedWard 
                    ? 'No staff found matching your filters'
                    : 'Get started by adding your first staff member'
                  }
                </p>
                <button 
                  onClick={handleNewStaff}
                  className="btn-primary"
                  data-testid="staff-new"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Staff Member
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="flex items-center">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Users className="w-5 h-5 text-primary-600" />
            </div>
            <div className="ml-3">
              <p className="caption text-neutral-600">Total Staff</p>
              <p className="h4">{total}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center">
            <div className="p-2 bg-success-100 rounded-lg">
              <Users className="w-5 h-5 text-success-600" />
            </div>
            <div className="ml-3">
              <p className="caption text-neutral-600">Active Staff</p>
              <p className="h4">{active}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center">
            <div className="p-2 bg-warning-100 rounded-lg">
              <Users className="w-5 h-5 text-warning-600" />
            </div>
            <div className="ml-3">
              <p className="caption text-neutral-600">Average Skills</p>
              <p className="h4">{averageSkills}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Staff Drawer */}
      <StaffDrawer
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        staff={editingStaff}
        jobs={jobs}
        skills={skills}
        wards={wards}
        onSubmit={handleSubmitStaff}
        isLoading={createStaffMutation.isPending || updateStaffMutation.isPending}
        serverErrors={serverErrors}
      />
    </motion.div>
  );
};

export default StaffPage;
