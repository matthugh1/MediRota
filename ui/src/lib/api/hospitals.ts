import api from '../api.js';

export type Hospital = {
	id: string;
	name: string;
	trustId?: string;
	trust?: { id: string; name: string } | null;
	createdAt: string;
};

export const hospitalsApi = {
	list: async (params?: { trustId?: string }) => {
		const response = await api.get('/hospitals', { params });
		console.log('Raw hospitals response:', response.data);
		// The backend returns an array directly
		return response.data;
	},
	
	create: async (data: { name: string; trustId?: string }) => {
		const response = await api.post('/hospitals', data);
		return response.data;
	},
	
	update: async (id: string, data: Partial<{ name: string; trustId?: string }>) => {
		const response = await api.patch(`/hospitals/${id}`, data);
		return response.data;
	},
	
	remove: async (id: string) => {
		await api.delete(`/hospitals/${id}`);
	},
};
