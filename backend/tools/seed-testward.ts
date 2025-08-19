#!/usr/bin/env node

/**
 * TestWard Seed Script
 * 
 * This script creates a complete test environment via the NestJS API:
 * - Ward: TestWard (hourlyGranularity=false)
 * - Jobs: Nurse, Doctor, Radiographer
 * - Skills: MRI_scanning, Ventilator, Resus, Phlebotomy
 * - Shift Types: Early, Late, Night
 * - Staff: 8 mixed staff across jobs with different skills
 * - Rule Set: Active with standard constraints
 * - Demand: 4 weeks of Night shifts
 * - Schedule: 4-week horizon
 * - Solve: Run optimization and log metrics
 * 
 * Environment Variables:
 * - API_BASE: API base URL (default: http://localhost:3000)
 * - AUTH_TOKEN: JWT token for authentication (optional)
 * 
 * Usage:
 *   export API_BASE="http://localhost:3000"
 *   export AUTH_TOKEN="eyJhbGciOi..."  # optional
 *   pnpm seed:testward
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { DateTime } from 'luxon';
import { randomUUID } from 'crypto';

// Types
interface Ward {
  id: string;
  name: string;
  hourlyGranularity: boolean;
}

interface Job {
  id: string;
  code: string;
  name: string;
}

interface Skill {
  id: string;
  code: string;
  name: string;
}

interface ShiftType {
  id: string;
  code: string;
  name: string;
  startTime: string;
  endTime: string;
  isNight: boolean;
  durationMinutes: number;
}

interface Staff {
  id: string;
  fullName: string;
  role: string;
  jobId: string;
  gradeBand?: string;
  contractHoursPerWeek: number;
  active: boolean;
  wardIds: string[];
  skillIds: string[];
}

interface RuleSet {
  id: string;
  name: string;
  active: boolean;
  wardId: string;
  rules: Array<{
    id: string;
    key: string;
    value: string;
  }>;
}

interface Demand {
  id: string;
  wardId: string;
  date: string;
  slot: string;
  requiredBySkill: Record<string, number>;
  hourlyGranularity?: boolean;
}

interface Schedule {
  id: string;
  wardId: string;
  horizonStart: string;
  horizonEnd: string;
  objective?: string;
  metrics?: any;
}

interface SolveResponse {
  scheduleId: string;
  metrics: {
    hardViolations: number;
    solveMs: number;
    fairnessNightStd: number;
    preferenceSatisfaction: number;
  };
}

// Configuration
const API_BASE = process.env.API_BASE || 'http://localhost:3000';
const AUTH_TOKEN = process.env.AUTH_TOKEN;

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    ...(AUTH_TOKEN && { Authorization: `Bearer ${AUTH_TOKEN}` }),
  },
});

// Helper functions
const log = (message: string) => {
  console.log(`[${new Date().toISOString()}] ${message}`);
};

const logError = (message: string, error?: any) => {
  console.error(`[${new Date().toISOString()}] ERROR: ${message}`);
  if (error?.response?.data) {
    console.error('API Error:', JSON.stringify(error.response.data, null, 2));
  }
};

const safeCreate = async <T>(
  endpoint: string,
  data: any,
  entityName: string,
  findExisting?: () => Promise<T | null>
): Promise<T> => {
  try {
    log(`Creating ${entityName}...`);
    const response: AxiosResponse<T> = await api.post(endpoint, data);
    log(`✅ Created ${entityName}: ${response.data.id}`);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 409 || error.response?.status === 422 || error.response?.status === 500) {
      log(`⚠️  ${entityName} may already exist, fetching existing...`);
      if (findExisting) {
        const existing = await findExisting();
        if (existing) {
          log(`✅ Found existing ${entityName}: ${existing.id}`);
          return existing;
        }
      }
      // Try to find by name/code if no findExisting function
      try {
        const listResponse = await api.get(endpoint);
        const existing = listResponse.data.data?.find((item: any) => 
          item.name === data.name || item.code === data.code
        );
        if (existing) {
          log(`✅ Found existing ${entityName}: ${existing.id}`);
          return existing;
        }
      } catch (findError) {
        logError(`Failed to find existing ${entityName}`, findError);
      }
    }
    throw error;
  }
};

const findExisting = async <T>(endpoint: string, predicate: (item: T) => boolean): Promise<T | null> => {
  try {
    const response = await api.get(endpoint);
    return response.data.data?.find(predicate) || null;
  } catch (error) {
    return null;
  }
};

// Staff factory
const mkStaff = (
  fullName: string,
  jobCode: string,
  skillCodes: string[],
  contractHours: number = 37.5,
  gradeBand?: string
): Partial<Staff> & { skillCodes: string[] } => ({
  fullName,
  role: jobCode === 'nurse' ? 'nurse' : 'doctor', // Temporary role mapping
  gradeBand,
  contractHoursPerWeek: contractHours,
  active: true,
  wardIds: [], // Will be set after ward creation
  skillIds: [], // Will be set after skill creation
  skillCodes, // Store skill codes for later mapping
});

// Main seed function
async function seedTestWard() {
  log('🚀 Starting TestWard seed...');
  
  try {
    // 1. Create Ward
    log('\n📋 Step 1: Creating Ward');
    const ward = await safeCreate<Ward>(
      '/wards',
      {
        name: 'TestWard',
        hourlyGranularity: false,
      },
      'TestWard',
      () => findExisting<Ward>('/wards', w => w.name === 'TestWard')
    );

    // 2. Create Jobs
    log('\n💼 Step 2: Creating Jobs');
    const jobs = await Promise.all([
      safeCreate<Job>('/jobs', { code: 'nurse', name: 'Nurse' }, 'Nurse job', 
        () => findExisting<Job>('/jobs', j => j.code === 'nurse')),
      safeCreate<Job>('/jobs', { code: 'doctor', name: 'Doctor' }, 'Doctor job',
        () => findExisting<Job>('/jobs', j => j.code === 'doctor')),
      safeCreate<Job>('/jobs', { code: 'radiographer', name: 'Radiographer' }, 'Radiographer job',
        () => findExisting<Job>('/jobs', j => j.code === 'radiographer')),
    ]);

    const jobMap = new Map(jobs.map(job => [job.code, job]));

    // 3. Create Skills (Competencies)
    log('\n🎯 Step 3: Creating Skills');
    const skills = await Promise.all([
      safeCreate<Skill>('/skills', { code: 'mri_scanning', name: 'MRI Scanning' }, 'MRI Scanning skill'),
      safeCreate<Skill>('/skills', { code: 'ventilator', name: 'Ventilator Management' }, 'Ventilator skill'),
      safeCreate<Skill>('/skills', { code: 'resus', name: 'Resuscitation' }, 'Resus skill'),
      safeCreate<Skill>('/skills', { code: 'phlebotomy', name: 'Phlebotomy' }, 'Phlebotomy skill'),
      safeCreate<Skill>('/skills', { code: 'ecg', name: 'ECG Interpretation' }, 'ECG skill'),
      safeCreate<Skill>('/skills', { code: 'iv_access', name: 'IV Access' }, 'IV Access skill'),
    ]);

    const skillMap = new Map(skills.map(skill => [skill.code, skill]));

    // 4. Create Shift Types
    log('\n⏰ Step 4: Creating Shift Types');
    const shiftTypes = await Promise.all([
      safeCreate<ShiftType>('/shift-types', {
        code: 'early',
        name: 'Early',
        startTime: '07:30',
        endTime: '15:30',
        isNight: false,
        durationMinutes: 480,
      }, 'Early shift'),
      safeCreate<ShiftType>('/shift-types', {
        code: 'late',
        name: 'Late',
        startTime: '13:30',
        endTime: '21:30',
        isNight: false,
        durationMinutes: 480,
      }, 'Late shift'),
      safeCreate<ShiftType>('/shift-types', {
        code: 'night',
        name: 'Night',
        startTime: '20:00',
        endTime: '08:00',
        isNight: true,
        durationMinutes: 720,
      }, 'Night shift'),
    ]);

    const nightShift = shiftTypes.find(st => st.code === 'night')!;

    // 5. Create Staff (Enhanced - 20 staff members)
    log('\n👥 Step 5: Creating Staff');
    const staffData = [
      // Doctors (6)
      mkStaff('Dr. Sarah Johnson', 'doctor', ['resus', 'ventilator', 'ecg'], 40, 'Consultant'),
      mkStaff('Dr. Michael Chen', 'doctor', ['resus', 'ventilator'], 40, 'Registrar'),
      mkStaff('Dr. Emily Davis', 'doctor', ['ventilator', 'ecg'], 40, 'SHO'),
      mkStaff('Dr. James Wilson', 'doctor', ['resus', 'iv_access'], 40, 'SHO'),
      mkStaff('Dr. Lisa Rodriguez', 'doctor', ['ventilator', 'phlebotomy'], 40, 'Registrar'),
      mkStaff('Dr. David Thompson', 'doctor', ['resus', 'ecg'], 40, 'Consultant'),
      
      // Nurses (10)
      mkStaff('Nurse Alice Brown', 'nurse', ['resus', 'phlebotomy', 'iv_access'], 37.5, 'Band 6'),
      mkStaff('Nurse Robert Wilson', 'nurse', ['ventilator', 'phlebotomy'], 37.5, 'Band 5'),
      mkStaff('Nurse Lisa Garcia', 'nurse', ['resus', 'ecg'], 37.5, 'Band 6'),
      mkStaff('Nurse Tom Anderson', 'nurse', ['ventilator', 'iv_access'], 37.5, 'Band 5'),
      mkStaff('Nurse Emma Taylor', 'nurse', ['phlebotomy', 'ecg'], 37.5, 'Band 5'),
      mkStaff('Nurse Chris Martinez', 'nurse', ['resus', 'ventilator'], 37.5, 'Band 6'),
      mkStaff('Nurse Rachel Green', 'nurse', ['phlebotomy', 'iv_access'], 37.5, 'Band 5'),
      mkStaff('Nurse Kevin Lee', 'nurse', ['resus', 'ecg'], 37.5, 'Band 6'),
      mkStaff('Nurse Amanda White', 'nurse', ['ventilator', 'phlebotomy'], 37.5, 'Band 5'),
      mkStaff('Nurse Daniel Clark', 'nurse', ['resus', 'iv_access'], 37.5, 'Band 6'),
      
      // Radiographers (4)
      mkStaff('Radiographer Tom Miller', 'radiographer', ['mri_scanning'], 37.5, 'Band 6'),
      mkStaff('Radiographer Emma Taylor', 'radiographer', ['mri_scanning'], 37.5, 'Band 5'),
      mkStaff('Radiographer Sarah Kim', 'radiographer', ['mri_scanning'], 37.5, 'Band 6'),
      mkStaff('Radiographer Mike Johnson', 'radiographer', ['mri_scanning'], 37.5, 'Band 5'),
    ];

    const staff = await Promise.all(
      staffData.map(async (staffMember, index) => {
        const job = jobMap.get(staffMember.role === 'nurse' ? 'nurse' : 
                              staffMember.role === 'radiographer' ? 'radiographer' : 'doctor')!;
        const skillIds = staffMember.skillCodes.map(code => skillMap.get(code)?.id).filter(Boolean);
        
        return safeCreate<Staff>('/staff', {
          fullName: staffMember.fullName,
          role: staffMember.role,
          gradeBand: staffMember.gradeBand,
          contractHoursPerWeek: staffMember.contractHoursPerWeek,
          active: staffMember.active,
          jobId: job.id,
          wardIds: [ward.id],
          skillIds,
        }, `Staff member ${index + 1}`);
      })
    );

    // 6. Create Rule Set
    log('\n📋 Step 6: Creating Rule Set');
    const ruleSet = await safeCreate<RuleSet>('/rule-sets', {
      wardId: ward.id,
      name: 'TestWard Rules',
      active: true,
      rules: [
        { key: 'minRestHours', value: '11' },
        { key: 'maxConsecutiveNights', value: '3' },
        { key: 'oneShiftPerDay', value: 'true' },
        { key: 'maxHoursPerWeek', value: '48' },
        { key: 'minDaysOffPerWeek', value: '1' },
      ],
    }, 'Rule Set');

    // 7. Create Demand (Enhanced - 6 weeks with realistic patterns)
    log('\n📊 Step 7: Creating Demand');
    const horizonStart = DateTime.now().startOf('week'); // Current Monday
    const horizonEnd = horizonStart.plus({ weeks: 6 }); // 6 weeks instead of 4

    const demandPromises = [];
    const shiftSlots = ['early', 'late', 'night'];
    
    for (let i = 0; i < 42; i++) { // 6 weeks * 7 days
      const date = horizonStart.plus({ days: i });
      const dayOfWeek = date.weekday; // 1=Monday, 7=Sunday
      const isWeekend = dayOfWeek === 6 || dayOfWeek === 7;
      
      for (const slot of shiftSlots) {
        // Enhanced demand patterns with weekend variations
        let requiredBySkill: Record<string, number>;
        
        if (slot === 'night') {
          // Night shifts need more staff, especially for critical skills
          requiredBySkill = {
            resus: isWeekend ? 2 : 1,
            ventilator: isWeekend ? 4 : 3,
            phlebotomy: isWeekend ? 1 : 1,
            ecg: isWeekend ? 1 : 1,
            iv_access: isWeekend ? 2 : 1,
          };
        } else if (slot === 'early') {
          // Early shifts need moderate staff
          requiredBySkill = {
            resus: isWeekend ? 1 : 1,
            ventilator: isWeekend ? 3 : 2,
            phlebotomy: isWeekend ? 2 : 1,
            mri_scanning: isWeekend ? 1 : 1,
            ecg: isWeekend ? 1 : 1,
            iv_access: isWeekend ? 2 : 1,
          };
        } else { // Late shift
          // Late shifts need moderate staff
          requiredBySkill = {
            resus: isWeekend ? 1 : 1,
            ventilator: isWeekend ? 3 : 2,
            phlebotomy: isWeekend ? 1 : 1,
            mri_scanning: isWeekend ? 1 : 1,
            ecg: isWeekend ? 1 : 1,
            iv_access: isWeekend ? 2 : 1,
          };
        }
        
        demandPromises.push(
          safeCreate<Demand>('/demand', {
            wardId: ward.id,
            date: date.toFormat('yyyy-MM-dd'),
            slot,
            requiredBySkill,
            hourlyGranularity: false,
          }, `Demand for ${date.toFormat('yyyy-MM-dd')} ${slot}`)
        );
      }
    }

    await Promise.all(demandPromises);

    // 8. Create Schedule
    log('\n📅 Step 8: Creating Schedule');
    const schedule = await safeCreate<Schedule>('/schedules', {
      wardId: ward.id,
      horizonStart: horizonStart.toISO(),
      horizonEnd: horizonEnd.toISO(),
      objective: 'Minimize violations while ensuring coverage',
    }, 'Schedule');

    // 9. Run Solve
    log('\n🧮 Step 9: Running Solve');
    log('Calling solve endpoint...');
    
    const solveResponse: AxiosResponse<SolveResponse> = await api.post('/solve', {
      scheduleId: schedule.id,
      timeBudgetMs: 300000, // 5 minutes for larger problem
    });

    const metrics = solveResponse.data.metrics;
    log('✅ Solve completed successfully!');
    log(`📊 Metrics:`);
    log(`   - Hard Violations: ${metrics.hardViolations}`);
    log(`   - Solve Time: ${metrics.solveMs}ms`);
    log(`   - Fairness (Night Std): ${metrics.fairnessNightStd}`);
    log(`   - Preference Satisfaction: ${metrics.preferenceSatisfaction}`);

    // Summary
    log('\n🎉 Seed completed successfully!');
    log('📋 Summary:');
    log(`   - Ward ID: ${ward.id}`);
    log(`   - Schedule ID: ${schedule.id}`);
    log(`   - Staff Created: ${staff.length}`);
    log(`   - Skills Created: ${skills.length}`);
    log(`   - Jobs Created: ${jobs.length}`);
    log(`   - Shift Types Created: ${shiftTypes.length}`);
    log(`   - Demand Entries: ${demandPromises.length} (${42 * 3} days × 3 shifts)`);
    log(`   - Solve Metrics: ${metrics.hardViolations} violations, ${metrics.solveMs}ms`);

  } catch (error: any) {
    logError('Seed failed', error);
    process.exit(1);
  }
}

// Run the seed
seedTestWard().catch((error) => {
  logError('Unhandled error', error);
  process.exit(1);
});

export { seedTestWard };
