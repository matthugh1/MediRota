import React from 'react';
import { Shield, Building2, Calendar, Globe, Clock, ArrowRight } from 'lucide-react';
import { useEffectivePolicy } from '../../../../lib/hooks';

interface EffectivePolicyDisplayProps {
  wardId?: string;
  scheduleId?: string;
}

const EffectivePolicyDisplay: React.FC<EffectivePolicyDisplayProps> = ({ 
  wardId, 
  scheduleId 
}) => {
  const { data: policy, isLoading, error } = useEffectivePolicy(wardId, scheduleId);

  if (isLoading) {
    return (
      <div className="bg-white border border-neutral-200 rounded-lg p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-neutral-200 rounded w-1/3 mb-2"></div>
          <div className="h-3 bg-neutral-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error || !policy) {
    return (
      <div className="bg-white border border-neutral-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 text-neutral-600">
          <Shield className="w-4 h-4" />
          <span className="text-sm">No policy information available</span>
        </div>
      </div>
    );
  }

  const getScopeIcon = (scope: string) => {
    switch (scope) {
      case 'ORG':
        return <Globe className="w-4 h-4 text-blue-600" />;
      case 'WARD':
        return <Building2 className="w-4 h-4 text-green-600" />;
      case 'SCHEDULE':
        return <Calendar className="w-4 h-4 text-purple-600" />;
      default:
        return <Shield className="w-4 h-4 text-neutral-600" />;
    }
  };

  const getScopeLabel = (scope: string) => {
    switch (scope) {
      case 'ORG':
        return 'Organization-wide';
      case 'WARD':
        return 'Ward-specific';
      case 'SCHEDULE':
        return 'Schedule-specific';
      default:
        return scope;
    }
  };

  const formatTimeBudget = (ms: number) => {
    const seconds = Math.round(ms / 1000);
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div className="bg-white border border-neutral-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-neutral-900">Effective Policy</h3>
        <div className="flex items-center space-x-2 text-xs text-neutral-600">
          <Clock className="w-3 h-3" />
          <span>Timeout: {formatTimeBudget(policy.timeBudgetMs)}</span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          {getScopeIcon(policy.scope)}
          <span className="text-sm font-medium text-neutral-900">
            {policy.label}
          </span>
        </div>
        
        <div className="flex items-center space-x-1 text-xs text-neutral-600">
          <span>{getScopeLabel(policy.scope)}</span>
          {policy.scope !== 'ORG' && (
            <>
              <ArrowRight className="w-3 h-3" />
              <span>Overrides organization policy</span>
            </>
          )}
        </div>

        <div className="text-xs text-neutral-500">
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div>
              <span className="font-medium">Weights:</span>
              <div className="text-xs">
                <div>Unmet: {policy.weights.unmet.toLocaleString()}</div>
                <div>Fairness: {policy.weights.fairness}</div>
                <div>Overtime: {policy.weights.overtime.toLocaleString()}</div>
              </div>
            </div>
            <div>
              <span className="font-medium">Limits:</span>
              <div className="text-xs">
                <div>Max OT: {policy.limits.maxOvertimePerWeekMinutes}m/week</div>
                <div>Flex shifts: {policy.limits.maxFlexShiftsPerWeek}/week</div>
              </div>
            </div>
          </div>
        </div>

        {/* Policy Rules */}
        {policy.policyRules && policy.policyRules.length > 0 && (
          <div className="mt-3 pt-3 border-t border-neutral-200">
            <div className="text-xs font-medium text-neutral-700 mb-2">Rules:</div>
            <div className="space-y-1">
              {policy.policyRules.map((rule) => (
                <div key={rule.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                      rule.kind === 'HARD' 
                        ? 'bg-red-100 text-red-700' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {rule.kind}
                    </span>
                    <span className="text-neutral-600">{rule.ruleTemplate.name}</span>
                  </div>
                  {rule.weight && (
                    <span className="text-neutral-500">w: {rule.weight}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EffectivePolicyDisplay;
