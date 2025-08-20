import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Listbox } from '@headlessui/react';
import { Check, ChevronDown } from 'lucide-react';
import { Staff, CreateStaffData } from '../../../lib/hooks/staff';
import { Job, Skill, Ward } from '../../../lib/hooks/refdata';
import MultiSelect, { MultiSelectOption } from '../../../components/forms/MultiSelect';
import { JobRoleSelect } from '../../../components/jobrole-select/JobRoleSelect';

// Validation schema
const staffFormSchema = z.object({
  prefix: z.string().optional(),
  firstName: z.string().min(1, 'First name is required').max(50, 'First name must be less than 50 characters'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name must be less than 50 characters'),
  jobId: z.string().min(1, 'Job is required'),
  jobRoleId: z.string().optional(),
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
      prefix: staff?.prefix || '',
      firstName: staff?.firstName || '',
      lastName: staff?.lastName || '',
      jobId: staff?.jobId || '',
      jobRoleId: staff?.jobRole?.id || '',
      gradeBand: staff?.gradeBand || '',
      contractHoursPerWeek: staff?.contractHoursPerWeek || 37.5,
      active: staff?.active ?? true,
      wardIds: staff?.wards.map(w => w.id) || [],
      skillIds: staff?.skills.map(s => s.id) || [],
    } as StaffFormData,
  });

  // Use all jobs since we're not filtering by role anymore
  const filteredJobs = jobs;

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
      prefix: data.prefix,
      firstName: data.firstName,
      lastName: data.lastName,
      jobId: data.jobId,
      jobRoleId: data.jobRoleId,
      gradeBand: data.gradeBand,
      contractHoursPerWeek: data.contractHoursPerWeek,
      active: data.active,
      wardIds: data.wardIds,
      skillIds: data.skillIds,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6" data-testid="staff-form">
      {/* Name Fields */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Prefix */}
        <div>
          <label htmlFor="prefix" className="block text-sm font-medium text-neutral-700 mb-1">
            Prefix
          </label>
          <Controller
            name="prefix"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                type="text"
                id="prefix"
                className={`input ${errors.prefix || serverErrors.prefix ? 'border-error-300' : ''}`}
                placeholder="Dr, Mr, Ms, Prof..."
              />
            )}
          />
          {(errors.prefix || serverErrors.prefix) && (
            <p className="mt-1 text-sm text-error-600">
              {errors.prefix?.message || serverErrors.prefix}
            </p>
          )}
        </div>

        {/* First Name */}
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-neutral-700 mb-1">
            First Name *
          </label>
          <Controller
            name="firstName"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                type="text"
                id="firstName"
                className={`input ${errors.firstName || serverErrors.firstName ? 'border-error-300' : ''}`}
                placeholder="Enter first name"
              />
            )}
          />
          {(errors.firstName || serverErrors.firstName) && (
            <p className="mt-1 text-sm text-error-600">
              {errors.firstName?.message || serverErrors.firstName}
            </p>
          )}
        </div>

        {/* Last Name */}
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-neutral-700 mb-1">
            Last Name *
          </label>
          <Controller
            name="lastName"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                type="text"
                id="lastName"
                className={`input ${errors.lastName || serverErrors.lastName ? 'border-error-300' : ''}`}
                placeholder="Enter last name"
              />
            )}
          />
          {(errors.lastName || serverErrors.lastName) && (
            <p className="mt-1 text-sm text-error-600">
              {errors.lastName?.message || serverErrors.lastName}
            </p>
          )}
        </div>
      </div>

      {/* Job Role */}
      <div>
        <label htmlFor="jobRoleId" className="block text-sm font-medium text-neutral-700 mb-1">
          Job Role
        </label>
        <Controller
          name="jobRoleId"
          control={control}
          render={({ field }) => (
            <JobRoleSelect
              value={field.value}
              onChange={field.onChange}
              data-testid="staff-jobrole-select"
            />
          )}
        />
        {(errors.jobRoleId || serverErrors.jobRoleId) && (
          <p className="mt-1 text-sm text-error-600">
            {errors.jobRoleId?.message || serverErrors.jobRoleId}
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
