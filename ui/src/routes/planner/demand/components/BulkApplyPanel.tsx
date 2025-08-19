import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Users, AlertTriangle } from 'lucide-react';

interface BulkApplyPanelProps {
  isVisible: boolean;
  selectedSlots: Set<string>;
  sourceDemand: Record<string, number>;
  onApplyToSelection: () => void;
  onClearSelection: () => void;
  isLoading?: boolean;
}

export function BulkApplyPanel({
  isVisible,
  selectedSlots,
  sourceDemand,
  onApplyToSelection,
  onClearSelection,
  isLoading = false,
}: BulkApplyPanelProps) {
  const selectedCount = selectedSlots.size;
  const totalDemand = Object.values(sourceDemand).reduce((sum, count) => sum + count, 0);

  if (!isVisible || selectedCount === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50"
      >
        <div className="bg-white border border-zinc-200 rounded-lg shadow-lg p-4 min-w-96">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Copy className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-zinc-900">
                  Bulk Apply Demand
                </h3>
                <p className="text-xs text-zinc-500">
                  {selectedCount} slot{selectedCount !== 1 ? 's' : ''} selected
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={onClearSelection}
                className="px-3 py-1 text-xs font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
              >
                Clear
              </button>
              <button
                onClick={onApplyToSelection}
                disabled={isLoading || totalDemand === 0}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Applying...
                  </div>
                ) : (
                  'Apply to Selection'
                )}
              </button>
            </div>
          </div>

          {/* Demand Preview */}
          {totalDemand > 0 && (
            <div className="mt-3 p-3 bg-zinc-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-zinc-700">Will apply:</span>
                <span className="text-xs font-bold text-zinc-900">{totalDemand} total</span>
              </div>
              <div className="space-y-1">
                {Object.entries(sourceDemand).map(([skill, count]) => (
                  <div key={skill} className="flex items-center justify-between">
                    <span className="text-xs text-zinc-600">{skill}</span>
                    <span className="text-xs font-medium text-zinc-700">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {totalDemand === 0 && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                <span className="text-xs text-yellow-700">
                  No demand set in source slot. Select a slot with demand first.
                </span>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
