import React from 'react';
import { Clock, AlertTriangle, TrendingUp, Zap } from 'lucide-react';

interface Metrics {
  hardViolations?: number;
  fairnessStdev?: number;
  solveMs?: number;
  preferenceSatisfaction?: number;
  coverageRatio?: number;
}

interface MetricsPanelProps {
  metrics?: Metrics;
  isRunning?: boolean;
  lastRunTime?: string;
}

export function MetricsPanel({ metrics, isRunning = false, lastRunTime }: MetricsPanelProps) {
  const formatDuration = (ms?: number) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getViolationColor = (violations?: number) => {
    if (!violations) return 'text-zinc-500';
    if (violations === 0) return 'text-green-600';
    if (violations <= 5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getFairnessColor = (stdev?: number) => {
    if (!stdev) return 'text-zinc-500';
    if (stdev <= 0.5) return 'text-green-600';
    if (stdev <= 1.0) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCoverageColor = (ratio?: number) => {
    if (!ratio) return 'text-zinc-500';
    if (ratio >= 1.0) return 'text-green-600';
    if (ratio >= 0.8) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-zinc-700">Solve Metrics</h3>
        {isRunning && (
          <div className="flex items-center text-indigo-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600 mr-2"></div>
            <span className="text-sm">Running...</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Runtime */}
        <div className="space-y-1">
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4 text-zinc-400" />
            <span className="text-xs font-medium text-zinc-500">Runtime</span>
          </div>
          <div className="text-lg font-semibold text-zinc-900">
            {formatDuration(metrics?.solveMs)}
          </div>
          {lastRunTime && (
            <div className="text-xs text-zinc-400">
              Last: {new Date(lastRunTime).toLocaleTimeString()}
            </div>
          )}
        </div>

        {/* Hard Violations */}
        <div className="space-y-1">
          <div className="flex items-center space-x-1">
            <AlertTriangle className="w-4 h-4 text-zinc-400" />
            <span className="text-xs font-medium text-zinc-500">Violations</span>
          </div>
          <div className={`text-lg font-semibold ${getViolationColor(metrics?.hardViolations)}`}>
            {metrics?.hardViolations ?? 'N/A'}
          </div>
          <div className="text-xs text-zinc-400">
            {metrics?.hardViolations === 0 ? 'No violations' : 'Hard constraints'}
          </div>
        </div>

        {/* Fairness */}
        <div className="space-y-1">
          <div className="flex items-center space-x-1">
            <TrendingUp className="w-4 h-4 text-zinc-400" />
            <span className="text-xs font-medium text-zinc-500">Fairness</span>
          </div>
          <div className={`text-lg font-semibold ${getFairnessColor(metrics?.fairnessStdev)}`}>
            {metrics?.fairnessStdev ? metrics.fairnessStdev.toFixed(2) : 'N/A'}
          </div>
          <div className="text-xs text-zinc-400">
            {metrics?.fairnessStdev ? 'Night shift std dev' : 'Not calculated'}
          </div>
        </div>

        {/* Coverage */}
        <div className="space-y-1">
          <div className="flex items-center space-x-1">
            <Zap className="w-4 h-4 text-zinc-400" />
            <span className="text-xs font-medium text-zinc-500">Coverage</span>
          </div>
          <div className={`text-lg font-semibold ${getCoverageColor(metrics?.coverageRatio)}`}>
            {metrics?.coverageRatio ? `${Math.round(metrics.coverageRatio * 100)}%` : 'N/A'}
          </div>
          <div className="text-xs text-zinc-400">
            {metrics?.coverageRatio ? 'Demand coverage' : 'Not calculated'}
          </div>
        </div>
      </div>

      {/* Additional Metrics */}
      {metrics?.preferenceSatisfaction !== undefined && (
        <div className="mt-4 pt-4 border-t border-zinc-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-700">Preference Satisfaction</span>
            <span className="text-sm font-semibold text-zinc-900">
              {Math.round(metrics.preferenceSatisfaction * 100)}%
            </span>
          </div>
          <div className="mt-2 w-full bg-zinc-200 rounded-full h-2">
            <div 
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${metrics.preferenceSatisfaction * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* No Metrics State */}
      {!metrics && !isRunning && (
        <div className="text-center py-8 text-zinc-500">
          <Clock className="w-8 h-8 mx-auto mb-2 text-zinc-300" />
          <p className="text-sm">No solve metrics available</p>
          <p className="text-xs">Run solve to see metrics</p>
        </div>
      )}
    </div>
  );
}
