import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar, Grid3X3 } from 'lucide-react';
import { DateTime } from 'luxon';
import { DemandSlot } from './DemandSlot';

interface DemandCalendarProps {
  view: 'month' | 'week';
  currentDate: DateTime;
  onDateChange: (date: DateTime) => void;
  onViewChange: (view: 'month' | 'week') => void;
  demandData: Record<string, Record<string, Record<string, number>>>;
  shiftTypes: Array<{
    id: string;
    name: string;
    startTime: string;
    endTime: string;
    isNight: boolean;
  }>;
  isHourly: boolean;
  selectedSlots: Set<string>;
  onSlotClick: (date: string, slot: string) => void;
  onSlotMouseEnter: (date: string, slot: string) => void;
  onSlotMouseLeave: () => void;
  onRangeSelect: (startDate: string, endDate: string, startSlot: string, endSlot: string) => void;
  coverageData?: Record<string, Record<string, { filled: number; required: number }>>;
}

export function DemandCalendar({
  view,
  currentDate,
  onDateChange,
  onViewChange,
  demandData,
  shiftTypes,
  isHourly,
  selectedSlots,
  onSlotClick,
  onSlotMouseEnter,
  onSlotMouseLeave,
  onRangeSelect,
  coverageData,
}: DemandCalendarProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ date: string; slot: string } | null>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  const getDaysInView = () => {
    if (view === 'week') {
      const start = currentDate.startOf('week');
      return Array.from({ length: 7 }, (_, i) => start.plus({ days: i }));
    } else {
      const start = currentDate.startOf('month').startOf('week');
      const end = currentDate.endOf('month').endOf('week');
      const days = [];
      let day = start;
      while (day <= end) {
        days.push(day);
        day = day.plus({ days: 1 });
      }
      return days;
    }
  };

  const getSlotsForDay = () => {
    if (isHourly) {
      return Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);
    } else {
      // Show all shift types, but ensure unique names
      const uniqueSlots = shiftTypes
        .map(st => st.name)
        .filter((name, index, self) => self.indexOf(name) === index);
      
      console.log('🔍 Shift types:', {
        allShiftTypes: shiftTypes.map(st => ({ code: st.code, name: st.name })),
        uniqueSlots
      });
      
      return uniqueSlots;
    }
  };

  const getSlotInfo = (slotName: string) => {
    if (isHourly) {
      return {
        name: slotName,
        startTime: slotName,
        endTime: `${(parseInt(slotName) + 1).toString().padStart(2, '0')}:00`,
        isNight: parseInt(slotName) >= 22 || parseInt(slotName) <= 6,
      };
    } else {
      const shiftType = shiftTypes.find(st => st.name === slotName);
      console.log('🔍 getSlotInfo:', { slotName, shiftType, allShiftTypes: shiftTypes.map(st => ({ code: st.code, name: st.name })) });
      return shiftType;
    }
  };

  const handleMouseDown = (date: string, slot: string) => {
    setIsDragging(true);
    setDragStart({ date, slot });
  };

  const handleMouseEnter = (date: string, slot: string) => {
    if (isDragging && dragStart) {
      onSlotMouseEnter(date, slot);
    }
  };

  const handleMouseUp = () => {
    if (isDragging && dragStart) {
      // Calculate range and call onRangeSelect
      const startDate = dragStart.date;
      const endDate = Array.from(selectedSlots).pop()?.split('|')[0] || startDate;
      const startSlot = dragStart.slot;
      const endSlot = Array.from(selectedSlots).pop()?.split('|')[1] || startSlot;
      
      onRangeSelect(startDate, endDate, startSlot, endSlot);
    }
    setIsDragging(false);
    setDragStart(null);
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        handleMouseUp();
      }
    };

    document.addEventListener('mouseup', handleGlobalMouseUp);
    return () => document.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [isDragging, dragStart, selectedSlots]);

  const days = getDaysInView();
  const slots = getSlotsForDay();
  
  // Debug logging
  console.log('🔍 DemandCalendar debug:', {
    view,
    currentDate: currentDate.toISO(),
    daysCount: days.length,
    days: days.map(d => d.toFormat('yyyy-MM-dd')),
    slots,
    slotsDetail: slots.map((slot, index) => ({ index, slot })),
    demandDataKeys: Object.keys(demandData || {}),
    sampleDemand: demandData ? Object.entries(demandData).slice(0, 3) : []
  });

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => onDateChange(currentDate.minus({ [view === 'week' ? 'weeks' : 'months']: 1 }))}
            className="p-2 text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <h2 className="text-xl font-semibold text-zinc-900">
            {view === 'week' 
              ? `Week of ${currentDate.startOf('week').toFormat('MMMM d, yyyy')}`
              : currentDate.toFormat('MMMM yyyy')
            }
          </h2>
          
          <button
            onClick={() => onDateChange(currentDate.plus({ [view === 'week' ? 'weeks' : 'months']: 1 }))}
            className="p-2 text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onViewChange('week')}
            className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              view === 'week'
                ? 'bg-indigo-100 text-indigo-700'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <Grid3X3 className="w-4 h-4 mr-2" />
            Week
          </button>
          <button
            onClick={() => onViewChange('month')}
            className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              view === 'month'
                ? 'bg-indigo-100 text-indigo-700'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Month
          </button>
          <button
            onClick={() => onDateChange(DateTime.fromISO('2025-01-01'))}
            className="flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
            title="Jump to January 2025 (Demo Data)"
          >
            📅 Demo Data
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div ref={calendarRef} className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            {/* Header Row */}
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="w-24 p-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Time
                </th>
                {days.map((day) => (
                  <th key={day.toISO()} className="p-3 text-center text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    <div>
                      <div className="font-semibold">{day.toFormat('EEE')}</div>
                      <div className="text-zinc-400">{day.toFormat('d')}</div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            
            {/* Slot Rows */}
            <tbody className="divide-y divide-zinc-200">
              {slots.map((slot, slotIndex) => (
                <tr key={`${slot}-${slotIndex}`}>
                  <td className="w-24 p-3 text-sm font-medium text-zinc-700 bg-zinc-50">
                    {slot}
                  </td>
                  {days.map((day) => {
                    const dateKey = day.toFormat('yyyy-MM-dd');
                    const slotKey = `${dateKey}|${slot}`;
                    const isSelected = selectedSlots.has(slotKey);
                    const demand = demandData[dateKey]?.[slot] || {};
                    const coverage = coverageData?.[dateKey]?.[slot];
                    const slotInfo = getSlotInfo(slot);
                    
                    // Debug for first few slots
                    if (dateKey === '2025-01-01' && slot === 'Day') {
                      console.log('🔍 Slot demand debug:', {
                        dateKey,
                        slot,
                        demand,
                        demandKeys: Object.keys(demand),
                        demandDataKeys: Object.keys(demandData[dateKey] || {}),
                        slotInfo
                      });
                    }
                    
                    return (
                      <td key={`${dateKey}-${slot}-${slotIndex}`} className="p-2">
                        <DemandSlot
                          date={dateKey}
                          slot={slot}
                          demand={demand}
                          isSelected={isSelected}
                          isInSelection={selectedSlots.has(slotKey)}
                          hasCoverage={!!coverage}
                          coverageRatio={coverage ? coverage.filled / coverage.required : 0}
                          onClick={() => onSlotClick(dateKey, slot)}
                          onMouseEnter={() => handleMouseEnter(dateKey, slot)}
                          onMouseLeave={onSlotMouseLeave}
                          onMouseDown={() => handleMouseDown(dateKey, slot)}
                          isHourly={isHourly}
                          shiftType={slotInfo}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
