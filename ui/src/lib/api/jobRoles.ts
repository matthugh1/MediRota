import api from '../api.js';

export type JobRole = { 
  id: string; 
  code: string; 
  name: string; 
  createdAt: string; 
};

export const jobRolesApi = {
  list: async (params?: { search?: string; take?: number; skip?: number; orderBy?: string }) => {
    const response = await api.get('/job-roles', { params });
    return response.data;
  },
  
  create: async (data: { code: string; name: string }) => {
    const response = await api.post('/job-roles', data);
    return response.data;
  },
  
  update: async (id: string, data: Partial<{ code: string; name: string }>) => {
    const response = await api.patch(`/job-roles/${id}`, data);
    return response.data;
  },
  
  remove: async (id: string) => {
    await api.delete(`/job-roles/${id}`);
  },
};
