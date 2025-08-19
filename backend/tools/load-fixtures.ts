import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface WardFixture {
  id: string;
  name: string;
}

interface ShiftTypeFixture {
  id: string;
  code: string;
  start: string;
  end: string;
  isNight: boolean;
  durationMinutes: number;
}

interface SkillFixture {
  code: string;
  name: string;
}

interface StaffFixture {
  id: string;
  fullName: string;
  job: string;
  contractHoursPerWeek: number;
  skills: string[];
  eligibleWards: string[];
}

interface ScheduleFixture {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
  wardIds: string[];
}

interface RulesFixture {
  scheduleId: string;
  minRestHours: number;
  maxConsecutiveNights: number;
  oneShiftPerDay: boolean;
}

interface PolicyFixture {
  scope: string;
  label: string;
  weights: Record<string, number>;
  limits: Record<string, number>;
  toggles: Record<string, boolean>;
  substitution: Record<string, string[]>;
  timeBudgetMs: number;
  isActive: boolean;
  wardId?: string;
}

interface DemandFixture {
  wardId: string;
  date: string;
  slot: string;
  requirements: Record<string, number>;
}

export async function loadFixtures() {
  console.log('🌱 Loading fixture-based seed data...');
  
  const fixturesDir = path.join(__dirname, '..', 'seed_data');
  
  // Load JSON fixtures
  const wards = JSON.parse(fs.readFileSync(path.join(fixturesDir, 'wards.json'), 'utf8')) as WardFixture[];
  const shiftTypes = JSON.parse(fs.readFileSync(path.join(fixturesDir, 'shift_types.json'), 'utf8')) as ShiftTypeFixture[];
  const skills = JSON.parse(fs.readFileSync(path.join(fixturesDir, 'skills.json'), 'utf8')) as SkillFixture[];
  const staff = JSON.parse(fs.readFileSync(path.join(fixturesDir, 'staff.json'), 'utf8')) as StaffFixture[];
  const schedule = JSON.parse(fs.readFileSync(path.join(fixturesDir, 'schedule.json'), 'utf8')) as ScheduleFixture;
  const rules = JSON.parse(fs.readFileSync(path.join(fixturesDir, 'rules.json'), 'utf8')) as RulesFixture;
  const policyOrg = JSON.parse(fs.readFileSync(path.join(fixturesDir, 'policy_org.json'), 'utf8')) as PolicyFixture;
  const policyWard1 = JSON.parse(fs.readFileSync(path.join(fixturesDir, 'policy_ward1.json'), 'utf8')) as PolicyFixture;
  const demand = JSON.parse(fs.readFileSync(path.join(fixturesDir, 'demand_ward1_2025-01-01_to_2025-01-14.json'), 'utf8')) as DemandFixture[];

  // 1. Create jobs first
  console.log('  Creating jobs...');
  const jobs = [
    { code: 'doctor', name: 'Doctor' },
    { code: 'nurse', name: 'Nurse' }
  ];
  
  for (const job of jobs) {
    await prisma.job.upsert({
      where: { code: job.code },
      update: {},
      create: job,
    });
  }

  // 2. Create wards
  console.log('  Creating wards...');
  for (const ward of wards) {
    await prisma.ward.upsert({
      where: { id: ward.id },
      update: { name: ward.name },
      create: {
        id: ward.id,
        name: ward.name,
        hourlyGranularity: false
      },
    });
  }

  // 3. Create shift types
  console.log('  Creating shift types...');
  for (const shiftType of shiftTypes) {
    await prisma.shiftType.upsert({
      where: { code: shiftType.code },
      update: {
        name: shiftType.id.charAt(0).toUpperCase() + shiftType.id.slice(1),
        startTime: shiftType.start,
        endTime: shiftType.end,
        isNight: shiftType.isNight,
        durationMinutes: shiftType.durationMinutes
      },
      create: {
        id: shiftType.id,
        code: shiftType.code,
        name: shiftType.id.charAt(0).toUpperCase() + shiftType.id.slice(1),
        startTime: shiftType.start,
        endTime: shiftType.end,
        isNight: shiftType.isNight,
        durationMinutes: shiftType.durationMinutes
      },
    });
  }

  // 4. Create skills
  console.log('  Creating skills...');
  for (const skill of skills) {
    await prisma.skill.upsert({
      where: { code: skill.code },
      update: { name: skill.name },
      create: {
        code: skill.code,
        name: skill.name
      },
    });
  }

  // 5. Create staff
  console.log('  Creating staff...');
  for (const staffMember of staff) {
    // Get job ID
    const job = await prisma.job.findUnique({ where: { code: staffMember.job } });
    if (!job) throw new Error(`Job not found: ${staffMember.job}`);

    // Get skill IDs
    const skillIds = [];
    for (const skillCode of staffMember.skills) {
      const skill = await prisma.skill.findUnique({ where: { code: skillCode } });
      if (skill) skillIds.push(skill.id);
    }

    // Get ward IDs
    const wardIds = [];
    for (const wardId of staffMember.eligibleWards) {
      const ward = await prisma.ward.findUnique({ where: { id: wardId } });
      if (ward) wardIds.push(ward.id);
    }

    // Create staff member
    await prisma.staff.upsert({
      where: { id: staffMember.id },
      update: {
        fullName: staffMember.fullName,
        role: staffMember.job as 'doctor' | 'nurse',
        contractHoursPerWeek: staffMember.contractHoursPerWeek,
        jobId: job.id,
        skills: { set: skillIds.map(id => ({ id })) },
        wards: { set: wardIds.map(id => ({ id })) }
      },
      create: {
        id: staffMember.id,
        fullName: staffMember.fullName,
        role: staffMember.job as 'doctor' | 'nurse',
        contractHoursPerWeek: staffMember.contractHoursPerWeek,
        jobId: job.id,
        skills: { connect: skillIds.map(id => ({ id })) },
        wards: { connect: wardIds.map(id => ({ id })) }
      },
    });
  }

  // 6. Create schedule
  console.log('  Creating schedule...');
  const ward1 = await prisma.ward.findUnique({ where: { id: 'ward1' } });
  if (!ward1) throw new Error('Ward1 not found');

  await prisma.schedule.upsert({
    where: { id: schedule.id },
    update: {
      wardId: ward1.id,
      horizonStart: new Date(schedule.startDate),
      horizonEnd: new Date(schedule.endDate),
      status: schedule.status.toLowerCase() as 'draft' | 'published',
      objective: schedule.name
    },
    create: {
      id: schedule.id,
      wardId: ward1.id,
      horizonStart: new Date(schedule.startDate),
      horizonEnd: new Date(schedule.endDate),
      status: schedule.status.toLowerCase() as 'draft' | 'published',
      objective: schedule.name
    },
  });

  // 7. Create rules
  console.log('  Creating rules...');
  const ruleSet = await prisma.ruleSet.upsert({
    where: { 
      id: 'ruleset-ward1'
    },
    update: {
      wardId: ward1.id,
      name: 'Ward 1 Rules',
      active: true
    },
    create: {
      id: 'ruleset-ward1',
      wardId: ward1.id,
      name: 'Ward 1 Rules',
      active: true
    },
  });

  // Create individual rules
  const ruleData = [
    { key: 'minRestHours', value: rules.minRestHours.toString() },
    { key: 'maxConsecutiveNights', value: rules.maxConsecutiveNights.toString() },
    { key: 'oneShiftPerDay', value: rules.oneShiftPerDay.toString() }
  ];

  for (const rule of ruleData) {
    await prisma.rule.upsert({
      where: {
        id: `rule-${ruleSet.id}-${rule.key}`
      },
      update: { 
        ruleSetId: ruleSet.id,
        key: rule.key,
        value: rule.value 
      },
      create: {
        id: `rule-${ruleSet.id}-${rule.key}`,
        ruleSetId: ruleSet.id,
        key: rule.key,
        value: rule.value
      },
    });
  }

  // 8. Create policies
  console.log('  Creating policies...');
  
  // Org policy
  await prisma.policy.upsert({
    where: {
      id: 'policy-org-default'
    },
    update: {
      scope: 'ORG',
      orgId: null,
      wardId: null,
      scheduleId: null,
      label: policyOrg.label,
      weights: policyOrg.weights,
      limits: policyOrg.limits,
      toggles: policyOrg.toggles,
      substitution: policyOrg.substitution,
      timeBudgetMs: policyOrg.timeBudgetMs,
      isActive: policyOrg.isActive
    },
    create: {
      id: 'policy-org-default',
      scope: 'ORG',
      orgId: null,
      wardId: null,
      scheduleId: null,
      label: policyOrg.label,
      weights: policyOrg.weights,
      limits: policyOrg.limits,
      toggles: policyOrg.toggles,
      substitution: policyOrg.substitution,
      timeBudgetMs: policyOrg.timeBudgetMs,
      isActive: policyOrg.isActive
    },
  });

  // Ward policy
  await prisma.policy.upsert({
    where: {
      id: 'policy-ward-ward1'
    },
    update: {
      scope: 'WARD',
      orgId: null,
      wardId: policyWard1.wardId!,
      scheduleId: null,
      label: policyWard1.label,
      weights: policyWard1.weights,
      limits: policyWard1.limits,
      toggles: policyWard1.toggles,
      substitution: policyWard1.substitution,
      timeBudgetMs: policyWard1.timeBudgetMs,
      isActive: policyWard1.isActive
    },
    create: {
      id: 'policy-ward-ward1',
      scope: 'WARD',
      orgId: null,
      wardId: policyWard1.wardId!,
      scheduleId: null,
      label: policyWard1.label,
      weights: policyWard1.weights,
      limits: policyWard1.limits,
      toggles: policyWard1.toggles,
      substitution: policyWard1.substitution,
      timeBudgetMs: policyWard1.timeBudgetMs,
      isActive: policyWard1.isActive
    },
  });

  // 9. Create demand
  console.log('  Creating demand...');
  for (const demandItem of demand) {
    const demandId = `demand-${demandItem.wardId}-${demandItem.date}-${demandItem.slot}`;
    await prisma.demand.upsert({
      where: {
        id: demandId
      },
      update: {
        wardId: demandItem.wardId,
        date: new Date(demandItem.date),
        granularity: 'shift',
        slot: demandItem.slot,
        requiredBySkill: demandItem.requirements
      },
      create: {
        id: demandId,
        wardId: demandItem.wardId,
        date: new Date(demandItem.date),
        granularity: 'shift',
        slot: demandItem.slot,
        requiredBySkill: demandItem.requirements
      },
    });
  }

  console.log('✅ Fixture loading completed!');
}

export async function printFixtureSummary() {
  console.log('\n📊 FIXTURE SEED SUMMARY');
  console.log('============================================================');
  
  // Counts
  const wardCount = await prisma.ward.count();
  const shiftTypeCount = await prisma.shiftType.count();
  const skillCount = await prisma.skill.count();
  const staffCount = await prisma.staff.count();
  const demandCount = await prisma.demand.count();
  const scheduleCount = await prisma.schedule.count();
  const policyCount = await prisma.policy.count();
  
  console.log(`🏥 Wards: ${wardCount}`);
  console.log(`⏰ Shift Types: ${shiftTypeCount}`);
  console.log(`🔧 Skills: ${skillCount}`);
  console.log(`👥 Staff: ${staffCount}`);
  console.log(`📊 Demand: ${demandCount} rows`);
  console.log(`📅 Schedules: ${scheduleCount}`);
  console.log(`📋 Policies: ${policyCount}`);

  // Check schedule and rules
  const schedule = await prisma.schedule.findUnique({ 
    where: { id: 'sched-ward1-14d' },
    include: { ward: true }
  });
  
  if (schedule) {
    console.log(`✅ Schedule sched-ward1-14d exists (${schedule.ward.name})`);
    
    const ruleSet = await prisma.ruleSet.findFirst({
      where: { wardId: schedule.wardId },
      include: { rules: true }
    });
    
    if (ruleSet && ruleSet.rules.length > 0) {
      console.log(`✅ Rules attached: ${ruleSet.rules.length} rules`);
    } else {
      console.log(`❌ No rules found`);
    }
  } else {
    console.log(`❌ Schedule sched-ward1-14d not found`);
  }

  // Calculate total required headcount
  const demand = await prisma.demand.findMany();
  let totalRequired = 0;
  for (const d of demand) {
    const requirements = d.requiredBySkill as Record<string, number>;
    for (const skill in requirements) {
      totalRequired += requirements[skill];
    }
  }
  console.log(`📈 Total required headcount: ${totalRequired} across 14 days`);

  // Staff by skill histogram
  const staff = await prisma.staff.findMany({
    include: { skills: true }
  });
  
  const skillHistogram: Record<string, number> = {};
  for (const s of staff) {
    for (const skill of s.skills) {
      skillHistogram[skill.code] = (skillHistogram[skill.code] || 0) + 1;
    }
  }
  
  console.log(`👥 Staff by skill:`, skillHistogram);

  // Capacity vs demand check
  const totalStaffMinutes = staff.reduce((sum, s) => sum + (s.contractHoursPerWeek * 60 * 2), 0); // 2 weeks
  const totalDemandMinutes = totalRequired * 480; // 8 hours per shift
  
  console.log(`⚖️ Capacity vs Demand:`);
  console.log(`  Total staff minutes (2 weeks): ${totalStaffMinutes}`);
  console.log(`  Total demand minutes: ${totalDemandMinutes}`);
  console.log(`  Ratio: ${(totalStaffMinutes / totalDemandMinutes).toFixed(2)}x`);
  
  if (totalStaffMinutes >= totalDemandMinutes) {
    console.log(`  ✅ Sufficient capacity`);
  } else {
    console.log(`  ⚠️ Insufficient capacity`);
  }

  console.log('============================================================\n');
}
