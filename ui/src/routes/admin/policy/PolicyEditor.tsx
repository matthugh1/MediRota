import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Save, 
  Play, 
  Settings, 
  Target, 
  Shield, 
  Clock, 
  ToggleLeft,
  Plus,
  X,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { policyApi } from '../../../lib/api/policy';
import { queryKeys, invalidateQueries } from '../../../lib/query';
import { useWards } from '../../../lib/hooks';
import { useSchedules } from '../../../lib/hooks';

// Zod schema for policy validation
const policySchema = z.object({
  scope: z.enum(['ORG', 'WARD', 'SCHEDULE']),
  wardId: z.string().optional(),
  scheduleId: z.string().optional(),
  label: z.string().min(1, 'Label is required'),
  isActive: z.boolean(),
  weights: z.object({
    unmet: z.number().min(0),
    overtime: z.number().min(0),
    fairness: z.number().min(0),
    prefs: z.number().min(0),
    substitutes: z.number().min(0),
    flex: z.number().min(0),
  }),
  limits: z.object({
    maxOvertimePerWeekMinutes: z.number().min(0).max(960),
    maxFlexShiftsPerWeek: z.number().min(0).max(7),
  }),
  toggles: z.object({
    enableWardFlex: z.boolean(),
    enableSubstitution: z.boolean(),
  }),
  substitution: z.record(z.string(), z.array(z.string())),
  timeBudgetMs: z.number().min(10000).max(300000),
});

type PolicyFormData = z.infer<typeof policySchema>;

interface PolicyEditorProps {
  policyId?: string;
}

const PolicyEditor: React.FC<PolicyEditorProps> = ({ policyId }) => {
  const [activeTab, setActiveTab] = useState('presets');
  const [showAssignmentSection, setShowAssignmentSection] = useState(false);
  
  // Fetch data for assignments
  const { data: wardsData } = useWards();
  const { data: schedulesData } = useSchedules();
  const [testResults, setTestResults] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);
  const queryClient = useQueryClient();

  const isEditing = !!policyId;

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PolicyFormData>({
    resolver: zodResolver(policySchema),
    defaultValues: {
      scope: 'ORG',
      label: '',
      isActive: true,
      weights: {
        unmet: 1000000,
        overtime: 10000,
        fairness: 100,
        prefs: 1,
        substitutes: 50000,
        flex: 5000,
      },
      limits: {
        maxOvertimePerWeekMinutes: 480,
        maxFlexShiftsPerWeek: 1,
      },
      toggles: {
        enableWardFlex: true,
        enableSubstitution: true,
      },
      substitution: {
        MRI: ['MRI', 'DoctorMRI'],
        XRay: ['XRay', 'DoctorXRay'],
        Bloods: ['Bloods', 'GeneralCare'],
      },
      timeBudgetMs: 60000,
    },
  });

  const watchedScope = watch('scope');

  // Preset configurations
  const presets = {
    conservative: {
      weights: { unmet: 1000000, overtime: 5000, fairness: 200, prefs: 1, substitutes: 25000, flex: 2500 },
      limits: { maxOvertimePerWeekMinutes: 240, maxFlexShiftsPerWeek: 1 },
      toggles: { enableWardFlex: false, enableSubstitution: false },
      timeBudgetMs: 120000,
    },
    balanced: {
      weights: { unmet: 1000000, overtime: 10000, fairness: 100, prefs: 1, substitutes: 50000, flex: 5000 },
      limits: { maxOvertimePerWeekMinutes: 480, maxFlexShiftsPerWeek: 1 },
      toggles: { enableWardFlex: true, enableSubstitution: true },
      timeBudgetMs: 60000,
    },
    aggressive: {
      weights: { unmet: 1000000, overtime: 20000, fairness: 50, prefs: 1, substitutes: 100000, flex: 10000 },
      limits: { maxOvertimePerWeekMinutes: 720, maxFlexShiftsPerWeek: 2 },
      toggles: { enableWardFlex: true, enableSubstitution: true },
      timeBudgetMs: 30000,
    },
  };

  const applyPreset = (presetName: keyof typeof presets) => {
    const preset = presets[presetName];
    setValue('weights', preset.weights);
    setValue('limits', preset.limits);
    setValue('toggles', preset.toggles);
    setValue('timeBudgetMs', preset.timeBudgetMs);
  };

  const createPolicyMutation = useMutation({
    mutationFn: async (data: PolicyFormData) => {
      const policy = await policyApi.createPolicy(data);
      
      // If assignment section is open and has selections, create assignments
      if (showAssignmentSection) {
        const selectedWards = Array.from(document.querySelectorAll('input[type="checkbox"][data-ward-id]:checked'))
          .map(el => (el as HTMLInputElement).dataset.wardId!)
          .filter(Boolean);
        
        const selectedSchedules = Array.from(document.querySelectorAll('input[type="checkbox"][data-schedule-id]:checked'))
          .map(el => (el as HTMLInputElement).dataset.scheduleId!)
          .filter(Boolean);
        
        if (selectedWards.length > 0 || selectedSchedules.length > 0) {
          await policyApi.createAssignments({
            policyId: policy.id,
            wardIds: selectedWards.length > 0 ? selectedWards : undefined,
            scheduleIds: selectedSchedules.length > 0 ? selectedSchedules : undefined,
          });
        }
      }
      
      return policy;
    },
    onSuccess: () => {
      invalidateQueries.policies();
      // Navigate back to list
      window.location.href = '/planner/config/policy';
    },
  });

  const updatePolicyMutation = useMutation({
    mutationFn: (data: PolicyFormData) => policyApi.updatePolicy(policyId!, data),
    onSuccess: () => {
      invalidateQueries.policies();
      // Navigate back to list
      window.location.href = '/planner/config/policy';
    },
  });

  const testPolicyMutation = useMutation({
    mutationFn: async (data: PolicyFormData) => {
      setIsTesting(true);
      try {
        // This would call a test endpoint that runs a small solver test
        const response = await fetch('/api/solve/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ policy: data }),
        });
        return response.json();
      } finally {
        setIsTesting(false);
      }
    },
    onSuccess: (data) => {
      setTestResults(data);
    },
  });

  const onSubmit = (data: PolicyFormData) => {
    if (isEditing) {
      updatePolicyMutation.mutate(data);
    } else {
      createPolicyMutation.mutate(data);
    }
  };

  const onTest = (data: PolicyFormData) => {
    testPolicyMutation.mutate(data);
  };

  const tabs = [
    { id: 'presets', label: 'Presets', icon: Target },
    { id: 'weights', label: 'Weights', icon: Settings },
    { id: 'limits', label: 'Limits', icon: Shield },
    { id: 'toggles', label: 'Toggles', icon: ToggleLeft },
    { id: 'substitution', label: 'Substitution', icon: Settings },
    { id: 'scope', label: 'Scope', icon: Shield },
    { id: 'time', label: 'Time Budget', icon: Clock },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            {isEditing ? 'Edit Policy' : 'Create New Policy'}
          </h1>
          <p className="text-neutral-600 mt-1">
            Configure solver behavior and constraints
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit(onTest)}
            disabled={isTesting}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus-ring transition-colors duration-200 disabled:opacity-50"
          >
            {isTesting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Play className="w-4 h-4" />
            )}
            <span>{isTesting ? 'Testing...' : 'Test Policy'}</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus-ring transition-colors duration-200 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSubmitting ? 'Saving...' : 'Save Policy'}</span>
          </motion.button>
        </div>
      </div>

      {/* Test Results */}
      {testResults && (
        <div className="bg-white rounded-lg border border-neutral-200 p-4">
          <div className="flex items-center space-x-2 mb-3">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <h3 className="font-medium text-neutral-900">Test Results</h3>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-neutral-600">Coverage:</span>
              <span className="ml-2 font-medium">{testResults.coverage}%</span>
            </div>
            <div>
              <span className="text-neutral-600">Solve Time:</span>
              <span className="ml-2 font-medium">{testResults.solveTime}ms</span>
            </div>
            <div>
              <span className="text-neutral-600">Status:</span>
              <span className="ml-2 font-medium">{testResults.status}</span>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <div className="bg-white rounded-lg border border-neutral-200">
        {/* Tabs */}
        <div className="border-b border-neutral-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Presets Tab */}
            {activeTab === 'presets' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-neutral-900 mb-2">Quick Presets</h3>
                  <p className="text-neutral-600 mb-4">
                    Choose a preset configuration to get started quickly
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(presets).map(([name, preset]) => (
                    <motion.button
                      key={name}
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => applyPreset(name as keyof typeof presets)}
                      className="p-4 border border-neutral-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors duration-200 text-left"
                    >
                      <h4 className="font-medium text-neutral-900 capitalize mb-2">{name}</h4>
                      <p className="text-sm text-neutral-600 mb-3">
                        {name === 'conservative' && 'Strict constraints, high quality solutions'}
                        {name === 'balanced' && 'Balanced approach for most scenarios'}
                        {name === 'aggressive' && 'Flexible constraints, faster solving'}
                      </p>
                      <div className="text-xs text-neutral-500 space-y-1">
                        <div>Overtime: {preset.weights.overtime}</div>
                        <div>Fairness: {preset.weights.fairness}</div>
                        <div>Time Budget: {preset.timeBudgetMs / 1000}s</div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Weights Tab */}
            {activeTab === 'weights' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-neutral-900 mb-2">Solver Weights</h3>
                  <p className="text-neutral-600 mb-4">
                    Configure the relative importance of different objectives
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(watch('weights')).map(([key, value]) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-neutral-700 mb-2 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </label>
                      <Controller
                        name={`weights.${key}` as any}
                        control={control}
                        render={({ field }) => (
                          <input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="Enter weight"
                          />
                        )}
                      />
                                             {errors.weights?.[key as keyof typeof errors.weights] && (
                         <p className="text-red-500 text-sm mt-1">
                           {String(errors.weights[key as keyof typeof errors.weights])}
                         </p>
                       )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Limits Tab */}
            {activeTab === 'limits' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-neutral-900 mb-2">Limits</h3>
                  <p className="text-neutral-600 mb-4">
                    Set maximum values for overtime and flexibility
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Max Overtime per Week (minutes)
                    </label>
                    <Controller
                      name="limits.maxOvertimePerWeekMinutes"
                      control={control}
                      render={({ field }) => (
                        <input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          min="0"
                          max="960"
                          className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      )}
                    />
                    {errors.limits?.maxOvertimePerWeekMinutes && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.limits.maxOvertimePerWeekMinutes.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Max Flex Shifts per Week
                    </label>
                    <Controller
                      name="limits.maxFlexShiftsPerWeek"
                      control={control}
                      render={({ field }) => (
                        <input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          min="0"
                          max="7"
                          className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      )}
                    />
                    {errors.limits?.maxFlexShiftsPerWeek && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.limits.maxFlexShiftsPerWeek.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Toggles Tab */}
            {activeTab === 'toggles' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-neutral-900 mb-2">Feature Toggles</h3>
                  <p className="text-neutral-600 mb-4">
                    Enable or disable specific solver features
                  </p>
                </div>
                <div className="space-y-4">
                  {Object.entries(watch('toggles')).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-neutral-700 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </label>
                        <p className="text-xs text-neutral-500 mt-1">
                          {key === 'enableWardFlex' && 'Allow staff to work across different wards'}
                          {key === 'enableSubstitution' && 'Allow skill substitution for coverage'}
                        </p>
                      </div>
                      <Controller
                        name={`toggles.${key}` as any}
                        control={control}
                        render={({ field }) => (
                          <button
                            type="button"
                            onClick={() => field.onChange(!field.value)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                              field.value ? 'bg-primary-600' : 'bg-neutral-200'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                                field.value ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        )}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Substitution Tab */}
            {activeTab === 'substitution' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-neutral-900 mb-2">Skill Substitution</h3>
                  <p className="text-neutral-600 mb-4">
                    Define which skills can substitute for others
                  </p>
                </div>
                <div className="space-y-4">
                  {Object.entries(watch('substitution')).map(([skill, substitutes]) => (
                    <div key={skill} className="border border-neutral-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-sm font-medium text-neutral-700">
                          {skill} can be substituted by:
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            const current = watch('substitution');
                            const updated = { ...current };
                            delete updated[skill];
                            setValue('substitution', updated);
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {substitutes.map((sub, index) => (
                          <span
                            key={sub}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                          >
                            {sub}
                            <button
                              type="button"
                              onClick={() => {
                                const current = watch('substitution');
                                const updated = {
                                  ...current,
                                  [skill]: current[skill].filter((_, i) => i !== index),
                                };
                                setValue('substitution', updated);
                              }}
                              className="ml-1 text-primary-600 hover:text-primary-800"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                        <button
                          type="button"
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border border-dashed border-neutral-300 text-neutral-600 hover:border-neutral-400 hover:text-neutral-700"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="inline-flex items-center space-x-2 px-3 py-2 border border-neutral-200 rounded-lg hover:border-neutral-300 hover:bg-neutral-50 transition-colors duration-200"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Skill</span>
                  </button>
                </div>
              </div>
            )}

            {/* Scope Tab */}
            {activeTab === 'scope' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-neutral-900 mb-2">Policy Scope</h3>
                  <p className="text-neutral-600 mb-4">
                    Define where this policy applies
                  </p>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Scope
                    </label>
                    <Controller
                      name="scope"
                      control={control}
                      render={({ field }) => (
                        <select
                          {...field}
                          className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="ORG">Organization-wide</option>
                          <option value="WARD">Ward-specific</option>
                          <option value="SCHEDULE">Schedule-specific</option>
                        </select>
                      )}
                    />
                    {errors.scope && (
                      <p className="text-red-500 text-sm mt-1">{errors.scope.message}</p>
                    )}
                  </div>

                  {watchedScope === 'WARD' && (
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Ward
                      </label>
                      <Controller
                        name="wardId"
                        control={control}
                        render={({ field }) => (
                          <select
                            {...field}
                            className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          >
                            <option value="">Select a ward</option>
                            {wardsData?.data?.map(ward => (
                              <option key={ward.id} value={ward.id}>{ward.name}</option>
                            ))}
                          </select>
                        )}
                      />
                    </div>
                  )}

                  {watchedScope === 'SCHEDULE' && (
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Schedule
                      </label>
                      <Controller
                        name="scheduleId"
                        control={control}
                        render={({ field }) => (
                          <select
                            {...field}
                            className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          >
                            <option value="">Select a schedule</option>
                            {schedulesData?.data?.map(schedule => (
                              <option key={schedule.id} value={schedule.id}>
                                {schedule.ward?.name} - {schedule.objective}
                              </option>
                            ))}
                          </select>
                        )}
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Policy Label
                    </label>
                    <Controller
                      name="label"
                      control={control}
                      render={({ field }) => (
                        <input
                          type="text"
                          {...field}
                          className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="Enter policy label"
                        />
                      )}
                    />
                    {errors.label && (
                      <p className="text-red-500 text-sm mt-1">{errors.label.message}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-neutral-700">
                        Active
                      </label>
                      <p className="text-xs text-neutral-500 mt-1">
                        Enable this policy for use
                      </p>
                    </div>
                    <Controller
                      name="isActive"
                      control={control}
                      render={({ field }) => (
                        <button
                          type="button"
                          onClick={() => field.onChange(!field.value)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                            field.value ? 'bg-primary-600' : 'bg-neutral-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                              field.value ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      )}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Time Budget Tab */}
            {activeTab === 'time' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-neutral-900 mb-2">Time Budget</h3>
                  <p className="text-neutral-600 mb-4">
                    Set the maximum time the solver can spend finding a solution
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Time Budget (milliseconds)
                  </label>
                  <Controller
                    name="timeBudgetMs"
                    control={control}
                    render={({ field }) => (
                      <input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        min="10000"
                        max="300000"
                        step="1000"
                        className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    )}
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    Range: 10,000 - 300,000 ms (10 seconds - 5 minutes)
                  </p>
                  {errors.timeBudgetMs && (
                    <p className="text-red-500 text-sm mt-1">{errors.timeBudgetMs.message}</p>
                  )}
                </div>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Policy Assignment Section */}
      {!policyId && (
        <div className="mt-8 bg-white rounded-lg border border-neutral-200">
          <div className="px-6 py-4 border-b border-neutral-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-neutral-900">Policy Assignment</h2>
              <button
                type="button"
                onClick={() => setShowAssignmentSection(!showAssignmentSection)}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                {showAssignmentSection ? 'Hide' : 'Show'} Assignment Options
              </button>
            </div>
            <p className="text-sm text-neutral-600 mt-1">
              Assign this policy to specific wards or schedules after creation
            </p>
          </div>

          {showAssignmentSection && (
            <div className="p-6 space-y-6">
              {/* Ward Assignment */}
              <div>
                <h3 className="text-md font-medium text-neutral-900 mb-3">Assign to Wards</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {wardsData?.data?.map(ward => (
                    <label key={ward.id} className="flex items-center space-x-3 p-3 border border-neutral-200 rounded-lg hover:bg-neutral-50 cursor-pointer">
                      <input
                        type="checkbox"
                        data-ward-id={ward.id}
                        className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                      />
                      <div>
                        <div className="text-sm font-medium text-neutral-900">{ward.name}</div>
                        <div className="text-xs text-neutral-500">{ward.id}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Schedule Assignment */}
              <div>
                <h3 className="text-md font-medium text-neutral-900 mb-3">Assign to Schedules</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {schedulesData?.data?.map(schedule => (
                    <label key={schedule.id} className="flex items-center space-x-3 p-3 border border-neutral-200 rounded-lg hover:bg-neutral-50 cursor-pointer">
                      <input
                        type="checkbox"
                        data-schedule-id={schedule.id}
                        className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                      />
                      <div>
                        <div className="text-sm font-medium text-neutral-900">
                          {schedule.ward?.name} - {schedule.objective}
                        </div>
                        <div className="text-xs text-neutral-500">{schedule.id}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-neutral-200">
                <p className="text-sm text-neutral-600">
                  Selected assignments will be created when you save this policy
                </p>
                <button
                  type="button"
                  className="text-sm text-neutral-600 hover:text-neutral-700"
                  onClick={() => setShowAssignmentSection(false)}
                >
                  Hide Assignment Options
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PolicyEditor;
