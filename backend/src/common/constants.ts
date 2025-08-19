// Scope level constants for organisational hierarchy
export const SCOPE_LEVELS = {
  TRUST: 'TRUST',
  HOSPITAL: 'HOSPITAL', 
  WARD: 'WARD',
  SCHEDULE: 'SCHEDULE',
} as const;

export type ScopeLevel = typeof SCOPE_LEVELS[keyof typeof SCOPE_LEVELS];

// Valid scope level values for validation
export const VALID_SCOPE_LEVELS = Object.values(SCOPE_LEVELS);
