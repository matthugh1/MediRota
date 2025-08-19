import React from 'react';
import { motion } from 'framer-motion';
import { Lock, Unlock } from 'lucide-react';

import { Assignment } from '../../../../lib/hooks';

interface ScheduleCellProps {
  date: string;
  slot: string;
  assignments: Assignment[];
  isLocked: boolean;
  onToggleLock: () => void;
  isSelected?: boolean;
  hasBreach?: boolean;
  breachSeverity?: 'low' | 'medium' | 'high';
  onClick?: () => void;
  onDoubleClick?: () => void;
}

export function ScheduleCell({
  date,
  slot,
  assignments,
  isLocked,
  onToggleLock,
  isSelected = false,
  hasBreach = false,
  breachSeverity = 'low',
  onClick,
  onDoubleClick,
}: ScheduleCellProps) {
  const getBreachColor = () => {
    switch (breachSeverity) {
      case 'high':
        return 'bg-red-100 border-red-200';
      case 'medium':
        return 'bg-yellow-100 border-yellow-200';
      case 'low':
        return 'bg-orange-100 border-orange-200';
      default:
        return '';
    }
  };

  const getShiftIcon = (isNight: boolean) => {
    return isNight ? '🌙' : '👥';
  };

  return (
    <div
      className={`
        relative p-2 min-h-[60px] border rounded-lg transition-all duration-200
        ${isSelected ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}
        ${hasBreach ? getBreachColor() : 'bg-white border-zinc-200'}
        ${onClick ? 'cursor-pointer hover:shadow-md' : ''}
      `}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      {/* Lock Toggle */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleLock();
        }}
        className={`
          absolute top-1 right-1 p-1 rounded-full transition-colors
          ${isLocked 
            ? 'text-zinc-600 hover:text-zinc-800 bg-zinc-100 hover:bg-zinc-200' 
            : 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50'
          }
        `}
        title={isLocked ? 'Unlock' : 'Lock'}
      >
        {isLocked ? (
          <Lock className="w-3 h-3" />
        ) : (
          <Unlock className="w-3 h-3" />
        )}
      </button>

      {/* Assignments */}
      <div className="space-y-1 mt-4">
        {assignments.length > 0 ? (
          assignments.map((assignment) => (
            <motion.div
              key={assignment.id}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs border border-indigo-200 text-indigo-700 bg-indigo-50"
            >
              <span className="text-xs">{getShiftIcon(assignment.shiftType.isNight)}</span>
              <span className="font-medium">{assignment.staff.role}</span>
              <span className="text-indigo-600">{assignment.shiftType.name}</span>
            </motion.div>
          ))
        ) : (
          <div className="text-xs text-zinc-400 text-center py-2">
            No assignment
          </div>
        )}
      </div>

      {/* Breach Indicator */}
      {hasBreach && (
        <div className="absolute bottom-1 left-1">
          <div className={`
            w-2 h-2 rounded-full
            ${breachSeverity === 'high' ? 'bg-red-500' : 
              breachSeverity === 'medium' ? 'bg-yellow-500' : 'bg-orange-500'}
          `} />
        </div>
      )}
    </div>
  );
}
