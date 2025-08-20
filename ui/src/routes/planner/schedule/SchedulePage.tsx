import React, { useState, useEffect } from 'react';
import { DateTime } from 'luxon';
import { useHotkeys } from 'react-hotkeys-hook';
import { ScheduleGrid } from './components/ScheduleGrid';
import { ActionsBar } from './components/ActionsBar';
import { MetricsPanel } from './components/MetricsPanel';
import { CreateScheduleForm } from './components/CreateScheduleForm';
import { ExplainDrawer } from './components/ExplainDrawer';
import EffectivePolicyDisplay from './components/EffectivePolicyDisplay';
import { 
  useWards, 
  useStaff, 
  useShiftTypes, 
  useSchedules, 
  useSchedule,
  useLocks, 
  useCreateSchedule,
  useSolveSchedule,
  useRepairSchedule,
  useCreateLock,
  useDeleteLock,
  useApplyAlternative
} from '../../../lib/hooks';
import { useToastSuccess, useToastError } from '../../../components';

interface SchedulePageProps {
  scheduleId?: string;
}

export default function SchedulePage({ scheduleId }: SchedulePageProps) {
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>(scheduleId || '');
  const [view, setView] = useState<'month' | 'week'>('week');
  const [currentDate, setCurrentDate] = useState(DateTime.now());
  const [selectedCell, setSelectedCell] = useState<{ staffId: string; date: string; slot: string } | null>(null);
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [isExplainDrawerOpen, setIsExplainDrawerOpen] = useState(false);
  const [error, setError] = useState<string>('');

  // Data fetching
  const { data: wardsData } = useWards();
  const { data: staffData } = useStaff();
  const { data: shiftTypesData } = useShiftTypes();
  const { data: schedulesData } = useSchedules();
  const { data: scheduleData } = useSchedule(selectedScheduleId);
  const { data: locksData } = useLocks(selectedScheduleId);

  // Mutations
  const createScheduleMutation = useCreateSchedule();
  const solveScheduleMutation = useSolveSchedule();
  const repairScheduleMutation = useRepairSchedule();
  const createLockMutation = useCreateLock();
  const deleteLockMutation = useDeleteLock();
  const applyAlternativeMutation = useApplyAlternative();

  // Toast notifications
  const showSuccess = useToastSuccess();
  const showError = useToastError();

  // Auto-select the schedule (there should only be one per ward)
  useEffect(() => {
    if (!selectedScheduleId && schedulesData?.data && schedulesData.data.length > 0) {
      setSelectedScheduleId(schedulesData.data[0].id);
    }
  }, [selectedScheduleId, schedulesData]);

  // Set current date to schedule start date when schedule is selected
  useEffect(() => {
    if (scheduleData?.horizonStart) {
      const scheduleStartDate = DateTime.fromISO(scheduleData.horizonStart);
      // Set to the start of the week containing the schedule start date
      setCurrentDate(scheduleStartDate.startOf('week'));
    }
  }, [scheduleData]);

  // Keyboard shortcuts
  useHotkeys('s', (e) => {
    e.preventDefault();
    if (selectedScheduleId) {
      handleRunSolve();
    }
  });

  useHotkeys('r', (e) => {
    e.preventDefault();
    if (selectedScheduleId) {
      handleRunRepair();
    }
  });

  useHotkeys('space', (e) => {
    e.preventDefault();
    if (selectedCell) {
      handleToggleLock(selectedCell.staffId, selectedCell.date, selectedCell.slot);
    }
  });

  useHotkeys('x', (e) => {
    e.preventDefault();
    if (selectedCell && selectedScheduleId) {
      setIsExplainDrawerOpen(true);
    }
  });

  const handleCreateSchedule = async (data: { wardId: string; horizonStart: string; horizonEnd: string }) => {
    console.log('SchedulePage: handleCreateSchedule called with data:', data);
    try {
      const result = await createScheduleMutation.mutateAsync(data);
      setSelectedScheduleId(result.id);
      setIsCreateFormOpen(false);
      showSuccess('Schedule created successfully');
    } catch (error) {
      showError(
        'Failed to create schedule',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  };

  const handleRunSolve = async () => {
    if (!selectedScheduleId) return;

    try {
      setError('');
      await solveScheduleMutation.mutateAsync(selectedScheduleId);
      showSuccess('Solve completed successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(`Solve failed: ${errorMessage}`);
      showError('Solve failed', errorMessage);
    }
  };

  const handleRunRepair = async () => {
    if (!selectedScheduleId) return;

    try {
      setError('');
      // For now, provide a simple "Mark sickness" event
      const events = [
        {
          type: 'sickness',
          staffId: selectedCell?.staffId || '',
          date: selectedCell?.date || '',
          slot: selectedCell?.slot || '',
        }
      ];
      
      await repairScheduleMutation.mutateAsync({ scheduleId: selectedScheduleId, events });
      showSuccess('Repair completed successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(`Repair failed: ${errorMessage}`);
      showError('Repair failed', errorMessage);
    }
  };

  const handleToggleLock = async (staffId: string, date: string, slot: string) => {
    if (!selectedScheduleId) return;

    try {
      const existingLock = locksData?.find(
        lock => 
          lock.staffId === staffId && 
          lock.date === date && 
          lock.slot === slot
      );

      if (existingLock) {
        await deleteLockMutation.mutateAsync(existingLock.id);
        showSuccess('Lock removed');
      } else {
        await createLockMutation.mutateAsync({
          scheduleId: selectedScheduleId,
          staffId,
          date,
          slot,
        });
        showSuccess('Lock added');
      }
    } catch (error) {
      showError(
        'Failed to toggle lock',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  };

  const handleCellSelect = (staffId: string, date: string, slot: string) => {
    setSelectedCell({ staffId, date, slot });
  };

  const handleClearError = () => {
    setError('');
  };

  const handleApplyAlternative = async (alternativeId: string) => {
    if (!selectedScheduleId) return;

    try {
      await applyAlternativeMutation.mutateAsync({ scheduleId: selectedScheduleId, alternativeId });
      showSuccess('Alternative applied successfully');
    } catch (error) {
      showError(
        'Failed to apply alternative',
        error instanceof Error ? error.message : 'Unknown error'
      );
      throw error; // Re-throw to let the drawer handle the error
    }
  };

  // Transform data for grid
  const staff = staffData?.data || [];
  const assignments = scheduleData?.assignments || [];
  const locks = locksData || [];
  const shiftTypes = shiftTypesData?.data || [];
  const metrics = scheduleData?.metrics;

  // Calculate breach data (simplified - would come from metrics in real implementation)
  const breachData: Record<string, Record<string, { severity: 'low' | 'medium' | 'high' }>> = {};

  const wards = wardsData?.data || [];

  // Show schedule selection if no schedule is selected but schedules are available
  if (!selectedScheduleId && schedulesData?.data && schedulesData.data.length > 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Schedule Editor</h1>
          <p className="text-zinc-600">Select a schedule to edit or create a new one.</p>
        </div>
        
        <div className="bg-white border border-zinc-200 rounded-lg p-6">
          <div className="text-center">
            <h3 className="text-lg font-medium text-zinc-900 mb-2">Select a Schedule</h3>
            <p className="text-zinc-600 mb-4">Choose from existing schedules or create a new one</p>
            
            <div className="flex items-center justify-center space-x-4">
              <select
                value=""
                onChange={(e) => setSelectedScheduleId(e.target.value)}
                className="px-3 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                <option value="">Select a schedule...</option>
                {schedulesData.data.map(schedule => (
                  <option key={schedule.id} value={schedule.id}>
                    {schedule.ward?.name} ({schedule.status})
                  </option>
                ))}
              </select>
              
              <span className="text-zinc-400">or</span>
              
              <button
                onClick={() => setIsCreateFormOpen(true)}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Create New
              </button>
            </div>
          </div>
        </div>

        <CreateScheduleForm
          isOpen={isCreateFormOpen}
          onClose={() => setIsCreateFormOpen(false)}
          wards={wards}
          onSubmit={handleCreateSchedule}
          isLoading={createScheduleMutation.isPending}
          error={createScheduleMutation.error?.message}
        />
      </div>
    );
  }

  // Show "no schedules" view if no schedules exist
  if (!schedulesData?.data || schedulesData.data.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Schedule Editor</h1>
          <p className="text-zinc-600">Create and manage rota schedules.</p>
        </div>
        
        <div className="bg-white border border-zinc-200 rounded-lg p-6">
          <div className="text-center">
            <h3 className="text-lg font-medium text-zinc-900 mb-2">No Schedules Available</h3>
            <p className="text-zinc-600 mb-4">Create your first schedule to get started</p>
            <button
              onClick={() => setIsCreateFormOpen(true)}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Create Schedule
            </button>
          </div>
        </div>

        <CreateScheduleForm
          isOpen={isCreateFormOpen}
          onClose={() => setIsCreateFormOpen(false)}
          wards={wards}
          onSubmit={handleCreateSchedule}
          isLoading={createScheduleMutation.isPending}
          error={createScheduleMutation.error?.message}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Schedule Editor</h1>
          <p className="text-zinc-600">
            {scheduleData?.ward?.name} - {scheduleData?.status}
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <select
            value={selectedScheduleId}
            onChange={(e) => setSelectedScheduleId(e.target.value)}
            className="px-3 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            {schedulesData?.data?.map(schedule => (
              <option key={schedule.id} value={schedule.id}>
                {schedule.ward?.name} ({schedule.status})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Actions Bar */}
      <ActionsBar
        onRunSolve={handleRunSolve}
        onRunRepair={handleRunRepair}
        onCreateSchedule={() => setIsCreateFormOpen(true)}
        isSolveRunning={solveScheduleMutation.isPending}
        isRepairRunning={repairScheduleMutation.isPending}
        hasSchedule={!!selectedScheduleId}
        error={error}
        onClearError={handleClearError}
      />

      {/* Effective Policy Display */}
      {selectedScheduleId && scheduleData?.wardId && (
        <EffectivePolicyDisplay
          wardId={scheduleData.wardId}
          scheduleId={selectedScheduleId}
        />
      )}

      {/* Metrics Panel */}
      <MetricsPanel
        metrics={metrics}
        isRunning={solveScheduleMutation.isPending || repairScheduleMutation.isPending}
        lastRunTime={scheduleData?.updatedAt}
      />

      {/* Schedule Grid */}
      <ScheduleGrid
        view={view}
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        onViewChange={setView}
        staff={staff}
        assignments={assignments}
        locks={locks}
        shiftTypes={shiftTypes}
        selectedCell={selectedCell}
        onCellSelect={handleCellSelect}
        onToggleLock={handleToggleLock}
        onExplainCell={(staffId, date, slot) => {
          setSelectedCell({ staffId, date, slot });
          setIsExplainDrawerOpen(true);
        }}
        breachData={breachData}
      />

      {/* Create Schedule Form */}
      <CreateScheduleForm
        isOpen={isCreateFormOpen}
        onClose={() => setIsCreateFormOpen(false)}
        wards={wards}
        schedules={schedulesData?.data || []}
        onSubmit={handleCreateSchedule}
        isLoading={createScheduleMutation.isPending}
        error={createScheduleMutation.error?.message}
      />

      {/* Explain Drawer */}
      {selectedCell && (
        <ExplainDrawer
          isOpen={isExplainDrawerOpen}
          onClose={() => setIsExplainDrawerOpen(false)}
          scheduleId={selectedScheduleId}
          staffId={selectedCell.staffId}
          date={selectedCell.date}
          slot={selectedCell.slot}
          onApplyAlternative={handleApplyAlternative}
        />
      )}

      {/* Keyboard Shortcuts Help */}
      <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-zinc-700 mb-2">Keyboard Shortcuts</h3>
        <div className="grid grid-cols-2 gap-4 text-xs text-zinc-600">
          <div>
            <span className="font-medium">S:</span> Run Solve
          </div>
          <div>
            <span className="font-medium">R:</span> Run Repair
          </div>
          <div>
            <span className="font-medium">Space:</span> Toggle Lock
          </div>
          <div>
            <span className="font-medium">X:</span> Explain Assignment
          </div>
          <div>
            <span className="font-medium">Arrow Keys:</span> Navigate cells
          </div>
        </div>
      </div>
    </div>
  );
}
