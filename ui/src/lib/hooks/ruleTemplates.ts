import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ruleTemplatesApi, RuleTemplate, CreateRuleTemplateData, UpdateRuleTemplateData } from '../api/ruleTemplates.js';

// Query keys
export const ruleTemplateKeys = {
	all: ['rule-templates'] as const,
	lists: () => [...ruleTemplateKeys.all, 'list'] as const,
	list: () => [...ruleTemplateKeys.lists()] as const,
	details: () => [...ruleTemplateKeys.all, 'detail'] as const,
	detail: (id: string) => [...ruleTemplateKeys.details(), id] as const,
	byCode: (code: string) => [...ruleTemplateKeys.details(), 'code', code] as const,
};

// Hooks
export const useRuleTemplates = () => {
	return useQuery({
		queryKey: ruleTemplateKeys.list(),
		queryFn: () => ruleTemplatesApi.getAll(),
		staleTime: 5 * 60 * 1000, // 5 minutes
		gcTime: 10 * 60 * 1000, // 10 minutes
	});
};

export const useRuleTemplateById = (id: string | undefined) => {
	return useQuery({
		queryKey: ruleTemplateKeys.detail(id!),
		queryFn: () => ruleTemplatesApi.getById(id!),
		enabled: !!id,
		staleTime: 5 * 60 * 1000, // 5 minutes
		gcTime: 10 * 60 * 1000, // 10 minutes
	});
};

export const useRuleTemplateByCode = (code: string | undefined) => {
	return useQuery({
		queryKey: ruleTemplateKeys.byCode(code!),
		queryFn: () => ruleTemplatesApi.getByCode(code!),
		enabled: !!code,
		staleTime: 5 * 60 * 1000, // 5 minutes
		gcTime: 10 * 60 * 1000, // 10 minutes
	});
};

export const useCreateRuleTemplate = () => {
	const queryClient = useQueryClient();
	
	return useMutation({
		mutationFn: (data: CreateRuleTemplateData) => ruleTemplatesApi.create(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ruleTemplateKeys.lists() });
		},
	});
};

export const useUpdateRuleTemplate = () => {
	const queryClient = useQueryClient();
	
	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: Partial<CreateRuleTemplateData> }) =>
			ruleTemplatesApi.update(id, data),
		onSuccess: (_, { id }) => {
			queryClient.invalidateQueries({ queryKey: ruleTemplateKeys.lists() });
			queryClient.invalidateQueries({ queryKey: ruleTemplateKeys.detail(id) });
		},
	});
};

export const useDeleteRuleTemplate = () => {
	const queryClient = useQueryClient();
	
	return useMutation({
		mutationFn: (id: string) => ruleTemplatesApi.delete(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ruleTemplateKeys.lists() });
		},
	});
};
