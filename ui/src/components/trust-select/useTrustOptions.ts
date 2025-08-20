import { useQuery } from '@tanstack/react-query';
import { trustsApi } from '../../lib/api/trusts.js';

export function useTrustOptions() {
	const { data: trusts = [], isLoading, error } = useQuery({
		queryKey: ['trusts'],
		queryFn: async () => {
			const response = await trustsApi.list();
			return response.data || [];
		},
	});

	// Sort trusts alphabetically by name
	const sortedTrusts = trusts.sort((a, b) => a.name.localeCompare(b.name));

	return {
		trusts: sortedTrusts,
		isLoading,
		error: error ? 'Failed to load trusts' : null,
	};
}
