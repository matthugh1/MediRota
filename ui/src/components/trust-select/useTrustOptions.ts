import { useQuery } from '@tanstack/react-query';
import { trustsApi } from '../../lib/api/trusts.js';

export function useTrustOptions() {
	const { data: trusts = [], isLoading, error } = useQuery({
		queryKey: ['trusts'],
		queryFn: async () => {
			console.log('Fetching trusts...');
			const response = await trustsApi.list();
			console.log('Trusts response:', response);
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
