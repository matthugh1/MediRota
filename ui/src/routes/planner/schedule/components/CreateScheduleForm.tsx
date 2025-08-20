import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Users, AlertTriangle, Info } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DateTime } from 'luxon';

interface Ward {
  id: string;
  name: string;
}

interface Schedule {
  id: string;
  wardId: string;
  horizonStart: string;
  horizonEnd: string;
  status: string;
  createdAt: string;
}

interface CreateScheduleFormProps {
  isOpen: boolean;
  onClose: () => void;
  wards: Ward[];
  schedules: Schedule[];
  onSubmit: (data: { wardId: string; horizonStart: string; horizonEnd: string }) => void;
  isLoading?: boolean;
  error?: string;
}

const createScheduleSchema = z.object({
  wardId: z.string().min(1, 'Ward is required'),
  horizonStart: z.string().min(1, 'Start date is required'),
  horizonEnd: z.string().min(1, 'End date is required'),
}).refine((data) => {
  const start = DateTime.fromISO(data.horizonStart);
  const end = DateTime.fromISO(data.horizonEnd);
  return end > start;
}, {
  message: 'End date must be after start date',
  path: ['horizonEnd'],
});

type CreateScheduleFormData = z.infer<typeof createScheduleSchema>;

export function CreateScheduleForm({
  isOpen,
  onClose,
  wards,
  schedules,
  onSubmit,
  isLoading = false,
  error,
}: CreateScheduleFormProps) {
  const form = useForm<CreateScheduleFormData>({
    resolver: zodResolver(createScheduleSchema),
    defaultValues: {
      wardId: '',
      horizonStart: DateTime.now().toISODate(),
      horizonEnd: DateTime.now().plus({ weeks: 2 }).toISODate(),
    },
  });

  const handleSubmit = (data: CreateScheduleFormData) => {
    onSubmit(data);
  };

  // Watch form values to detect overlapping schedules
  const watchedWardId = form.watch('wardId');
  const watchedStartDate = form.watch('horizonStart');
  const watchedEndDate = form.watch('horizonEnd');

  // Find overlapping schedules for the selected ward and date range
  const overlappingSchedules = useMemo(() => {
    if (!watchedWardId || !watchedStartDate || !watchedEndDate) {
      return [];
    }

    const startDate = DateTime.fromISO(watchedStartDate);
    const endDate = DateTime.fromISO(watchedEndDate);

    return schedules.filter(schedule => {
      if (schedule.wardId !== watchedWardId) return false;
      
      const scheduleStart = DateTime.fromISO(schedule.horizonStart);
      const scheduleEnd = DateTime.fromISO(schedule.horizonEnd);
      
      // Check for overlap
      return (startDate <= scheduleEnd && endDate >= scheduleStart);
    });
  }, [watchedWardId, watchedStartDate, watchedEndDate, schedules]);

  // Get version number for the new schedule
  const getNextVersion = () => {
    if (!watchedWardId) return 1;
    
    const wardSchedules = schedules.filter(s => s.wardId === watchedWardId);
    return wardSchedules.length + 1;
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
            className="fixed inset-0 bg-black/25 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-zinc-200">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <Calendar className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-zinc-900">Create Schedule</h2>
                    <p className="text-sm text-zinc-500">Set up a new rota schedule</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-zinc-400 hover:text-zinc-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={form.handleSubmit(handleSubmit)} className="p-6 space-y-4">
                {/* Error Display */}
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                {/* Ward Selection */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-zinc-700">
                    Ward
                  </label>
                  <select
                    {...form.register('wardId')}
                    className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    <option value="">Select a ward...</option>
                    {wards.map((ward) => (
                      <option key={ward.id} value={ward.id}>
                        {ward.name}
                      </option>
                    ))}
                  </select>
                  {form.formState.errors.wardId && (
                    <p className="text-sm text-red-600">{form.formState.errors.wardId.message}</p>
                  )}
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-zinc-700">
                      Start Date
                    </label>
                    <input
                      {...form.register('horizonStart')}
                      type="date"
                      className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    />
                    {form.formState.errors.horizonStart && (
                      <p className="text-sm text-red-600">{form.formState.errors.horizonStart.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-zinc-700">
                      End Date
                    </label>
                    <input
                      {...form.register('horizonEnd')}
                      type="date"
                      className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    />
                    {form.formState.errors.horizonEnd && (
                      <p className="text-sm text-red-600">{form.formState.errors.horizonEnd.message}</p>
                    )}
                  </div>
                </div>

                {/* Overlapping Schedules Warning */}
                {overlappingSchedules.length > 0 && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-amber-800">
                          Overlapping schedules detected
                        </p>
                        <p className="text-xs text-amber-700 mt-1">
                          {overlappingSchedules.length} existing schedule{overlappingSchedules.length > 1 ? 's' : ''} overlap with this date range:
                        </p>
                        <div className="mt-2 space-y-1">
                          {overlappingSchedules.map((schedule, index) => (
                            <div key={schedule.id} className="text-xs text-amber-700 bg-amber-100 px-2 py-1 rounded">
                              • {DateTime.fromISO(schedule.horizonStart).toFormat('MMM dd')} - {DateTime.fromISO(schedule.horizonEnd).toFormat('MMM dd, yyyy')} ({schedule.status})
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Version Information */}
                {watchedWardId && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-blue-800">
                          Schedule Version {getNextVersion()}
                        </p>
                        <p className="text-xs text-blue-700 mt-1">
                          This will be version {getNextVersion()} for {wards.find(w => w.id === watchedWardId)?.name}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Info */}
                <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <Users className="w-4 h-4 text-zinc-400 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-zinc-600">
                      <p className="font-medium">Schedule will be created as draft</p>
                      <p>You can then run solve to generate assignments</p>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isLoading}
                    className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating...
                      </div>
                    ) : (
                      'Create Schedule'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
