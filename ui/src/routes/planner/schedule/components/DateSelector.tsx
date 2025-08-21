import React from 'react';
import { DateTime } from 'luxon';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface DateSelectorProps {
  currentDate: DateTime;
  onDateChange: (date: DateTime) => void;
  view: 'week' | 'month';
  onViewChange: (view: 'week' | 'month') => void;
}

export function DateSelector({ currentDate, onDateChange, view, onViewChange }: DateSelectorProps) {
  const handlePrevious = () => {
    onDateChange(currentDate.minus({ [view === 'week' ? 'weeks' : 'months']: 1 }));
  };

  const handleNext = () => {
    onDateChange(currentDate.plus({ [view === 'week' ? 'weeks' : 'months']: 1 }));
  };

  const handleToday = () => {
    const today = DateTime.now();
    onDateChange(today.startOf('week'));
  };

  const formatDateRange = () => {
    if (view === 'week') {
      const weekStart = currentDate.startOf('week');
      const weekEnd = currentDate.endOf('week');
      return `${weekStart.toFormat('MMM d')} - ${weekEnd.toFormat('MMM d, yyyy')}`;
    } else {
      return currentDate.toFormat('MMMM yyyy');
    }
  };

  return (
    <div className="flex items-center justify-between bg-white border border-zinc-200 rounded-lg p-4">
      <div className="flex items-center space-x-4">
        <button
          onClick={handlePrevious}
          className="p-2 text-zinc-400 hover:text-zinc-600 transition-colors rounded-lg hover:bg-zinc-50"
          title={`Previous ${view}`}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        <div className="flex items-center space-x-3">
          <Calendar className="w-5 h-5 text-zinc-500" />
          <h2 className="text-lg font-semibold text-zinc-900">
            {formatDateRange()}
          </h2>
        </div>
        
        <button
          onClick={handleNext}
          className="p-2 text-zinc-400 hover:text-zinc-600 transition-colors rounded-lg hover:bg-zinc-50"
          title={`Next ${view}`}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="flex items-center space-x-3">
        <button
          onClick={handleToday}
          className="px-3 py-2 text-sm font-medium text-zinc-700 bg-zinc-100 border border-zinc-300 rounded-lg hover:bg-zinc-200 transition-colors"
        >
          Today
        </button>
        
        <div className="flex items-center space-x-1 bg-zinc-100 rounded-lg p-1">
          <button
            onClick={() => onViewChange('week')}
            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
              view === 'week'
                ? 'bg-white text-zinc-900 shadow-sm'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => onViewChange('month')}
            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
              view === 'month'
                ? 'bg-white text-zinc-900 shadow-sm'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Month
          </button>
        </div>
      </div>
    </div>
  );
}

