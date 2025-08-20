import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, QueryParams, PaginatedResponse } from '../api';

// Types
export interface Staff {
  id: string;
  prefix?: string | null;
  firstName: string;
  lastName: string;
  fullName: string; // server-composed
  role: string;
  jobId: string;
  job: {
    id: string;
    name: string;
  };
  gradeBand?: string;
  contractHoursPerWeek: number;
  active: boolean;
  wards: Array<{ id: string; name: string }>;
  skills: Array<{ id: string; name: string }>;
  jobRole?: { id: string; code: string; name: string } | null;
  legacyJob?: string | null;
  _count?: {
    assignments: number;
    preferences: number;
  };
}

export interface CreateStaffData {
  prefix?: string;
  firstName: string;
  lastName: string;
  jobId: string;
  gradeBand?: string;
  contractHoursPerWeek: number;
  active?: boolean;
  wardIds?: string[];
  skillIds?: string[];
  jobRoleId?: string;
}

export interface UpdateStaffData extends Partial<CreateStaffData> {
  id: string;
}

export interface StaffListParams extends QueryParams {
  jobId?: string;
  wardId?: string;
  skillId?: string;
  active?: boolean;
}

// Query keys
export const staffKeys = {
  all: ['staff'] as const,
  lists: () => [...staffKeys.all, 'list'] as const,
  list: (params: StaffListParams) => [...staffKeys.lists(), params] as const,
  details: () => [...staffKeys.all, 'detail'] as const,
  detail: (id: string) => [...staffKeys.details(), id] as const,
};

// API functions
const fetchStaffList = async (params: StaffListParams): Promise<PaginatedResponse<Staff>> => {
  const searchParams = new URLSearchParams();
  
  if (params.page) searchParams.append('page', params.page.toString());
  if (params.limit) searchParams.append('limit', params.limit.toString());
  if (params.search) searchParams.append('search', params.search);
  if (params.sortBy) searchParams.append('sortBy', params.sortBy);
  if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder);
  if (params.jobId) searchParams.append('jobId', params.jobId);
  if (params.wardId) searchParams.append('wardId', params.wardId);
  if (params.skillId) searchParams.append('skillId', params.skillId);
  if (params.active !== undefined) searchParams.append('active', params.active.toString());
  
  const response = await api.get(`/staff?${searchParams.toString()}`);
  return response.data;
};

const fetchStaffById = async (id: string): Promise<Staff> => {
  const response = await api.get(`/staff/${id}`);
  return response.data.data || response.data;
};

const createStaff = async (data: CreateStaffData): Promise<Staff> => {
  const response = await api.post('/staff', data);
  return response.data.data || response.data;
};

const updateStaff = async (data: UpdateStaffData): Promise<Staff> => {
  const { id, ...updateData } = data;
  const response = await api.put(`/staff/${id}`, updateData);
  return response.data.data || response.data;
};

const deleteStaff = async (id: string): Promise<void> => {
  await api.delete(`/staff/${id}`);
};

// Hooks
export const useStaffList = (params: StaffListParams = {}) => {
  return useQuery({
    queryKey: staffKeys.list(params),
    queryFn: () => fetchStaffList(params),
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useStaffById = (id: string | undefined) => {
  return useQuery({
    queryKey: staffKeys.detail(id!),
    queryFn: () => fetchStaffById(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useCreateStaff = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createStaff,
    onSuccess: () => {
      // Invalidate and refetch staff lists
      queryClient.invalidateQueries({ queryKey: staffKeys.lists() });
    },
    onError: (error: Error) => {
      console.error('Failed to create staff:', error.message);
    },
  });
};

export const useUpdateStaff = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateStaff,
    onSuccess: (updatedStaff) => {
      // Update the specific staff detail in cache
      queryClient.setQueryData(staffKeys.detail(updatedStaff.id), updatedStaff);
      // Invalidate and refetch staff lists
      queryClient.invalidateQueries({ queryKey: staffKeys.lists() });
    },
    onError: (error: Error) => {
      console.error('Failed to update staff:', error.message);
    },
  });
};

export const useDeleteStaff = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteStaff,
    onSuccess: (_, deletedId) => {
      // Remove the specific staff detail from cache
      queryClient.removeQueries({ queryKey: staffKeys.detail(deletedId) });
      // Invalidate and refetch staff lists
      queryClient.invalidateQueries({ queryKey: staffKeys.lists() });
    },
    onError: (error: Error) => {
      console.error('Failed to delete staff:', error.message);
    },
  });
};

// Utility hooks
export const useStaffStats = () => {
  const { data: staffList } = useStaffList({ limit: 1000 }); // Get all staff for stats
  
  if (!staffList?.data) {
    return {
      total: 0,
      active: 0,
      averageSkills: 0,
    };
  }
  
  const total = staffList.data.length;
  const active = staffList.data.filter(staff => staff.active).length;
  const totalSkills = staffList.data.reduce((sum, staff) => sum + (staff.skills?.length || 0), 0);
  const averageSkills = total > 0 ? Math.round((totalSkills / total) * 10) / 10 : 0;
  
  return {
    total,
    active,
    averageSkills,
  };
};
