import { QueryClient } from '@tanstack/react-query';

// Create a query client with default options
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});

// Query keys factory for consistent key management
export const queryKeys = {
  wards: {
    all: ['wards'] as const,
    lists: () => [...queryKeys.wards.all, 'list'] as const,
    list: (filters: any) => [...queryKeys.wards.lists(), filters] as const,
    details: () => [...queryKeys.wards.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.wards.details(), id] as const,
  },
  skills: {
    all: ['skills'] as const,
    lists: () => [...queryKeys.skills.all, 'list'] as const,
    list: (filters: any) => [...queryKeys.skills.lists(), filters] as const,
    details: () => [...queryKeys.skills.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.skills.details(), id] as const,
  },
  staff: {
    all: ['staff'] as const,
    lists: () => [...queryKeys.staff.all, 'list'] as const,
    list: (filters: any) => [...queryKeys.staff.lists(), filters] as const,
    details: () => [...queryKeys.staff.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.staff.details(), id] as const,
    myShifts: (staffId: string) => [...queryKeys.staff.all, 'myShifts', staffId] as const,
  },
  shiftTypes: {
    all: ['shiftTypes'] as const,
    lists: () => [...queryKeys.shiftTypes.all, 'list'] as const,
    list: (filters: any) => [...queryKeys.shiftTypes.lists(), filters] as const,
    details: () => [...queryKeys.shiftTypes.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.shiftTypes.details(), id] as const,
  },
  
  demand: {
    all: ['demand'] as const,
    lists: () => [...queryKeys.demand.all, 'list'] as const,
    list: (filters: any) => [...queryKeys.demand.lists(), filters] as const,
    details: () => [...queryKeys.demand.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.demand.details(), id] as const,
  },
  schedules: {
    all: ['schedules'] as const,
    lists: () => [...queryKeys.schedules.all, 'list'] as const,
    list: (wardId: string) => [...queryKeys.schedules.lists(), { wardId }] as const,
    details: () => [...queryKeys.schedules.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.schedules.details(), id] as const,
  },
  locks: {
    all: ['locks'] as const,
    lists: () => [...queryKeys.locks.all, 'list'] as const,
    list: (scheduleId: string) => [...queryKeys.locks.lists(), { scheduleId }] as const,
    details: () => [...queryKeys.locks.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.locks.details(), id] as const,
  },
  preferences: {
    all: ['preferences'] as const,
    lists: () => [...queryKeys.preferences.all, 'list'] as const,
    list: (scheduleId: string) => [...queryKeys.preferences.lists(), { scheduleId }] as const,
  },
  policies: {
    all: ['policies'] as const,
    lists: () => [...queryKeys.policies.all, 'list'] as const,
    list: (filters: any) => [...queryKeys.policies.lists(), filters] as const,
    details: () => [...queryKeys.policies.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.policies.details(), id] as const,
    effective: (params: { wardId?: string; scheduleId?: string }) => 
      [...queryKeys.policies.all, 'effective', params] as const,
  },
} as const;

// Utility function to invalidate related queries
export const invalidateQueries = {
  wards: () => queryClient.invalidateQueries({ queryKey: queryKeys.wards.all }),
  skills: () => queryClient.invalidateQueries({ queryKey: queryKeys.skills.all }),
  staff: () => queryClient.invalidateQueries({ queryKey: queryKeys.staff.all }),
  shiftTypes: () => queryClient.invalidateQueries({ queryKey: queryKeys.shiftTypes.all }),
  
  demand: () => queryClient.invalidateQueries({ queryKey: queryKeys.demand.all }),
  schedules: () => queryClient.invalidateQueries({ queryKey: queryKeys.schedules.all }),
  locks: () => queryClient.invalidateQueries({ queryKey: queryKeys.locks.all }),
  preferences: () => queryClient.invalidateQueries({ queryKey: queryKeys.preferences.all }),
  policies: () => queryClient.invalidateQueries({ queryKey: queryKeys.policies.all }),
} as const;
