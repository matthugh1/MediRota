import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient, { PaginatedResponse } from './api';
import { queryKeys, invalidateQueries } from './query';
import { DateTime } from 'luxon';
import axios from 'axios';
import { useOrgScope } from './orgScope.js';
import { ORG_HIERARCHY_ENABLED } from './flags.js';

// Types for API responses
export interface Hospital {
  id: string;
  name: string;
}

export interface Ward {
  id: string;
  name: string;
  hourlyGranularity: boolean;
  createdAt: string;
  updatedAt: string;
  hospital?: Hospital | null;
}

export interface Skill {
  id: string;
  code: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  wards: { id: string; name: string; hospitalId?: string | null }[];
}

export interface Staff {
  id: string;
  fullName: string;
  role: 'doctor' | 'nurse';
  gradeBand?: string;
  contractHoursPerWeek: number;
  active: boolean;
  wards: Ward[];
  skills: Skill[];
  jobRole?: { id: string; code: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface ShiftType {
  id: string;
  code: string;
  name: string;
  startTime: string;
  endTime: string;
  isNight: boolean;
  durationMinutes: number;
  createdAt: string;
  updatedAt: string;
}



export interface Demand {
  id: string;
  wardId: string;
  date: string;
  slot: string;
  requiredBySkill: Record<string, number>;
  hourlyGranularity: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Schedule {
  id: string;
  wardId: string;
  horizonStart: string;
  horizonEnd: string;
  status: 'draft' | 'published' | 'archived';
  objective?: string;
  metrics?: any;
  ward: Ward;
  assignments: Assignment[];
  events: Event[];
  createdAt: string;
  updatedAt: string;
}

export interface Assignment {
  id: string;
  scheduleId: string;
  staffId: string;
  wardId: string;
  date: string;
  slot: string;
  shiftTypeId: string;
  staff: Staff;
  shiftType: ShiftType;
  createdAt: string;
  updatedAt: string;
}

export interface Event {
  id: string;
  scheduleId: string;
  type: string;
  payload: any;
  createdAt: string;
}

// Utility function to merge filters with hospital filtering when org hierarchy is enabled
const useMergedFilters = (filters?: any) => {
  const { scope, isHierarchyEnabled } = useOrgScope();
  
  if (!isHierarchyEnabled || !scope.hospitalId) {
    return filters;
  }
  
  return {
    ...filters,
    hospitalId: scope.hospitalId,
  };
};

// Wards hooks
export const useWards = (filters?: any) => {
  const mergedFilters = useMergedFilters(filters);
  
  return useQuery({
    queryKey: queryKeys.wards.list(mergedFilters),
    queryFn: async (): Promise<PaginatedResponse<Ward>> => {
      const response = await apiClient.get('/wards', { params: mergedFilters });
      return response.data;
    },
  });
};

export const useWard = (id: string) => {
  return useQuery({
    queryKey: queryKeys.wards.detail(id),
    queryFn: async (): Promise<Ward> => {
      const response = await apiClient.get(`/wards/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
};

// Skills hooks
export const useSkills = (filters?: any) => {
  const mergedFilters = useMergedFilters(filters);
  
  return useQuery({
    queryKey: queryKeys.skills.list(mergedFilters),
    queryFn: async (): Promise<PaginatedResponse<Skill>> => {
      const response = await apiClient.get('/skills', { params: mergedFilters });
      return response.data;
    },
  });
};

export const useSkill = (id: string) => {
  return useQuery({
    queryKey: queryKeys.skills.detail(id),
    queryFn: async (): Promise<Skill> => {
      const response = await apiClient.get(`/skills/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
};

// Staff hooks
export const useStaff = (filters?: any) => {
  const mergedFilters = useMergedFilters(filters);
  
  return useQuery({
    queryKey: queryKeys.staff.list(mergedFilters),
    queryFn: async (): Promise<PaginatedResponse<Staff>> => {
      const response = await apiClient.get('/staff', { params: mergedFilters });
      return response.data;
    },
  });
};

export const useStaffMember = (id: string) => {
  return useQuery({
    queryKey: queryKeys.staff.detail(id),
    queryFn: async (): Promise<Staff> => {
      const response = await apiClient.get(`/staff/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
};

export const useMyShifts = (staffId: string) => {
  return useQuery({
    queryKey: queryKeys.staff.myShifts(staffId),
    queryFn: async (): Promise<Assignment[]> => {
      const response = await apiClient.get(`/staff/${staffId}/shifts`);
      return response.data;
    },
    enabled: !!staffId,
  });
};

// Shift Types hooks
export const useShiftTypes = (filters?: any) => {
  const mergedFilters = useMergedFilters(filters);
  
  return useQuery({
    queryKey: queryKeys.shiftTypes.list(mergedFilters),
    queryFn: async (): Promise<PaginatedResponse<ShiftType>> => {
      const response = await apiClient.get('/shift-types', { params: mergedFilters });
      return response.data;
    },
  });
};

export const useShiftType = (id: string) => {
  return useQuery({
    queryKey: queryKeys.shiftTypes.detail(id),
    queryFn: async (): Promise<ShiftType> => {
      const response = await apiClient.get(`/shift-types/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
};



// Demand hooks
export const useDemand = (wardId: string, dateRange?: { start: string; end: string }) => {
  return useQuery({
    queryKey: queryKeys.demand.list({ wardId, dateRange }),
    queryFn: async (): Promise<PaginatedResponse<Demand>> => {
      const params = new URLSearchParams();
      if (wardId) params.append('wardId', wardId);
      if (dateRange?.start) params.append('startDate', dateRange.start);
      if (dateRange?.end) params.append('endDate', dateRange.end);
      
      const response = await apiClient.get(`/demand?${params.toString()}`);
      // The backend returns a plain array, so we need to wrap it in the expected format
      return {
        data: response.data,
        total: response.data.length,
        page: 1,
        limit: response.data.length,
        totalPages: 1,
      };
    },
    enabled: !!wardId,
  });
};

// Schedules hooks
export const useSchedules = (wardId?: string) => {
  return useQuery({
    queryKey: queryKeys.schedules.list(wardId || 'all'),
    queryFn: async (): Promise<PaginatedResponse<Schedule>> => {
      const params = wardId ? { wardId } : {};
      const response = await apiClient.get('/schedules', { params });
      return response.data;
    },
    enabled: true, // Always enabled to fetch all schedules
  });
};

export const useSchedule = (id: string) => {
  return useQuery({
    queryKey: queryKeys.schedules.detail(id),
    queryFn: async (): Promise<Schedule> => {
      const response = await apiClient.get(`/schedules/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
};

// Locks hooks
export const useLocks = (scheduleId: string) => {
  return useQuery({
    queryKey: queryKeys.locks.list(scheduleId),
    queryFn: async (): Promise<any[]> => {
      const response = await apiClient.get('/locks', { params: { scheduleId } });
      return response.data;
    },
    enabled: !!scheduleId,
  });
};

// Preferences hooks
export const usePreferences = (scheduleId: string) => {
  return useQuery({
    queryKey: queryKeys.preferences.list(scheduleId),
    queryFn: async (): Promise<any[]> => {
      const response = await apiClient.get('/preferences', { params: { scheduleId } });
      return response.data;
    },
    enabled: !!scheduleId,
  });
};

// Mutation hooks
export const useCreateWard = () => {
  const queryClient = useQueryClient();
  const { scope, isHierarchyEnabled } = useOrgScope();
  
  return useMutation({
    mutationFn: async (data: Partial<Ward>) => {
      const wardData = {
        ...data,
        ...(isHierarchyEnabled && scope.hospitalId && { hospitalId: scope.hospitalId }),
      };
      const response = await apiClient.post('/wards', wardData);
      return response.data;
    },
    onSuccess: () => {
      invalidateQueries.wards();
    },
  });
};

export const useUpdateWard = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Ward> }) => {
      const response = await apiClient.patch(`/wards/${id}`, data);
      return response.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.wards.detail(id) });
      invalidateQueries.wards();
    },
  });
};

export const useDeleteWard = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/wards/${id}`);
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.wards.detail(id) });
      invalidateQueries.wards();
    },
  });
};

// Similar mutation hooks for other entities...
export const useCreateSkill = () => {
  return useMutation({
    mutationFn: async (data: Partial<Skill>) => {
      const response = await apiClient.post('/skills', data);
      return response.data;
    },
    onSuccess: () => {
      invalidateQueries.skills();
    },
  });
};

export const useCreateStaff = () => {
  const { scope, isHierarchyEnabled } = useOrgScope();
  
  return useMutation({
    mutationFn: async (data: Partial<Staff>) => {
      const staffData = {
        ...data,
        ...(isHierarchyEnabled && scope.hospitalId && { hospitalId: scope.hospitalId }),
      };
      const response = await apiClient.post('/staff', staffData);
      return response.data;
    },
    onSuccess: () => {
      invalidateQueries.staff();
    },
  });
};

export const useCreateShiftType = () => {
  const { scope, isHierarchyEnabled } = useOrgScope();
  
  return useMutation({
    mutationFn: async (data: Partial<ShiftType>) => {
      const shiftTypeData = {
        ...data,
        ...(isHierarchyEnabled && scope.hospitalId && { hospitalId: scope.hospitalId }),
      };
      const response = await apiClient.post('/shift-types', shiftTypeData);
      return response.data;
    },
    onSuccess: () => {
      invalidateQueries.shiftTypes();
    },
  });
};

export const useCreateSchedule = () => {
  return useMutation({
    mutationFn: async (data: Partial<Schedule>) => {
      const response = await apiClient.post('/schedules', data);
      return response.data;
    },
    onSuccess: () => {
      invalidateQueries.schedules();
    },
  });
};

// Additional mutation hooks for other entities
export const useUpdateSkill = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Skill> }) => {
      const response = await apiClient.patch(`/skills/${id}`, data);
      return response.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.skills.detail(id) });
      invalidateQueries.skills();
    },
  });
};

export const useDeleteSkill = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/skills/${id}`);
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.skills.detail(id) });
      invalidateQueries.skills();
    },
  });
};

export const useUpdateShiftType = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ShiftType> }) => {
      const response = await apiClient.patch(`/shift-types/${id}`, data);
      return response.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.shiftTypes.detail(id) });
      invalidateQueries.shiftTypes();
    },
  });
};

export const useDeleteShiftType = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/shift-types/${id}`);
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.shiftTypes.detail(id) });
      invalidateQueries.shiftTypes();
    },
  });
};



export const useCreateDemand = () => {
  return useMutation({
    mutationFn: async (data: {
      wardId: string;
      date: string;
      slot: string;
      requiredBySkill: Record<string, number>;
    }) => {
      const response = await apiClient.post('/demand', data);
      return response.data;
    },
    onSuccess: () => {
      invalidateQueries.demand();
    },
  });
};

export const useUpdateDemand = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { requiredBySkill: Record<string, number> } }) => {
      const response = await apiClient.patch(`/demand/${id}`, data);
      return response.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.demand.detail(id) });
      invalidateQueries.demand();
    },
  });
};



export const useSolveSchedule = () => {
  return useMutation({
    mutationFn: async (scheduleId: string) => {
      // Get the schedule to find the wardId
      const scheduleResponse = await apiClient.get(`/schedules/${scheduleId}`);
      const schedule = scheduleResponse.data;
      
      // Get the effective policy for this schedule
      const policyParams = new URLSearchParams();
      if (schedule.wardId) policyParams.append('wardId', schedule.wardId);
      policyParams.append('scheduleId', scheduleId);
      
      const policyResponse = await apiClient.get(`/api/policy/effective?${policyParams.toString()}`);
      const policy = policyResponse.data;
      
      // Calculate timeout: policy timeBudgetMs + 30 second buffer
      const timeoutMs = (policy.timeBudgetMs || 60000) + 30000;
      
      // Create a custom axios instance with dynamic timeout
      const solveApi = axios.create({
        baseURL: apiClient.defaults.baseURL,
        timeout: timeoutMs,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const response = await solveApi.post('/solve', { scheduleId });
      return response.data;
    },
    onSuccess: () => {
      invalidateQueries.schedules();
    },
  });
};

export const useRepairSchedule = () => {
  return useMutation({
    mutationFn: async ({ scheduleId, events }: { scheduleId: string; events: any[] }) => {
      const response = await apiClient.post('/solve/repair', { scheduleId, events });
      return response.data;
    },
    onSuccess: () => {
      invalidateQueries.schedules();
    },
  });
};

export const useCreateLock = () => {
  return useMutation({
    mutationFn: async (data: { scheduleId: string; staffId: string; date: string; slot: string }) => {
      const response = await apiClient.post('/locks', data);
      return response.data;
    },
    onSuccess: () => {
      invalidateQueries.locks();
    },
  });
};

export const useDeleteLock = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/locks/${id}`);
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.locks.detail(id) });
      invalidateQueries.locks();
    },
  });
};

// Explain hooks
export const useExplainAssignment = (scheduleId: string, staffId: string, date: string, slot: string) => {
  return useQuery({
    queryKey: ['explain', scheduleId, staffId, date, slot],
    queryFn: async () => {
      const params = new URLSearchParams({ scheduleId, staffId, date, slot });
      const response = await apiClient.get(`/explain?${params.toString()}`);
      return response.data;
    },
    enabled: !!scheduleId && !!staffId && !!date && !!slot,
  });
};

export const useApplyAlternative = () => {
  return useMutation({
    mutationFn: async ({ scheduleId, alternativeId }: { scheduleId: string; alternativeId: string }) => {
      const response = await apiClient.post('/explain/apply', { scheduleId, alternativeId });
      return response.data;
    },
    onSuccess: () => {
      invalidateQueries.schedules();
    },
  });
};

export const useEffectivePolicy = (wardId?: string) => {
  return useQuery({
    queryKey: queryKeys.policies.effective({ wardId }),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (wardId) params.append('wardId', wardId);
      
      const response = await apiClient.get(`/api/policy/effective?${params.toString()}`);
      return response.data;
    },
    enabled: !!wardId,
  });
};
