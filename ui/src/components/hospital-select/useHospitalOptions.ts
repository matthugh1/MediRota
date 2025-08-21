import { useQuery } from '@tanstack/react-query';
import { hospitalsApi } from '../../lib/api/hospitals.js';

export function useHospitalOptions(trustId?: string) {
	const { data: hospitals = [], isLoading, error } = useQuery({
		queryKey: ['hospitals', { trustId }],
		queryFn: async () => {
			console.log('Fetching hospitals...', { trustId });
			const params = trustId ? { trustId } : {};
			const response = await hospitalsApi.list(params);
			console.log('Hospitals response:', response);
			return response || [];
		},
		enabled: !trustId || !!trustId, // Always enabled, but filter by trustId if provided
	});

	// Sort hospitals alphabetically by name
	const sortedHospitals = hospitals.sort((a, b) => a.name.localeCompare(b.name));

	return {
		hospitals: sortedHospitals,
		isLoading,
		error: error ? 'Failed to load hospitals' : null,
	};
}
