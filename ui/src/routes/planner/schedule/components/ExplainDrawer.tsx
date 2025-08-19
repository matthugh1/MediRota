import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, CheckCircle, AlertTriangle, Users, Clock } from 'lucide-react';

interface Alternative {
  id: string;
  staffId: string;
  staffName: string;
  staffRole: string;
  fairnessDelta: number;
  newBreaches: Array<{
    date: string;
    slot: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
  }>;
  reason: string;
}

interface ExplainData {
  reasons: string[];
  alternatives: Alternative[];
  currentAssignment: {
    staffId: string;
    staffName: string;
    staffRole: string;
    shiftType: string;
  };
}

interface ExplainDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  scheduleId: string;
  staffId: string;
  date: string;
  slot: string;
  onApplyAlternative: (alternativeId: string) => Promise<void>;
}

export function ExplainDrawer({
  isOpen,
  onClose,
  scheduleId,
  staffId,
  date,
  slot,
  onApplyAlternative,
}: ExplainDrawerProps) {
  const [data, setData] = useState<ExplainData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [selectedAlternative, setSelectedAlternative] = useState<string>('');
  const [applying, setApplying] = useState(false);

  // Fetch explain data when drawer opens
  useEffect(() => {
    if (isOpen && scheduleId && staffId && date && slot) {
      fetchExplainData();
    }
  }, [isOpen, scheduleId, staffId, date, slot]);

  const fetchExplainData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const params = new URLSearchParams({
        scheduleId,
        staffId,
        date,
        slot,
      });
      
      const response = await fetch(`/api/explain?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch explain data: ${response.statusText}`);
      }
      
      const explainData = await response.json();
      setData(explainData);
      
      // Auto-select first alternative if available
      if (explainData.alternatives?.length > 0) {
        setSelectedAlternative(explainData.alternatives[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load explain data');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyAlternative = async () => {
    if (!selectedAlternative) return;
    
    setApplying(true);
    try {
      await onApplyAlternative(selectedAlternative);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply alternative');
    } finally {
      setApplying(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter' && selectedAlternative) {
      handleApplyAlternative();
    }
  };

  const getFairnessColor = (delta: number) => {
    if (delta > 0.5) return 'text-green-600';
    if (delta > 0) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getBreachColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-orange-600 bg-orange-50 border-orange-200';
      default: return 'text-zinc-600 bg-zinc-50 border-zinc-200';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/25 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50"
            onKeyDown={handleKeyDown}
            tabIndex={0}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-zinc-200">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900">Explain Assignment</h2>
                <p className="text-sm text-zinc-500">
                  {date} • {slot}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-zinc-400 hover:text-zinc-600 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {loading && (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                </div>
              )}

              {data && (
                <>
                  {/* Current Assignment */}
                  <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-zinc-700 mb-2">Current Assignment</h3>
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-indigo-100 rounded-lg">
                        <Users className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-medium text-zinc-900">{data.currentAssignment.staffName}</p>
                        <p className="text-sm text-zinc-500">
                          {data.currentAssignment.staffRole} • {data.currentAssignment.shiftType}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Reasons */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-zinc-700">Why this assignment?</h3>
                    <div className="space-y-2">
                      {data.reasons.map((reason, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full mt-2 flex-shrink-0"></div>
                          <p className="text-sm text-zinc-600">{reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Alternatives */}
                  {data.alternatives.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium text-zinc-700">
                        Alternative Assignments ({data.alternatives.length})
                      </h3>
                      
                      <div className="space-y-3">
                        {data.alternatives.map((alternative) => (
                          <div
                            key={alternative.id}
                            className={`
                              border rounded-lg p-4 cursor-pointer transition-all
                              ${selectedAlternative === alternative.id
                                ? 'border-indigo-300 bg-indigo-50'
                                : 'border-zinc-200 hover:border-zinc-300'
                              }
                            `}
                            onClick={() => setSelectedAlternative(alternative.id)}
                          >
                            {/* Staff Info */}
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-3">
                                <div className="p-1.5 bg-white border border-zinc-200 rounded">
                                  <Users className="w-3 h-3 text-zinc-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-zinc-900">{alternative.staffName}</p>
                                  <p className="text-xs text-zinc-500">{alternative.staffRole}</p>
                                </div>
                              </div>
                              
                              {/* Fairness Delta */}
                              <div className={`text-sm font-medium ${getFairnessColor(alternative.fairnessDelta)}`}>
                                {alternative.fairnessDelta > 0 ? '+' : ''}{alternative.fairnessDelta.toFixed(2)}
                              </div>
                            </div>

                            {/* Reason */}
                            <p className="text-sm text-zinc-600 mb-3">{alternative.reason}</p>

                            {/* New Breaches */}
                            {alternative.newBreaches.length > 0 && (
                              <div className="space-y-2">
                                <p className="text-xs font-medium text-zinc-500">New potential breaches:</p>
                                <div className="space-y-1">
                                  {alternative.newBreaches.map((breach, index) => (
                                    <div
                                      key={index}
                                      className={`inline-flex items-center px-2 py-1 rounded text-xs border ${getBreachColor(breach.severity)}`}
                                    >
                                      <AlertTriangle className="w-3 h-3 mr-1" />
                                      {breach.description}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {data.alternatives.length === 0 && (
                    <div className="text-center py-8 text-zinc-500">
                      <Clock className="w-8 h-8 mx-auto mb-2 text-zinc-300" />
                      <p className="text-sm">No alternatives available</p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            {data && data.alternatives.length > 0 && (
              <div className="border-t border-zinc-200 p-6">
                <button
                  onClick={handleApplyAlternative}
                  disabled={!selectedAlternative || applying}
                  className="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {applying ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Applying...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Apply Alternative
                    </>
                  )}
                </button>
                <p className="text-xs text-zinc-500 mt-2 text-center">
                  Press Enter to apply selected alternative
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
