import axios from 'axios';

// Use environment variable for API URL, fallback to relative paths
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '';
console.log('Using API_BASE_URL:', API_BASE_URL || '(relative paths)');

export interface Policy {
  id: string;
  scope: 'ORG' | 'WARD' | 'SCHEDULE';
  orgId?: string;
  wardId?: string;
  scheduleId?: string;
  weights: {
    unmet: number;
    overtime: number;
    fairness: number;
    prefs: number;
    substitutes: number;
    flex: number;
  };
  limits: {
    maxOvertimePerWeekMinutes: number;
    maxFlexShiftsPerWeek: number;
  };
  toggles: {
    enableWardFlex: boolean;
    enableSubstitution: boolean;
  };
  substitution: Record<string, string[]>;
  timeBudgetMs: number;
  label: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePolicyData {
  scope: 'ORG' | 'WARD' | 'SCHEDULE';
  wardId?: string;
  scheduleId?: string;
  weights: {
    unmet: number;
    overtime: number;
    fairness: number;
    prefs: number;
    substitutes: number;
    flex: number;
  };
  limits: {
    maxOvertimePerWeekMinutes: number;
    maxFlexShiftsPerWeek: number;
  };
  toggles: {
    enableWardFlex: boolean;
    enableSubstitution: boolean;
  };
  substitution: Record<string, string[]>;
  timeBudgetMs: number;
  label: string;
  isActive: boolean;
}

export interface UpdatePolicyData extends Partial<CreatePolicyData> {}

export interface EffectivePolicyParams {
  wardId?: string;
  scheduleId?: string;
}

class PolicyApi {
  private api: any;

  constructor() {
    console.log('PolicyApi constructor - API_BASE_URL:', API_BASE_URL || '(relative paths)');
    this.api = axios.create({
      baseURL: API_BASE_URL ? `${API_BASE_URL}/api/policy` : '/api/policy',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    console.log('PolicyApi constructor - api instance created:', !!this.api);
  }

  // Get all policies
  getAllPolicies = async (): Promise<Policy[]> => {
    const requestUrl = API_BASE_URL ? `${API_BASE_URL}/api/policy` : '/api/policy';
    console.log('Making request to:', requestUrl);
    console.log('this.api exists:', !!this.api);
    try {
      const response = await this.api.get('/');
      console.log('Policy API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Policy API error:', error);
      throw error;
    }
  }

  // Get a single policy by ID
  getPolicy = async (id: string): Promise<Policy> => {
    const response = await this.api.get(`/${id}`);
    return response.data;
  }

  // Get effective policy for given scope
  getEffectivePolicy = async (params: EffectivePolicyParams): Promise<Policy> => {
    const queryParams = new URLSearchParams();
    if (params.wardId) queryParams.append('wardId', params.wardId);
    if (params.scheduleId) queryParams.append('scheduleId', params.scheduleId);
    
    const response = await this.api.get(`/effective?${queryParams.toString()}`);
    return response.data;
  }

  // Create a new policy
  createPolicy = async (data: CreatePolicyData): Promise<Policy> => {
    const response = await this.api.post('/', data);
    return response.data;
  }

  // Update an existing policy
  updatePolicy = async (id: string, data: UpdatePolicyData): Promise<Policy> => {
    const response = await this.api.patch(`/${id}`, data);
    return response.data;
  }

  // Delete (deactivate) a policy
  deletePolicy = async (id: string): Promise<void> => {
    await this.api.delete(`/${id}`);
  }

  // Test a policy with a small solver run
  testPolicy = async (data: CreatePolicyData): Promise<{
    coverage: number;
    solveTime: number;
    status: string;
    assignments: number;
    unmet: number;
  }> => {
    const response = await this.api.post('/test', { policy: data });
    return response.data;
  }
}

// Create the API instance with error handling
let policyApi: PolicyApi;
try {
  console.log('Creating PolicyApi instance...');
  policyApi = new PolicyApi();
  console.log('PolicyApi instance created successfully:', !!policyApi);
} catch (error) {
  console.error('Error creating PolicyApi instance:', error);
  // Fallback to a simple object
  policyApi = {
    getAllPolicies: async () => {
      console.log('Using fallback getAllPolicies');
      const response = await fetch('/api/policy');
      return response.json();
    },
    getPolicy: async (id: string) => {
      const response = await fetch(`/api/policy/${id}`);
      return response.json();
    },
    getEffectivePolicy: async (params: EffectivePolicyParams) => {
      const queryParams = new URLSearchParams();
      if (params.wardId) queryParams.append('wardId', params.wardId);
      if (params.scheduleId) queryParams.append('scheduleId', params.scheduleId);
      const response = await fetch(`/api/policy/effective?${queryParams.toString()}`);
      return response.json();
    },
    createPolicy: async (data: CreatePolicyData) => {
      const response = await fetch('/api/policy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    updatePolicy: async (id: string, data: UpdatePolicyData) => {
      const response = await fetch(`/api/policy/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    deletePolicy: async (id: string) => {
      await fetch(`/api/policy/${id}`, { method: 'DELETE' });
    },
    testPolicy: async (data: CreatePolicyData) => {
      const response = await fetch('/api/policy/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ policy: data }),
      });
      return response.json();
    },
  } as any;
}

export { policyApi };
