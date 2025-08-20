import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { DateTime } from 'luxon';

interface Schedule {
  id: string;
  wardId: string;
  horizonStart: string;
  horizonEnd: string;
  status: string;
}

interface DateRangeCalendarProps {
  selectedStartDate: string | null;
  selectedEndDate: string | null;
  onDateRangeChange: (startDate: string, endDate: string) => void;
  existingSchedules: Schedule[];
  wardId: string | null;
  className?: string;
}

export function DateRangeCalendar({
  selectedStartDate,
  selectedEndDate,
  onDateRangeChange,
  existingSchedules,
  wardId,
  className = ''
}: DateRangeCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(DateTime.now().startOf('month'));
  const [selectionMode, setSelectionMode] = useState<'start' | 'end'>('start');

  // Get schedules for the selected ward
  const wardSchedules = useMemo(() => {
    if (!wardId) return [];
    return existingSchedules.filter(schedule => schedule.wardId === wardId);
  }, [existingSchedules, wardId]);

  // Generate calendar days for current month
  const calendarDays = useMemo(() => {
    const startOfMonth = currentMonth.startOf('month');
    const endOfMonth = currentMonth.endOf('month');
    const startOfWeek = startOfMonth.startOf('week');
    const endOfWeek = endOfMonth.endOf('week');

    const days = [];
    let currentDay = startOfWeek;

    while (currentDay <= endOfWeek) {
      days.push(currentDay);
      currentDay = currentDay.plus({ days: 1 });
    }

    return days;
  }, [currentMonth]);

  // Check if a day has an existing schedule
  const getDayScheduleInfo = (day: DateTime) => {
    return wardSchedules.filter(schedule => {
      const scheduleStart = DateTime.fromISO(schedule.horizonStart);
      const scheduleEnd = DateTime.fromISO(schedule.horizonEnd);
      return day >= scheduleStart && day <= scheduleEnd;
    });
  };

  // Check if a day is in the selected range
  const isInSelectedRange = (day: DateTime) => {
    if (!selectedStartDate || !selectedEndDate) return false;
    const start = DateTime.fromISO(selectedStartDate);
    const end = DateTime.fromISO(selectedEndDate);
    return day >= start && day <= end;
  };

  // Check if a day is the start or end of selected range
  const isRangeBoundary = (day: DateTime) => {
    if (!selectedStartDate || !selectedEndDate) return false;
    const start = DateTime.fromISO(selectedStartDate);
    const end = DateTime.fromISO(selectedEndDate);
    return day.equals(start) || day.equals(end);
  };

  // Handle day click
  const handleDayClick = (day: DateTime) => {
    if (selectionMode === 'start') {
      // If selecting start date and end date is before start, clear end date
      if (selectedEndDate && day > DateTime.fromISO(selectedEndDate)) {
        onDateRangeChange(day.toISODate()!, '');
        setSelectionMode('end');
      } else {
        onDateRangeChange(day.toISODate()!, selectedEndDate || '');
        setSelectionMode('end');
      }
    } else {
      // Selecting end date
      if (selectedStartDate && day >= DateTime.fromISO(selectedStartDate)) {
        onDateRangeChange(selectedStartDate, day.toISODate()!);
        setSelectionMode('start');
      }
    }
  };

  // Navigate months
  const goToPreviousMonth = () => {
    setCurrentMonth(currentMonth.minus({ months: 1 }));
  };

  const goToNextMonth = () => {
    setCurrentMonth(currentMonth.plus({ months: 1 }));
  };

  return (
    <div className={`bg-white border border-zinc-200 rounded-lg p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={goToPreviousMonth}
          className="p-1 hover:bg-zinc-100 rounded transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        
        <h3 className="text-lg font-semibold text-zinc-900">
          {currentMonth.toFormat('MMMM yyyy')}
        </h3>
        
        <button
          onClick={goToNextMonth}
          className="p-1 hover:bg-zinc-100 rounded transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-xs font-medium text-zinc-500 py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => {
          const isCurrentMonth = day.month === currentMonth.month;
          const isToday = day.hasSame(DateTime.now(), 'day');
          const hasSchedule = getDayScheduleInfo(day).length > 0;
          const inSelectedRange = isInSelectedRange(day);
          const isBoundary = isRangeBoundary(day);
          const isSelectable = isCurrentMonth;

          let dayClasses = 'h-10 flex items-center justify-center text-sm rounded cursor-pointer transition-colors';
          
          if (!isCurrentMonth) {
            dayClasses += ' text-zinc-300 cursor-not-allowed';
          } else if (hasSchedule) {
            dayClasses += ' bg-amber-100 text-amber-800 hover:bg-amber-200';
          } else if (isBoundary) {
            dayClasses += ' bg-indigo-600 text-white font-semibold';
          } else if (inSelectedRange) {
            dayClasses += ' bg-indigo-100 text-indigo-800';
          } else if (isToday) {
            dayClasses += ' bg-blue-100 text-blue-800 font-semibold';
          } else {
            dayClasses += ' hover:bg-zinc-100 text-zinc-900';
          }

          return (
            <button
              key={index}
              onClick={() => isSelectable && handleDayClick(day)}
              disabled={!isSelectable}
              className={dayClasses}
              title={
                hasSchedule 
                  ? `Existing schedule: ${getDayScheduleInfo(day).map(s => s.status).join(', ')}`
                  : undefined
              }
            >
              {day.day}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-zinc-200">
        <div className="flex items-center justify-between text-xs text-zinc-600">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-amber-100 border border-amber-200 rounded"></div>
              <span>Existing schedule</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-indigo-600 rounded"></div>
              <span>Selected date</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-indigo-100 rounded"></div>
              <span>Date range</span>
            </div>
          </div>
          
          <div className="text-xs text-zinc-500">
            {selectionMode === 'start' ? 'Select start date' : 'Select end date'}
          </div>
        </div>
      </div>
    </div>
  );
}
