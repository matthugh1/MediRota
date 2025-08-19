import React, { useState, useEffect } from 'react';
import { DateTime } from 'luxon';
import { useHotkeys } from 'react-hotkeys-hook';
import { DemandCalendar } from './components/DemandCalendar';
import { DemandEditorSheet } from './components/DemandEditorSheet';
import { BulkApplyPanel } from './components/BulkApplyPanel';
import { useWards, useSkills, useShiftTypes, useDemand, useCreateDemand, useUpdateDemand } from '../../../lib/hooks';
import { useToastSuccess, useToastError } from '../../../components';

interface DemandPageProps {
  wardId?: string;
}

export default function DemandPage({ wardId }: DemandPageProps) {
  const [selectedWardId, setSelectedWardId] = useState<string>(wardId || '');
  const [view, setView] = useState<'month' | 'week'>('week');
  const [currentDate, setCurrentDate] = useState(DateTime.fromISO('2025-01-01'));
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());
  const [editingSlot, setEditingSlot] = useState<{ date: string; slot: string } | null>(null);
  const [sourceSlot, setSourceSlot] = useState<{ date: string; slot: string } | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isBulkApplyVisible, setIsBulkApplyVisible] = useState(false);

  // Data fetching
  const { data: wardsData } = useWards();
  const { data: skillsData } = useSkills();
  const { data: shiftTypesData } = useShiftTypes();
  const { data: demandData, isLoading: demandLoading } = useDemand(selectedWardId, {
    start: currentDate.startOf(view === 'week' ? 'week' : 'month').toISO(),
    end: currentDate.endOf(view === 'week' ? 'week' : 'month').toISO(),
  });

  // Auto-select first ward if none selected and wards are available
  useEffect(() => {
    if (!selectedWardId && wardsData?.data && wardsData.data.length > 0) {
      setSelectedWardId(wardsData.data[0].id);
    }
  }, [selectedWardId, wardsData]);

  // Mutations
  const createDemandMutation = useCreateDemand();
  const updateDemandMutation = useUpdateDemand();

  // Toast notifications
  const showSuccess = useToastSuccess();
  const showError = useToastError();

  // Get ward info for hourly granularity
  const selectedWard = wardsData?.data?.find(w => w.id === selectedWardId);
  const isHourly = selectedWard?.hourlyGranularity || false;

  // Keyboard shortcuts
  useHotkeys('enter', (e) => {
    e.preventDefault();
    if (selectedSlots.size === 1) {
      const [date, slot] = Array.from(selectedSlots)[0].split('|');
      handleSlotClick(date, slot);
    }
  });

  useHotkeys('cmd+d, ctrl+d', (e) => {
    e.preventDefault();
    handleDuplicatePreviousDay();
  });

  useHotkeys('escape', () => {
    setSelectedSlots(new Set());
    setIsBulkApplyVisible(false);
  });

  const handleSlotClick = (date: string, slot: string) => {
    setEditingSlot({ date, slot });
    setIsEditorOpen(true);
  };

  const handleSlotMouseEnter = (date: string, slot: string) => {
    if (selectedSlots.size > 0) {
      const newSelection = new Set(selectedSlots);
      newSelection.add(`${date}|${slot}`);
      setSelectedSlots(newSelection);
    }
  };

  const handleSlotMouseLeave = () => {
    // Optional: Clear selection on mouse leave
  };

  const handleRangeSelect = (startDate: string, endDate: string, startSlot: string, endSlot: string) => {
    // This would be implemented to handle range selection
    // For now, we'll just show the bulk apply panel
    setIsBulkApplyVisible(true);
  };

  const handleDemandSubmit = async (demand: Record<string, number>) => {
    if (!editingSlot) return;

    try {
      const { date, slot } = editingSlot;
      
      // Check if demand already exists
      const existingDemand = demandData?.data?.find(
        d => d.date === date && d.slot === slot
      );

      if (existingDemand) {
        await updateDemandMutation.mutateAsync({
          id: existingDemand.id,
          data: { requiredBySkill: demand },
        });
        showSuccess('Demand updated successfully');
      } else {
        await createDemandMutation.mutateAsync({
          wardId: selectedWardId,
          date,
          slot,
          requiredBySkill: demand,
        });
        showSuccess('Demand created successfully');
      }

      setIsEditorOpen(false);
      setEditingSlot(null);
    } catch (error) {
      showError(
        'Failed to save demand',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  };

  const handleBulkApply = async () => {
    if (!sourceSlot || selectedSlots.size === 0) return;

    const sourceDemand = demandData?.data?.find(
      d => d.date === sourceSlot.date && d.slot === sourceSlot.slot
    )?.requiredBySkill || {};

    if (Object.keys(sourceDemand).length === 0) {
      showError('No demand to apply', 'Select a slot with demand first');
      return;
    }

    try {
      // Apply demand to all selected slots
      const promises = Array.from(selectedSlots).map(async (slotKey) => {
        const [date, slot] = slotKey.split('|');
        
        const existingDemand = demandData?.data?.find(
          d => d.date === date && d.slot === slot
        );

        if (existingDemand) {
          return updateDemandMutation.mutateAsync({
            id: existingDemand.id,
            data: { requiredBySkill: sourceDemand },
          });
        } else {
          return createDemandMutation.mutateAsync({
            wardId: selectedWardId,
            date,
            slot,
            requiredBySkill: sourceDemand,
          });
        }
      });

      await Promise.all(promises);
      showSuccess(`Demand applied to ${selectedSlots.size} slots`);
      
      setSelectedSlots(new Set());
      setIsBulkApplyVisible(false);
      setSourceSlot(null);
    } catch (error) {
      showError(
        'Failed to apply demand',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  };

  const handleDuplicatePreviousDay = () => {
    // Implement duplicate previous day functionality
    showSuccess('Duplicate previous day functionality coming soon');
  };

  const handleClearSelection = () => {
    setSelectedSlots(new Set());
    setIsBulkApplyVisible(false);
    setSourceSlot(null);
  };

  // Transform demand data for the calendar
  const transformedDemandData: Record<string, Record<string, Record<string, number>>> = {};
  
  console.log('🔍 Demand data debug:', {
    demandData: demandData?.data,
    demandDataLength: demandData?.data?.length,
    selectedWardId,
    currentDate: currentDate.toISO(),
    view
  });
  
  demandData?.data?.forEach(demand => {
    // Convert ISO date string to yyyy-MM-dd format to match calendar expectations
    const dateKey = new Date(demand.date).toISOString().split('T')[0];
    if (!transformedDemandData[dateKey]) {
      transformedDemandData[dateKey] = {};
    }
    
    // Map slot names to match the UI display names
    let slotName = demand.slot;
    if (demand.slot === 'DAY') slotName = 'Day';
    else if (demand.slot === 'EVENING') slotName = 'Evening';
    else if (demand.slot === 'NIGHT') slotName = 'Night';
    
    transformedDemandData[dateKey][slotName] = demand.requiredBySkill as Record<string, number>;
  });
  
  console.log('🔍 Transformed demand data:', transformedDemandData);



  // Get source demand for bulk apply
  const sourceDemand = sourceSlot 
    ? transformedDemandData[sourceSlot.date]?.[sourceSlot.slot] || {}
    : {};

  const wardOptions = wardsData?.data?.map(ward => ({
    value: ward.id,
    label: ward.name,
  })) || [];

  if (!selectedWardId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Demand Builder</h1>
          <p className="text-zinc-600">Set staffing requirements for each ward.</p>
        </div>
        
        <div className="bg-white border border-zinc-200 rounded-lg p-6">
          <label className="block text-sm font-medium text-zinc-700 mb-2">
            Select Ward
          </label>
          <select
            value={selectedWardId}
            onChange={(e) => setSelectedWardId(e.target.value)}
            className="w-full max-w-xs px-3 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <option value="">Choose a ward...</option>
            {wardOptions.map(ward => (
              <option key={ward.value} value={ward.value}>
                {ward.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Demand Builder</h1>
          <p className="text-zinc-600">
            Set staffing requirements for {selectedWard?.name}
            {isHourly && ' (Hourly granularity)'}
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <select
            value={selectedWardId}
            onChange={(e) => setSelectedWardId(e.target.value)}
            className="px-3 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            {wardOptions.map(ward => (
              <option key={ward.value} value={ward.value}>
                {ward.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Calendar */}
      <DemandCalendar
        view={view}
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        onViewChange={setView}
        demandData={transformedDemandData}
        shiftTypes={shiftTypesData?.data || []}
        isHourly={isHourly}
        selectedSlots={selectedSlots}
        onSlotClick={handleSlotClick}
        onSlotMouseEnter={handleSlotMouseEnter}
        onSlotMouseLeave={handleSlotMouseLeave}
        onRangeSelect={handleRangeSelect}
      />

      {/* Editor Sheet */}
      {editingSlot && (
        <DemandEditorSheet
          isOpen={isEditorOpen}
          onClose={() => {
            setIsEditorOpen(false);
            setEditingSlot(null);
          }}
          date={editingSlot.date}
          slot={editingSlot.slot}
          demand={transformedDemandData[editingSlot.date]?.[editingSlot.slot] || {}}
          skills={skillsData?.data || []}
          onSubmit={handleDemandSubmit}
          isLoading={createDemandMutation.isPending || updateDemandMutation.isPending}
          error={createDemandMutation.error?.message || updateDemandMutation.error?.message}
        />
      )}

      {/* Bulk Apply Panel */}
      <BulkApplyPanel
        isVisible={isBulkApplyVisible}
        selectedSlots={selectedSlots}
        sourceDemand={sourceDemand}
        onApplyToSelection={handleBulkApply}
        onClearSelection={handleClearSelection}
        isLoading={createDemandMutation.isPending || updateDemandMutation.isPending}
      />

      {/* Keyboard Shortcuts Help */}
      <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-zinc-700 mb-2">Keyboard Shortcuts</h3>
        <div className="grid grid-cols-2 gap-4 text-xs text-zinc-600">
          <div>
            <span className="font-medium">Enter:</span> Open editor for selected slot
          </div>
          <div>
            <span className="font-medium">Cmd/Ctrl+D:</span> Duplicate previous day
          </div>
          <div>
            <span className="font-medium">Escape:</span> Clear selection
          </div>
          <div>
            <span className="font-medium">Drag:</span> Select multiple slots
          </div>
        </div>
      </div>
    </div>
  );
}
