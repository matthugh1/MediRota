import React, { useState, useEffect } from 'react';
import { useOrgScope } from '../lib/orgScope.js';
import api from '../lib/api.js';

interface EffectivePolicy {
  id: string;
  scope: string;
  label: string;
  origin?: string;
}

interface EffectiveRuleSet {
  id: string;
  name: string;
  origin?: string;
}

interface EffectiveShiftType {
  id: string;
  name: string;
  code: string;
  origin?: string;
}

export function EffectiveConfigPanel() {
  const { scope, isHierarchyEnabled } = useOrgScope();
  const [policy, setPolicy] = useState<EffectivePolicy | null>(null);

  const [shiftTypes, setShiftTypes] = useState<EffectiveShiftType[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isHierarchyEnabled || !scope.hospitalId) {
      setPolicy(null);

      setShiftTypes([]);
      return;
    }

    const loadEffectiveConfig = async () => {
      try {
        setLoading(true);
        
        // Load effective policy
        try {
          const policyResponse = await api.get('/api/policy/effective?wardId=test');
          setPolicy(policyResponse.data);
        } catch (error) {
          console.warn('Failed to load effective policy:', error);
        }



        // Load effective shift types
        try {
          const shiftTypesResponse = await api.get('/shift-types/effective?wardId=test');
          setShiftTypes(shiftTypesResponse.data);
        } catch (error) {
          console.warn('Failed to load effective shift types:', error);
        }
      } catch (error) {
        console.error('Failed to load effective configuration:', error);
      } finally {
        setLoading(false);
      }
    };

    loadEffectiveConfig();
  }, [isHierarchyEnabled, scope.hospitalId]);

  if (!isHierarchyEnabled) {
    return null;
  }

  if (!scope.hospitalId) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <div className="text-sm text-yellow-800">
          <strong>Effective Configuration:</strong> Select a hospital to view effective configuration.
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
      <div className="text-sm text-blue-800 mb-3">
        <strong>Effective Configuration for {scope.hospitalName}</strong>
      </div>
      
      {loading ? (
        <div className="text-sm text-blue-600">Loading effective configuration...</div>
      ) : (
        <div className="space-y-3">
          {policy && (
            <div>
              <div className="text-xs font-medium text-blue-700">Policy</div>
              <div className="text-xs text-blue-600">
                {policy.label} {policy.origin && `(from ${policy.origin})`}
              </div>
            </div>
          )}
          

          
          {shiftTypes.length > 0 && (
            <div>
              <div className="text-xs font-medium text-blue-700">Shift Types</div>
              <div className="text-xs text-blue-600">
                {shiftTypes.length} shift type(s) available
                {shiftTypes[0]?.origin && ` (from ${shiftTypes[0].origin})`}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
