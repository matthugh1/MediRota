import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Listbox } from '@headlessui/react';
import { Check, ChevronDown } from 'lucide-react';
import { Staff, CreateStaffData } from '../../../lib/hooks/staff';
import { Job, Skill, Ward } from '../../../lib/hooks/refdata';
import MultiSelect, { MultiSelectOption } from '../../../components/forms/MultiSelect';

// Validation schema
const staffFormSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').max(100, 'Full name must be less than 100 characters'),
  role: z.enum(['doctor', 'nurse']).refine((val) => val !== undefined, { message: 'Role is required' }),
  jobId: z.string().min(1, 'Job is required'),
  gradeBand: z.string().optional(),
  contractHoursPerWeek: z.number().min(0.5, 'Contract hours must be at least 0.5').max(168, 'Contract hours must be less than 168'),
  active: z.boolean(),
  wardIds: z.array(z.string()),
  skillIds: z.array(z.string()),
});

type StaffFormData = z.infer<typeof staffFormSchema>;

interface StaffFormProps {
  staff?: Staff;
  jobs: Job[];
  skills: Skill[];
  wards: Ward[];
  onSubmit: (data: CreateStaffData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  serverErrors?: Record<string, string>;
}

const StaffForm: React.FC<StaffFormProps> = ({
  staff,
  jobs,
  skills,
  wards,
  onSubmit,
  onCancel,
  isLoading = false,
  serverErrors = {},
}) => {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<StaffFormData>({
    resolver: zodResolver(staffFormSchema),
    defaultValues: {
      fullName: staff?.fullName || '',
      role: (staff?.role as 'doctor' | 'nurse') || 'nurse',
      jobId: staff?.jobId || '',
      gradeBand: staff?.gradeBand || '',
      contractHoursPerWeek: staff?.contractHoursPerWeek || 37.5,
      active: staff?.active ?? true,
      wardIds: staff?.wards.map(w => w.id) || [],
      skillIds: staff?.skills.map(s => s.id) || [],
    } as StaffFormData,
  });

  const watchedRole = watch('role');

  // Filter jobs based on role
  const filteredJobs = jobs.filter(job => {
    if (watchedRole === 'doctor') {
      return job.code === 'doctor';
    } else if (watchedRole === 'nurse') {
      return job.code === 'nurse';
    }
    return true;
  });

  // Convert to MultiSelect options
  const skillOptions: MultiSelectOption[] = skills.map(skill => ({
    id: skill.id,
    label: skill.name,
  }));

  const wardOptions: MultiSelectOption[] = wards.map(ward => ({
    id: ward.id,
    label: ward.name,
  }));

  const handleFormSubmit = (data: StaffFormData) => {
    onSubmit({
      fullName: data.fullName,
      role: data.role,
      jobId: data.jobId,
      gradeBand: data.gradeBand,
      contractHoursPerWeek: data.contractHoursPerWeek,
      active: data.active,
      wardIds: data.wardIds,
      skillIds: data.skillIds,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6" data-testid="staff-form">
      {/* Full Name */}
      <div>
        <label htmlFor="fullName" className="block text-sm font-medium text-neutral-700 mb-1">
          Full Name *
        </label>
        <Controller
          name="fullName"
          control={control}
          render={({ field }) => (
            <input
              {...field}
              type="text"
              id="fullName"
              className={`input ${errors.fullName || serverErrors.fullName ? 'border-error-300' : ''}`}
              placeholder="Enter full name"
            />
          )}
        />
        {(errors.fullName || serverErrors.fullName) && (
          <p className="mt-1 text-sm text-error-600">
            {errors.fullName?.message || serverErrors.fullName}
          </p>
        )}
      </div>

      {/* Role */}
      <div>
        <label htmlFor="role" className="block text-sm font-medium text-neutral-700 mb-1">
          Role *
        </label>
        <Controller
          name="role"
          control={control}
          render={({ field }) => (
            <Listbox value={field.value} onChange={field.onChange}>
              <div className="relative">
                <Listbox.Button className="input text-left">
                  <span className="block truncate capitalize">
                    {field.value || 'Select role'}
                  </span>
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    <ChevronDown className="h-4 w-4 text-neutral-400" aria-hidden="true" />
                  </span>
                </Listbox.Button>
                <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                  {['doctor', 'nurse'].map((role) => (
                    <Listbox.Option
                      key={role}
                      className={({ active }) =>
                        `relative cursor-default select-none py-2 pl-3 pr-9 ${
                          active ? 'bg-primary-600 text-white' : 'text-neutral-900'
                        }`
                      }
                      value={role}
                    >
                      {({ selected, active }) => (
                        <>
                          <span className={`block truncate capitalize ${selected ? 'font-medium' : 'font-normal'}`}>
                            {role}
                          </span>
                          {selected ? (
                            <span
                              className={`absolute inset-y-0 right-0 flex items-center pr-4 ${
                                active ? 'text-white' : 'text-primary-600'
                              }`}
                            >
                              <Check className="h-4 w-4" aria-hidden="true" />
                            </span>
                          ) : null}
                        </>
                      )}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </div>
            </Listbox>
          )}
        />
        {(errors.role || serverErrors.role) && (
          <p className="mt-1 text-sm text-error-600">
            {errors.role?.message || serverErrors.role}
          </p>
        )}
      </div>

      {/* Job */}
      <div>
        <label htmlFor="jobId" className="block text-sm font-medium text-neutral-700 mb-1">
          Job *
        </label>
        <Controller
          name="jobId"
          control={control}
          render={({ field }) => (
            <Listbox value={field.value} onChange={field.onChange}>
              <div className="relative">
                <Listbox.Button className="input text-left">
                  <span className="block truncate">
                    {filteredJobs.find(job => job.id === field.value)?.name || 'Select job'}
                  </span>
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    <ChevronDown className="h-4 w-4 text-neutral-400" aria-hidden="true" />
                  </span>
                </Listbox.Button>
                <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                  {filteredJobs.map((job) => (
                    <Listbox.Option
                      key={job.id}
                      className={({ active }) =>
                        `relative cursor-default select-none py-2 pl-3 pr-9 ${
                          active ? 'bg-primary-600 text-white' : 'text-neutral-900'
                        }`
                      }
                      value={job.id}
                    >
                      {({ selected, active }) => (
                        <>
                          <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                            {job.name}
                          </span>
                          {selected ? (
                            <span
                              className={`absolute inset-y-0 right-0 flex items-center pr-4 ${
                                active ? 'text-white' : 'text-primary-600'
                              }`}
                            >
                              <Check className="h-4 w-4" aria-hidden="true" />
                            </span>
                          ) : null}
                        </>
                      )}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </div>
            </Listbox>
          )}
        />
        {(errors.jobId || serverErrors.jobId) && (
          <p className="mt-1 text-sm text-error-600">
            {errors.jobId?.message || serverErrors.jobId}
          </p>
        )}
      </div>

      {/* Grade Band */}
      <div>
        <label htmlFor="gradeBand" className="block text-sm font-medium text-neutral-700 mb-1">
          Grade Band
        </label>
        <Controller
          name="gradeBand"
          control={control}
          render={({ field }) => (
            <input
              {...field}
              type="text"
              id="gradeBand"
              className="input"
              placeholder="e.g., Consultant, Registrar, SHO"
            />
          )}
        />
        {(errors.gradeBand || serverErrors.gradeBand) && (
          <p className="mt-1 text-sm text-error-600">
            {errors.gradeBand?.message || serverErrors.gradeBand}
          </p>
        )}
      </div>

      {/* Contract Hours */}
      <div>
        <label htmlFor="contractHoursPerWeek" className="block text-sm font-medium text-neutral-700 mb-1">
          Contract Hours per Week *
        </label>
        <Controller
          name="contractHoursPerWeek"
          control={control}
          render={({ field }) => (
            <input
              {...field}
              type="number"
              step="0.5"
              min="0.5"
              max="168"
              id="contractHoursPerWeek"
              className={`input ${errors.contractHoursPerWeek || serverErrors.contractHoursPerWeek ? 'border-error-300' : ''}`}
              placeholder="37.5"
            />
          )}
        />
        {(errors.contractHoursPerWeek || serverErrors.contractHoursPerWeek) && (
          <p className="mt-1 text-sm text-error-600">
            {errors.contractHoursPerWeek?.message || serverErrors.contractHoursPerWeek}
          </p>
        )}
      </div>

      {/* Active Status */}
      <div>
        <Controller
          name="active"
          control={control}
          render={({ field }) => (
            <label className="flex items-center">
              <input
                {...field}
                type="checkbox"
                checked={field.value}
                className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                value=""
              />
              <span className="ml-2 text-sm text-neutral-700">Active staff member</span>
            </label>
          )}
        />
        {(errors.active || serverErrors.active) && (
          <p className="mt-1 text-sm text-error-600">
            {errors.active?.message || serverErrors.active}
          </p>
        )}
      </div>

      {/* Wards */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          Wards
        </label>
        <Controller
          name="wardIds"
          control={control}
          render={({ field }) => (
            <MultiSelect
              options={wardOptions}
              value={field.value}
              onChange={field.onChange}
              placeholder="Select wards..."
              searchPlaceholder="Search wards..."
              error={serverErrors.wardIds}
            />
          )}
        />
        {(errors.wardIds || serverErrors.wardIds) && (
          <p className="mt-1 text-sm text-error-600">
            {errors.wardIds?.message || serverErrors.wardIds}
          </p>
        )}
      </div>

      {/* Skills */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          Skills
        </label>
        <Controller
          name="skillIds"
          control={control}
          render={({ field }) => (
            <MultiSelect
              options={skillOptions}
              value={field.value}
              onChange={field.onChange}
              placeholder="Select skills..."
              searchPlaceholder="Search skills..."
              error={serverErrors.skillIds}
            />
          )}
        />
        {(errors.skillIds || serverErrors.skillIds) && (
          <p className="mt-1 text-sm text-error-600">
            {errors.skillIds?.message || serverErrors.skillIds}
          </p>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end space-x-3 pt-4 border-t border-neutral-200">
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary"
          disabled={isSubmitting || isLoading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn-primary"
          disabled={isSubmitting || isLoading}
          data-testid="staff-save"
        >
          {isSubmitting || isLoading ? 'Saving...' : staff ? 'Update Staff' : 'Create Staff'}
        </button>
      </div>
    </form>
  );
};

export default StaffForm;
