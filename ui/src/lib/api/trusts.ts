import api from '../api.js';

export type Trust = {
	id: string;
	name: string;
	createdAt: string;
};

export const trustsApi = {
	list: async () => {
		const response = await api.get('/trusts');
		return response.data;
	},
	
	create: async (data: { name: string }) => {
		const response = await api.post('/trusts', data);
		return response.data;
	},
	
	update: async (id: string, data: Partial<{ name: string }>) => {
		const response = await api.patch(`/trusts/${id}`, data);
		return response.data;
	},
	
	remove: async (id: string) => {
		await api.delete(`/trusts/${id}`);
	},
};
