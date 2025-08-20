import api from '../api.js';

export interface RuleTemplate {
	id: string;
	code: string;
	name: string;
	description: string;
	paramsSchema?: any;
	createdAt: string;
	updatedAt: string;
}

export interface CreateRuleTemplateData {
	code: string;
	name: string;
	description: string;
	paramsSchema?: any;
}

export interface UpdateRuleTemplateData extends Partial<CreateRuleTemplateData> {
	id: string;
}

export const ruleTemplatesApi = {
	// Get all rule templates
	getAll: async (): Promise<RuleTemplate[]> => {
		const response = await api.get('/rule-templates');
		return response.data;
	},

	// Get rule template by ID
	getById: async (id: string): Promise<RuleTemplate> => {
		const response = await api.get(`/rule-templates/${id}`);
		return response.data;
	},

	// Get rule template by code
	getByCode: async (code: string): Promise<RuleTemplate> => {
		const response = await api.get(`/rule-templates/code/${code}`);
		return response.data;
	},

	// Create new rule template
	create: async (data: CreateRuleTemplateData): Promise<RuleTemplate> => {
		const response = await api.post('/rule-templates', data);
		return response.data;
	},

	// Update rule template
	update: async (id: string, data: Partial<CreateRuleTemplateData>): Promise<RuleTemplate> => {
		const response = await api.patch(`/rule-templates/${id}`, data);
		return response.data;
	},

	// Delete rule template
	delete: async (id: string): Promise<void> => {
		await api.delete(`/rule-templates/${id}`);
	},
};
