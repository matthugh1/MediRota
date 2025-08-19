import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Staff, CreateStaffData } from '../../../lib/hooks/staff';
import { Job, Skill, Ward } from '../../../lib/hooks/refdata';
import StaffForm from './StaffForm';
import { drawerVariants } from '../../../lib/motion';

interface StaffDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  staff?: Staff;
  jobs: Job[];
  skills: Skill[];
  wards: Ward[];
  onSubmit: (data: CreateStaffData) => void;
  isLoading?: boolean;
  serverErrors?: Record<string, string>;
}

const StaffDrawer: React.FC<StaffDrawerProps> = ({
  isOpen,
  onClose,
  staff,
  jobs,
  skills,
  wards,
  onSubmit,
  isLoading = false,
  serverErrors = {},
}) => {
  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={handleClose}
          />

          {/* Drawer */}
          <motion.div
            initial="closed"
            animate="open"
            exit="closed"
            variants={drawerVariants}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-neutral-200">
              <div>
                <h2 className="h3 text-neutral-900">
                  {staff ? 'Edit Staff Member' : 'New Staff Member'}
                </h2>
                <p className="body text-neutral-600 mt-1">
                  {staff ? 'Update staff member details' : 'Add a new staff member to the system'}
                </p>
              </div>
              <button
                onClick={handleClose}
                disabled={isLoading}
                className="p-2 text-neutral-400 hover:text-neutral-600 transition-colors disabled:opacity-50"
                aria-label="Close drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6">
                <StaffForm
                  staff={staff}
                  jobs={jobs}
                  skills={skills}
                  wards={wards}
                  onSubmit={onSubmit}
                  onCancel={handleClose}
                  isLoading={isLoading}
                  serverErrors={serverErrors}
                />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default StaffDrawer;
