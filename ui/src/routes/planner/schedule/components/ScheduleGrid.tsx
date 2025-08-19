import React, { useState, useRef, useEffect } from 'react';
import { DateTime } from 'luxon';
import { ChevronLeft, ChevronRight, Calendar, Grid3X3 } from 'lucide-react';
import { Assignment } from '../../../../lib/hooks';

interface Staff {
  id: string;
  fullName: string;
  role: 'doctor' | 'nurse';
  gradeBand?: string;
  wards: { id: string }[];
}



interface Lock {
  id: string;
  staffId: string;
  date: string;
  slot: string;
}

interface ScheduleGridProps {
  view: 'month' | 'week';
  currentDate: DateTime;
  onDateChange: (date: DateTime) => void;
  onViewChange: (view: 'month' | 'week') => void;
  staff: Staff[];
  assignments: Assignment[];
  locks: Lock[];
  shiftTypes: Array<{
    id: string;
    name: string;
    startTime: string;
    endTime: string;
    isNight: boolean;
  }>;
  selectedCell: { staffId: string; date: string; slot: string } | null;
  onCellSelect: (staffId: string, date: string, slot: string) => void;
  onToggleLock: (staffId: string, date: string, slot: string) => void;
  onExplainCell?: (staffId: string, date: string, slot: string) => void;
  breachData?: Record<string, Record<string, { severity: 'low' | 'medium' | 'high' }>>;
}

export function ScheduleGrid({
  view,
  currentDate,
  onDateChange,
  onViewChange,
  staff,
  assignments,
  locks,
  shiftTypes,
  selectedCell,
  onCellSelect,
  onToggleLock,
  onExplainCell,
  breachData,
}: ScheduleGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [focusedCell, setFocusedCell] = useState<{ staffId: string; date: string; slot: string } | null>(null);

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



  const getAssignmentForDay = (staffId: string, date: string) => {
    const filteredAssignments = assignments.filter(
      assignment => {
        // Convert assignment date to yyyy-MM-dd format for comparison
        const assignmentDate = DateTime.fromISO(assignment.date).toFormat('yyyy-MM-dd');
        
        return assignment.staffId === staffId && assignmentDate === date;
      }
    );
    
    // Remove duplicates based on assignment ID to prevent React key conflicts
    const uniqueAssignments = filteredAssignments.filter((assignment, index, self) => 
      index === self.findIndex(a => a.id === assignment.id)
    );
    
    // Return the first assignment for this day (staff can only work one shift per day)
    return uniqueAssignments[0] || null;
  };



  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!focusedCell) return;

    const days = getDaysInView();
    const currentStaffIndex = staff.findIndex(s => s.id === focusedCell.staffId);
    const currentDayIndex = days.findIndex(d => d.toFormat('yyyy-MM-dd') === focusedCell.date);

    let newStaffIndex = currentStaffIndex;
    let newDayIndex = currentDayIndex;

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        newStaffIndex = Math.max(0, currentStaffIndex - 1);
        break;
      case 'ArrowDown':
        e.preventDefault();
        newStaffIndex = Math.min(staff.length - 1, currentStaffIndex + 1);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        newDayIndex = Math.max(0, currentDayIndex - 1);
        break;
      case 'ArrowRight':
        e.preventDefault();
        newDayIndex = Math.min(days.length - 1, currentDayIndex + 1);
        break;
      case ' ':
        e.preventDefault();
        onToggleLock(focusedCell.staffId, focusedCell.date, focusedCell.slot);
        break;
      default:
        return;
    }

    if (newStaffIndex !== currentStaffIndex || newDayIndex !== currentDayIndex) {
      const newStaffId = staff[newStaffIndex]?.id;
      const newDate = days[newDayIndex]?.toFormat('yyyy-MM-dd');
      
      if (newStaffId && newDate) {
        const newCell = { staffId: newStaffId, date: newDate, slot: focusedCell.slot };
        setFocusedCell(newCell);
        onCellSelect(newStaffId, newDate, focusedCell.slot);
      }
    }
  };

  useEffect(() => {
    if (gridRef.current) {
      gridRef.current.focus();
    }
  }, []);

  const days = getDaysInView();

  return (
    <div className="space-y-4">
      {/* Grid Header */}
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
              ? `Week of ${currentDate.startOf('week').toFormat('MMMM d')}`
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
        </div>
      </div>

      {/* Schedule Grid */}
      <div 
        ref={gridRef}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className="bg-white border border-zinc-200 rounded-lg overflow-hidden focus:outline-none"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            {/* Header Row */}
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="w-48 p-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider sticky left-0 bg-zinc-50 z-10">
                  Staff
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
            
            {/* Staff Rows */}
            <tbody className="divide-y divide-zinc-200">
              {staff.map((staffMember) => (
                <tr key={staffMember.id}>
                  <td className="w-48 p-3 text-sm font-medium text-zinc-700 bg-zinc-50 sticky left-0 z-10">
                    <div>
                      <div className="font-semibold">{staffMember.fullName}</div>
                      <div className="text-zinc-500">{staffMember.role} {staffMember.gradeBand}</div>
                    </div>
                  </td>
                  {days.map((day) => {
                    const dateKey = day.toFormat('yyyy-MM-dd');
                    const assignment = getAssignmentForDay(staffMember.id, dateKey);
                    const shiftType = assignment ? shiftTypes.find(st => st.id === assignment.shiftTypeId) : null;
                    const isSelected = selectedCell?.staffId === staffMember.id && 
                                     selectedCell?.date === dateKey;
                    
                    return (
                      <td key={`${staffMember.id}-${day.toISO()}`} className="p-2">
                        {assignment ? (
                          <div 
                            className={`
                              p-2 rounded-lg text-center text-sm font-medium cursor-pointer transition-colors
                              ${isSelected 
                                ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-300' 
                                : 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                              }
                            `}
                            onClick={() => onCellSelect(staffMember.id, dateKey, shiftType?.name || '')}
                            onDoubleClick={() => onExplainCell?.(staffMember.id, dateKey, shiftType?.name || '')}
                          >
                            {shiftType?.name || 'Unknown'}
                          </div>
                        ) : (
                          <div 
                            className={`
                              p-2 rounded-lg text-center text-sm text-zinc-400 cursor-pointer transition-colors
                              ${isSelected 
                                ? 'bg-indigo-50 border-2 border-indigo-200' 
                                : 'border border-zinc-200 hover:bg-zinc-50'
                              }
                            `}
                            onClick={() => onCellSelect(staffMember.id, dateKey, '')}
                          >
                            —
                          </div>
                        )}
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
