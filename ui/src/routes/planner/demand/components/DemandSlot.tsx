import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Users, AlertCircle } from 'lucide-react';

interface DemandSlotProps {
  date: string;
  slot: string;
  demand: Record<string, number>;
  isSelected?: boolean;
  isInSelection?: boolean;
  hasCoverage?: boolean;
  coverageRatio?: number;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onMouseDown?: () => void;
  isHourly?: boolean;
  shiftType?: {
    name: string;
    startTime: string;
    endTime: string;
    isNight: boolean;
  };
}

export function DemandSlot({
  date,
  slot,
  demand,
  isSelected = false,
  isInSelection = false,
  hasCoverage = false,
  coverageRatio = 0,
  onClick,
  onMouseEnter,
  onMouseLeave,
  onMouseDown,
  isHourly = false,
  shiftType,
}: DemandSlotProps) {
  const totalDemand = Object.values(demand).reduce((sum, count) => sum + count, 0);
  const isOverDemand = totalDemand > 0;
  const isUnderCoverage = hasCoverage && coverageRatio < 1;
  
  // Debug logging for first few slots
  if (date === '2025-01-01' && slot === 'DAY') {
    console.log('🔍 DemandSlot debug:', {
      date,
      slot,
      demand,
      totalDemand,
      isOverDemand,
      demandKeys: Object.keys(demand),
      demandValues: Object.values(demand)
    });
  }

  const getSlotDisplay = () => {
    if (isHourly) {
      return slot;
    }
    return shiftType?.name || slot;
  };

  const getSlotColor = () => {
    if (isSelected) return 'bg-indigo-100 border-indigo-300';
    if (isInSelection) return 'bg-indigo-50 border-indigo-200';
    if (isUnderCoverage) return 'bg-red-50 border-red-200';
    if (isOverDemand) return 'bg-green-50 border-green-200';
    return 'bg-zinc-50 border-zinc-200';
  };

  const getSlotIcon = () => {
    if (shiftType?.isNight) return '🌙';
    if (isHourly) return '🕐';
    return '👥';
  };

  return (
    <motion.div
      className={`
        relative p-3 rounded-lg border-2 cursor-pointer transition-all duration-200
        hover:shadow-md hover:scale-105
        ${getSlotColor()}
        ${isSelected ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}
      `}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onMouseDown={onMouseDown}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Slot Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-1">
          <span className="text-lg">{getSlotIcon()}</span>
          <span className="text-sm font-medium text-zinc-700">
            {getSlotDisplay()}
          </span>
        </div>
        {shiftType && (
          <span className="text-xs text-zinc-500">
            {shiftType.startTime}-{shiftType.endTime}
          </span>
        )}
      </div>

      {/* Demand Summary */}
      {isOverDemand ? (
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-600">Required</span>
            <span className="text-xs font-bold text-zinc-900">{totalDemand}</span>
          </div>
          
          {/* Skill breakdown */}
          <div className="space-y-1">
            {Object.entries(demand).map(([skill, count]) => (
              <div key={skill} className="flex items-center justify-between">
                <span className="text-xs text-zinc-500 truncate">{skill}</span>
                <span className="text-xs font-medium text-zinc-700">{count}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center py-2">
          <span className="text-xs text-zinc-400">No demand set</span>
        </div>
      )}

      {/* Coverage Badge */}
      {hasCoverage && (
        <div className="absolute -top-1 -right-1">
          <div className={`
            px-2 py-1 rounded-full text-xs font-medium
            ${coverageRatio >= 1 
              ? 'bg-green-100 text-green-800' 
              : coverageRatio >= 0.8 
                ? 'bg-yellow-100 text-yellow-800' 
                : 'bg-red-100 text-red-800'
            }
          `}>
            {Math.round(coverageRatio * 100)}%
          </div>
        </div>
      )}

      {/* Under Coverage Warning */}
      {isUnderCoverage && (
        <div className="absolute -bottom-1 -right-1">
          <AlertCircle className="w-4 h-4 text-red-500" />
        </div>
      )}
    </motion.div>
  );
}
