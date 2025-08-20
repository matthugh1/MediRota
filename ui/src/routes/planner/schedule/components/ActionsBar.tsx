import React from 'react';
import { Play, Wrench, Plus, AlertCircle } from 'lucide-react';

interface ActionsBarProps {
  onRunSolve: () => void;
  onRunRepair: () => void;
  onCreateSchedule: () => void;
  isSolveRunning?: boolean;
  isRepairRunning?: boolean;
  hasSchedule?: boolean;
  error?: string;
  onClearError?: () => void;
}

export function ActionsBar({
  onRunSolve,
  onRunRepair,
  onCreateSchedule,
  isSolveRunning = false,
  isRepairRunning = false,
  hasSchedule = false,
  error,
  onClearError,
}: ActionsBarProps) {
  return (
    <div className="space-y-4">
      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
            {onClearError && (
              <button
                onClick={onClearError}
                className="text-red-400 hover:text-red-600 transition-colors"
              >
                <span className="sr-only">Dismiss</span>
                ×
              </button>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="bg-white border border-zinc-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Always show Create Schedule button */}
            <button
              onClick={onCreateSchedule}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Schedule
            </button>

            {/* Show Solve and Repair buttons only when a schedule exists */}
            {hasSchedule && (
              <>
                <button
                  onClick={onRunSolve}
                  disabled={isSolveRunning || isRepairRunning}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSolveRunning ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Running Solve...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Run Solve
                    </>
                  )}
                </button>

                <button
                  onClick={onRunRepair}
                  disabled={isSolveRunning || isRepairRunning}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isRepairRunning ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-zinc-600 mr-2"></div>
                      Running Repair...
                    </>
                  ) : (
                    <>
                      <Wrench className="w-4 h-4 mr-2" />
                      Repair
                    </>
                  )}
                </button>
              </>
            )}
          </div>

          {/* Keyboard Shortcuts Help */}
          {hasSchedule && (
            <div className="text-xs text-zinc-500">
              <span className="font-medium">Keyboard:</span> s = Solve, r = Repair, Space = Toggle Lock
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
