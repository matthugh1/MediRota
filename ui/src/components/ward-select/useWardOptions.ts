import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useOrgScope } from '../../lib/orgScope.js';
import { ORG_HIERARCHY_ENABLED } from '../../lib/flags.js';
import api from '../../lib/api.js';

export type WardOption = {
  id: string;
  name: string;
  hospital?: { id: string; name: string } | null;
};

export const useWardOptions = () => {
  const { scope } = useOrgScope();
  
  // Determine if we should filter by hospital
  const hospitalId = ORG_HIERARCHY_ENABLED && scope.hospitalId ? scope.hospitalId : undefined;
  
  const { data: wardsData, isLoading, error } = useQuery({
    queryKey: ['wards', { hospitalId }],
    queryFn: async (): Promise<WardOption[]> => {
      const params = hospitalId ? { hospitalId } : {};
      const response = await api.get('/wards', { params });
      return response.data?.data || response.data || [];
    },
    enabled: true, // Always enabled since we need wards for the multi-select
  });

  // Sort options alphabetically by name
  const options = useMemo(() => {
    if (!wardsData) return [];
    return [...wardsData].sort((a, b) => a.name.localeCompare(b.name));
  }, [wardsData]);

  // Group by hospital if multiple hospitals are present
  const groupedByHospital = useMemo(() => {
    if (!options.length) return {};
    
    const hospitals = new Set(options.map(ward => ward.hospital?.name).filter(Boolean));
    
    // Only group if there are multiple hospitals
    if (hospitals.size <= 1) return {};
    
    const grouped: Record<string, WardOption[]> = {};
    options.forEach(ward => {
      const hospitalName = ward.hospital?.name || 'Unknown Hospital';
      if (!grouped[hospitalName]) {
        grouped[hospitalName] = [];
      }
      grouped[hospitalName].push(ward);
    });
    
    return grouped;
  }, [options]);

  return {
    options,
    groupedByHospital,
    isLoading,
    error: error ? (error instanceof Error ? error.message : 'Failed to load wards') : null,
  };
};
