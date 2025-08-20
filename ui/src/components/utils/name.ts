export function displayName(s: { prefix?: string | null; firstName?: string; lastName?: string }) {
	return [s.prefix?.trim(), s.firstName?.trim(), s.lastName?.trim()].filter(Boolean).join(' ');
}
