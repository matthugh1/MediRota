import { useQuery } from '@tanstack/react-query';
import { api } from '../api';

// Types
export interface Job {
  id: string;
  code: string;
  name: string;
}

export interface Skill {
  id: string;
  code: string;
  name: string;
}

export interface Ward {
  id: string;
  code: string;
  name: string;
  hourlyGranularity?: boolean;
}

// Query keys
export const refDataKeys = {
  all: ['refdata'] as const,
  jobs: () => [...refDataKeys.all, 'jobs'] as const,
  skills: () => [...refDataKeys.all, 'skills'] as const,
  wards: () => [...refDataKeys.all, 'wards'] as const,
};

// API functions
const fetchJobs = async (): Promise<Job[]> => {
  const response = await api.get('/jobs');
  return response.data.data || response.data;
};

const fetchSkills = async (): Promise<Skill[]> => {
  const response = await api.get('/skills');
  return response.data.data || response.data;
};

const fetchWards = async (): Promise<Ward[]> => {
  const response = await api.get('/wards');
  return response.data.data || response.data;
};

// Hooks
export const useJobs = () => {
  return useQuery({
    queryKey: refDataKeys.jobs(),
    queryFn: fetchJobs,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useSkills = () => {
  return useQuery({
    queryKey: refDataKeys.skills(),
    queryFn: fetchSkills,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useWards = () => {
  return useQuery({
    queryKey: refDataKeys.wards(),
    queryFn: fetchWards,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Utility functions
export const useJobById = (jobId: string | undefined) => {
  const { data: jobs } = useJobs();
  return jobs?.find(job => job.id === jobId);
};

export const useSkillById = (skillId: string | undefined) => {
  const { data: skills } = useSkills();
  return skills?.find(skill => skill.id === skillId);
};

export const useWardById = (wardId: string | undefined) => {
  const { data: wards } = useWards();
  return wards?.find(ward => ward.id === wardId);
};
