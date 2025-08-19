import React, { useState, useEffect } from 'react';
import { useOrgScope } from '../lib/orgScope.js';
import { apiClient } from '../lib/api.js';

interface Trust {
  id: string;
  name: string;
}

interface Hospital {
  id: string;
  name: string;
  trustId: string;
}

export function ScopeDropdown() {
  const { scope, setTrust, setHospital, isHierarchyEnabled } = useOrgScope();
  const [trusts, setTrusts] = useState<Trust[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(false);

  // Load trusts on mount
  useEffect(() => {
    if (!isHierarchyEnabled) return;
    
    const loadTrusts = async () => {
      try {
        setLoading(true);
        // TODO: Replace with actual API endpoint when implemented
        // const response = await apiClient.get('/trusts');
        // setTrusts(response.data);
        
        // Mock data for now
        setTrusts([
          { id: 'trust-1', name: 'NHS Trust A' },
          { id: 'trust-2', name: 'NHS Trust B' },
        ]);
      } catch (error) {
        console.error('Failed to load trusts:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTrusts();
  }, [isHierarchyEnabled]);

  // Load hospitals when trust changes
  useEffect(() => {
    if (!isHierarchyEnabled || !scope.trustId) {
      setHospitals([]);
      return;
    }

    const loadHospitals = async () => {
      try {
        setLoading(true);
        // TODO: Replace with actual API endpoint when implemented
        // const response = await apiClient.get(`/hospitals?trustId=${scope.trustId}`);
        // setHospitals(response.data);
        
        // Mock data for now
        setHospitals([
          { id: 'hospital-1', name: 'General Hospital', trustId: scope.trustId },
          { id: 'hospital-2', name: 'Specialist Hospital', trustId: scope.trustId },
        ]);
      } catch (error) {
        console.error('Failed to load hospitals:', error);
      } finally {
        setLoading(false);
      }
    };

    loadHospitals();
  }, [isHierarchyEnabled, scope.trustId]);

  if (!isHierarchyEnabled) {
    return null;
  }

  return (
    <div className="flex items-center space-x-4 p-4 bg-gray-50 border-b">
      <div className="flex items-center space-x-2">
        <label className="text-sm font-medium text-gray-700">Trust:</label>
        <select
          value={scope.trustId || ''}
          onChange={(e) => {
            const trust = trusts.find(t => t.id === e.target.value);
            if (trust) {
              setTrust(trust.id, trust.name);
            }
          }}
          className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        >
          <option value="">Select Trust</option>
          {trusts.map(trust => (
            <option key={trust.id} value={trust.id}>
              {trust.name}
            </option>
          ))}
        </select>
      </div>

      {scope.trustId && (
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">Hospital:</label>
          <select
            value={scope.hospitalId || ''}
            onChange={(e) => {
              const hospital = hospitals.find(h => h.id === e.target.value);
              if (hospital) {
                setHospital(hospital.id, hospital.name);
              }
            }}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          >
            <option value="">Select Hospital</option>
            {hospitals.map(hospital => (
              <option key={hospital.id} value={hospital.id}>
                {hospital.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {loading && (
        <div className="text-sm text-gray-500">
          Loading...
        </div>
      )}
    </div>
  );
}
