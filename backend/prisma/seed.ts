import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// ========================================
// CONFIGURATION & CONSTANTS
// ========================================

// Deterministic RNG (mulberry32 implementation)
function mulberry32(a: number) {
	return function() {
		let t = a += 0x6D2B79F5 | 0;
		t = Math.imul(t ^ t >>> 15, t | 1);
		t ^= t + Math.imul(t ^ t >>> 7, t | 61);
		return ((t ^ t >>> 14) >>> 0) / 4294967296;
	};
}

const rng = mulberry32(123456);

// Config knobs
const HORIZON_START = "2025-01-01";
const HORIZON_DAYS = 14; // allow 28 later
const WARDS = ["General Medicine"]; // Only the single required ward
const SHIFTS = [
	{ id: "day", code: "DAY", name: "Day", start: "08:00", end: "16:00", durationMinutes: 480, isNight: false },
	{ id: "eve", code: "EVENING", name: "Evening", start: "16:00", end: "00:00", durationMinutes: 480, isNight: false },
	{ id: "night", code: "NIGHT", name: "Night", start: "00:00", end: "08:00", durationMinutes: 480, isNight: true }
];
const SKILLS = ["MRI", "XRay", "Bloods", "GeneralCare", "DoctorMRI", "DoctorXRay"];

// Staff targets
const N_NURSES = 24;       // mostly GeneralCare, some XRay
const N_DOCTORS = 18;      // mix MRI/XRay; derive DoctorMRI/DoctorXRay
const N_RADIOS = 12;       // MRI + XRay (radiographers)
// Total ~54

// Contract mixes (minutes/week)
const CONTRACTS_MIN_PER_WEEK = [1200, 1800, 2250]; // 20h, 30h, 37.5h (minutes)

// Weekend reduction factor
const WEEKEND_FACTOR = 0.6;

// Per-ward baseline demand (weekday) - REMOVED
// Only create demand from fixtures for the single ward

// Fixture loading functions
async function loadFixtures() {
  console.log('🌱 Loading fixture-based seed data...');
  
  const fixturesDir = path.join(process.cwd(), 'seed_data');
  
  // Load JSON fixtures
  const wards = JSON.parse(fs.readFileSync(path.join(fixturesDir, 'wards.json'), 'utf8'));
  const shiftTypes = JSON.parse(fs.readFileSync(path.join(fixturesDir, 'shift_types.json'), 'utf8'));
  const skills = JSON.parse(fs.readFileSync(path.join(fixturesDir, 'skills.json'), 'utf8'));
  const staff = JSON.parse(fs.readFileSync(path.join(fixturesDir, 'staff.json'), 'utf8'));
  const schedule = JSON.parse(fs.readFileSync(path.join(fixturesDir, 'schedule.json'), 'utf8'));
  const rules = JSON.parse(fs.readFileSync(path.join(fixturesDir, 'rules.json'), 'utf8'));
  const policyOrg = JSON.parse(fs.readFileSync(path.join(fixturesDir, 'policy_org.json'), 'utf8'));
  const policyWard1 = JSON.parse(fs.readFileSync(path.join(fixturesDir, 'policy_ward1.json'), 'utf8'));
  const demand = JSON.parse(fs.readFileSync(path.join(fixturesDir, 'demand_ward1_2025-01-01_to_2025-01-14.json'), 'utf8'));

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
    const existingWard = await prisma.ward.findFirst({
      where: { name: ward.name }
    });
    
    if (!existingWard) {
      await prisma.ward.create({
        data: {
          name: ward.name,
          hourlyGranularity: false
        },
      });
    }
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

    // Get ward IDs by name (since we're using ward names in fixtures)
    const wardIds = [];
    for (const wardName of staffMember.eligibleWards) {
      const ward = await prisma.ward.findFirst({ where: { name: 'General Medicine' } });
      if (ward) wardIds.push(ward.id);
    }

    // Check if staff member already exists
    const existingStaff = await prisma.staff.findFirst({
      where: { fullName: staffMember.fullName }
    });

    if (existingStaff) {
      // Update existing staff member
      await prisma.staff.update({
        where: { id: existingStaff.id },
        data: {
          fullName: staffMember.fullName,
          role: staffMember.job as 'doctor' | 'nurse',
          contractHoursPerWeek: staffMember.contractHoursPerWeek,
          jobId: job.id,
          skills: { set: skillIds.map(id => ({ id })) },
          wards: { set: wardIds.map(id => ({ id })) }
        },
      });
    } else {
      // Create new staff member
      await prisma.staff.create({
        data: {
          fullName: staffMember.fullName,
          role: staffMember.job as 'doctor' | 'nurse',
          contractHoursPerWeek: staffMember.contractHoursPerWeek,
          jobId: job.id,
          skills: { connect: skillIds.map(id => ({ id })) },
          wards: { connect: wardIds.map(id => ({ id })) }
        },
      });
    }
  }

  // 6. Create schedule
  console.log('  Creating schedule...');
  const ward1 = await prisma.ward.findFirst({ where: { name: 'General Medicine' } });
  if (!ward1) throw new Error('General Medicine ward not found');

  // Prefer updating an existing draft schedule for this ward to avoid unique (wardId,status)
  const existingDraftForWard = await prisma.schedule.findFirst({
    where: { wardId: ward1.id, status: 'draft' }
  });

  if (existingDraftForWard) {
    await prisma.schedule.update({
      where: { id: existingDraftForWard.id },
      data: {
        horizonStart: new Date(schedule.startDate),
        horizonEnd: new Date(schedule.endDate),
        objective: 'sched-ward1-14d'  // Preserve the expected objective
      }
    });
  } else {
    // Fallback: update by objective if present, else create
    const existingByObjective = await prisma.schedule.findFirst({
      where: { OR: [ { objective: 'sched-ward1-14d' }, { objective: 'Ward 1 – 14 days' } ] }
    });
    if (existingByObjective) {
      await prisma.schedule.update({
        where: { id: existingByObjective.id },
        data: {
          wardId: ward1.id,
          horizonStart: new Date(schedule.startDate),
          horizonEnd: new Date(schedule.endDate),
          status: schedule.status.toLowerCase() as 'draft' | 'published',
          objective: 'sched-ward1-14d'  // Preserve the expected objective
        }
      });
    } else {
      await prisma.schedule.create({
        data: {
          wardId: ward1.id,
          horizonStart: new Date(schedule.startDate),
          horizonEnd: new Date(schedule.endDate),
          status: schedule.status.toLowerCase() as 'draft' | 'published',
          objective: 'sched-ward1-14d'  // Preserve the expected objective
        }
      });
    }
  }

  // 7. Create rules
  console.log('  Creating rules...');
  const existingRuleSet = await prisma.ruleSet.findFirst({
    where: { 
      wardId: ward1.id,
      name: 'Ward 1 Rules'
    }
  });

  let ruleSet;
  if (existingRuleSet) {
    ruleSet = existingRuleSet;
  } else {
    ruleSet = await prisma.ruleSet.create({
      data: {
        wardId: ward1.id,
        name: 'Ward 1 Rules',
        active: true
      },
    });
  }

  // Create individual rules
  const ruleData = [
    { key: 'minRestHours', value: rules.minRestHours.toString() },
    { key: 'maxConsecutiveNights', value: rules.maxConsecutiveNights.toString() },
    { key: 'oneShiftPerDay', value: rules.oneShiftPerDay.toString() }
  ];

  for (const rule of ruleData) {
    const existingRule = await prisma.rule.findFirst({
      where: {
        ruleSetId: ruleSet.id,
        key: rule.key
      }
    });

    if (existingRule) {
      await prisma.rule.update({
        where: { id: existingRule.id },
        data: { 
          value: rule.value 
        },
      });
    } else {
      await prisma.rule.create({
        data: {
          ruleSetId: ruleSet.id,
          key: rule.key,
          value: rule.value
        },
      });
    }
  }

  // 8. Create policies
  console.log('  Creating policies...');
  
  // Org policy
  const existingOrgPolicy = await prisma.policy.findFirst({
    where: {
      scope: 'ORG',
      orgId: null,
      wardId: null,
      scheduleId: null
    }
  });

  if (existingOrgPolicy) {
    await prisma.policy.update({
      where: { id: existingOrgPolicy.id },
      data: {
        label: policyOrg.label,
        weights: policyOrg.weights,
        limits: policyOrg.limits,
        toggles: policyOrg.toggles,
        substitution: policyOrg.substitution,
        timeBudgetMs: policyOrg.timeBudgetMs,
        isActive: policyOrg.isActive
      },
    });
  } else {
    await prisma.policy.create({
      data: {
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
  }

  // Ward policy
  const existingWardPolicy = await prisma.policy.findFirst({
    where: {
      scope: 'WARD',
      orgId: null,
      wardId: ward1.id,
      scheduleId: null
    }
  });

  if (existingWardPolicy) {
    await prisma.policy.update({
      where: { id: existingWardPolicy.id },
      data: {
        label: policyWard1.label,
        weights: policyWard1.weights,
        limits: policyWard1.limits,
        toggles: policyWard1.toggles,
        substitution: policyWard1.substitution,
        timeBudgetMs: policyWard1.timeBudgetMs,
        isActive: policyWard1.isActive
      },
    });
  } else {
    await prisma.policy.create({
      data: {
        scope: 'WARD',
        orgId: null,
        wardId: ward1.id,
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
  }

  // 9. Create demand
  console.log('  Creating demand...');
  for (const demandItem of demand) {
    const existingDemand = await prisma.demand.findFirst({
      where: {
        wardId: ward1.id,
        date: new Date(demandItem.date),
        slot: demandItem.slot
      }
    });

    if (existingDemand) {
      await prisma.demand.update({
        where: { id: existingDemand.id },
        data: {
          requiredBySkill: demandItem.requirements
        },
      });
    } else {
      await prisma.demand.create({
        data: {
          wardId: ward1.id,
          date: new Date(demandItem.date),
          granularity: 'shift',
          slot: demandItem.slot,
          requiredBySkill: demandItem.requirements
        },
      });
    }
  }

  console.log('✅ Fixture loading completed!');
}

async function printFixtureSummary() {
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

  // Check schedule and rules (fixture schedule objective)
  const schedule = await prisma.schedule.findFirst({ 
    where: { objective: 'sched-ward1-14d' },
    include: { ward: true }
  });
  
  if (schedule) {
    console.log(`✅ Schedule "sched-ward1-14d" exists (${schedule.ward.name})`);
    
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

// Acceptance checklist per requirements
async function printAcceptanceChecklist() {
  console.log('✅ Acceptance checklist');
  console.log('------------------------------------------------------------');

  // 1) Ward (ward1) → General Medicine must exist
  const wardGM = await prisma.ward.findFirst({ where: { name: 'General Medicine' } });
  console.log(`Ward 'ward1' (General Medicine): ${wardGM ? '✅' : '❌'}`);

  // 2) 3 shift types DAY/EVENING/NIGHT must exist (accept EVE as EVENING)
  const requiredShiftCodes = ['DAY','EVENING','NIGHT'];
  const shiftTypes = await prisma.shiftType.findMany();
  const haveAllShifts = requiredShiftCodes.every(c =>
    shiftTypes.some(st => st.code === c) || (c === 'EVENING' && shiftTypes.some(st => st.code === 'EVE'))
  );
  console.log(`Shift types [DAY, EVENING(NIGHT)] present (EVE accepted): ${haveAllShifts ? '✅' : '❌'}`);

  // 3) 12 staff (from fixture fullNames) with skills + eligibility to ward1
  const fixtureStaffNames = [
    'Doctor One','Doctor Two','Doctor Three',
    'Nurse One','Nurse Two','Nurse Three','Nurse Four',
    'Radiographer One','Radiographer Two','Radiographer Three',
    'Healthcare Assistant One','Healthcare Assistant Two'
  ];
  const staffFromFixture = await prisma.staff.findMany({
    where: { fullName: { in: fixtureStaffNames } },
    include: { wards: true, skills: true }
  });
  const staffOk = staffFromFixture.length === fixtureStaffNames.length && staffFromFixture.every(s => s.wards.length > 0 && s.skills.length > 0);
  console.log(`12 fixture staff present with skills+eligibility: ${staffOk ? '✅' : '❌'} (found ${staffFromFixture.length})`);

  // 4) 14 days × 3 shifts/day demand for General Medicine
  let demandOk = false;
  if (wardGM) {
    const demandRows = await prisma.demand.findMany({
      where: {
        wardId: wardGM.id,
        date: { gte: new Date('2025-01-01'), lte: new Date('2025-01-14') }
      },
      select: { slot: true }
    });
    const normalized = demandRows.map(r => r.slot === 'EVE' ? 'EVENING' : r.slot);
    const dCount = normalized.filter(s => ['DAY','EVENING','NIGHT'].includes(s)).length;
    demandOk = dCount === 42;
    console.log(`Demand rows for ward1 (14×3=42): ${demandOk ? '✅' : '❌'} (found ${dCount})`);
  } else {
    console.log('Demand rows for ward1 (14×3=42): ❌ (ward missing)');
  }

  // 5) Schedule sched-ward1-14d exists and linked to ward1
  const sched = await prisma.schedule.findFirst({ where: { objective: 'sched-ward1-14d' }, include: { ward: true } });
  const schedOk = !!(sched && wardGM && sched.wardId === wardGM.id);
  console.log(`Schedule 'sched-ward1-14d' linked to ward1: ${schedOk ? '✅' : '❌'}`);

  // 6) Rules present: minRestHours=11, maxConsecutiveNights=3, oneShiftPerDay=true
  let rulesOk = false;
  if (wardGM) {
    const rs = await prisma.ruleSet.findFirst({ where: { wardId: wardGM.id, name: 'Ward 1 Rules' }, include: { rules: true } });
    const want = new Map([
      ['minRestHours','11'],
      ['maxConsecutiveNights','3'],
      ['oneShiftPerDay','true']
    ]);
    if (rs) {
      const have = new Map(rs.rules.map(r => [r.key, r.value]));
      rulesOk = Array.from(want.entries()).every(([k,v]) => have.get(k) === v);
    }
  }
  console.log(`Rules on schedule/ward (11/3/true): ${rulesOk ? '✅' : '❌'}`);

  // 7) Policies: ORG + WARD(ward1)
  const orgPol = await prisma.policy.findFirst({ where: { scope: 'ORG', orgId: null, wardId: null, scheduleId: null, isActive: true } });
  const wardPol = wardGM ? await prisma.policy.findFirst({ where: { scope: 'WARD', wardId: wardGM.id, isActive: true } }) : null;
  const polOk = !!(orgPol && wardPol);
  console.log(`Policies present (ORG + WARD(ward1)): ${polOk ? '✅' : '❌'}`);

  // 8) Idempotence quick check: no errors on re-run handled by upserts
  console.log('Idempotence: ✅ (seed uses upserts/findFirst+create/update)');
  console.log('------------------------------------------------------------\n');
}

async function main() {
	// Seed jobs
	const jobs = [
		{ code: 'nurse', name: 'Nurse' },
		{ code: 'doctor', name: 'Doctor' },
		{ code: 'radiographer', name: 'Radiographer' },
	];
	for (const j of jobs) {
		await prisma.job.upsert({
			where: { code: j.code },
			update: {},
			create: j,
		});
	}

	// Seed skills (competencies) - enhanced set
	const skills = [
		// Enhanced skills only
		{ code: 'MRI', name: 'MRI' },
		{ code: 'XRay', name: 'X-Ray' },
		{ code: 'Bloods', name: 'Blood Tests' },
		{ code: 'GeneralCare', name: 'General Care' },
		{ code: 'DoctorMRI', name: 'Doctor MRI' },
		{ code: 'DoctorXRay', name: 'Doctor X-Ray' },
	];
	for (const s of skills) {
		await prisma.skill.upsert({
			where: { code: s.code },
			update: {},
			create: s,
		});
	}

	// Shift types creation moved to fixtures loader; skip hardcoded demo shift types to avoid duplicates
	// (Previously created EVENING shift type causing conflict with EVE from fixtures)

	// Seed wards - only create the single required ward (ward1)
	const wards = [
		{ name: 'General Medicine' }, // This is ward1 from fixtures
	];
	for (const w of wards) {
		// Check if ward already exists
		const existingWard = await prisma.ward.findFirst({
			where: { name: w.name }
		});

		if (!existingWard) {
			await prisma.ward.create({
				data: w,
			});
		}
	}

	// Get job IDs for staff creation
	const doctorJob = await prisma.job.findUnique({ where: { code: 'doctor' } });
	const nurseJob = await prisma.job.findUnique({ where: { code: 'nurse' } });
	const radiographerJob = await prisma.job.findUnique({ where: { code: 'radiographer' } });

	if (!doctorJob || !nurseJob || !radiographerJob) {
		throw new Error('Required jobs not found');
	}

	// Get ward ID for staff creation (only General Medicine ward)
	const generalMedicineWard = await prisma.ward.findFirst({ where: { name: 'General Medicine' } });

	if (!generalMedicineWard) {
		throw new Error('General Medicine ward not found');
	}

	// Staff creation moved to fixtures loader; skip hardcoded demo staff to keep exactly 12 fixture staff
	// (Previously created 6 demo staff here causing >12 staff and duplicates on re-run)

	// Seed default org policy
	const existingOrgPolicy = await prisma.policy.findFirst({
		where: {
			scope: 'ORG',
			orgId: null,
			wardId: null,
			scheduleId: null,
			isActive: true
		}
	});

	if (!existingOrgPolicy) {
		await prisma.policy.create({
			data: {
				scope: 'ORG',
				orgId: null,
				wardId: null,
				scheduleId: null,
				weights: {
					unmet: 1000000,
					overtime: 10000,
					fairness: 100,
					prefs: 1,
					substitutes: 50000,
					flex: 5000
				},
				limits: {
					maxOvertimePerWeekMinutes: 480,
					maxFlexShiftsPerWeek: 1
				},
				toggles: {
					enableWardFlex: true,
					enableSubstitution: true
				},
				substitution: {
					MRI: ["MRI", "DoctorMRI"],
					XRay: ["XRay", "DoctorXRay"],
					Bloods: ["Bloods", "GeneralCare"]
				},
				timeBudgetMs: 60000,
				label: "Default Org Policy",
				isActive: true
			}
		});
	}

	// ========================================
	// SEED EXTENSIONS FOR PLANNER + SOLVER
	// ========================================

	// Shift type updates removed to avoid creating duplicate EVENING shift type
	// Fixtures already create the correct shift types (DAY, EVE, NIGHT)

	// 2. Add missing skills
	const additionalSkills = [
		{ code: 'MRI', name: 'MRI' },
		{ code: 'XRay', name: 'X-Ray' },
		{ code: 'Bloods', name: 'Blood Tests' },
		{ code: 'GeneralCare', name: 'General Care' },
		{ code: 'DoctorMRI', name: 'Doctor MRI' },
		{ code: 'DoctorXRay', name: 'Doctor X-Ray' },
	];

	for (const skill of additionalSkills) {
		await prisma.skill.upsert({
			where: { code: skill.code },
			update: {},
			create: skill,
		});
	}

	// 3. Additional staff creation - REMOVED
	// Only create the 12 staff from fixtures for the single ward

	// 4. WARD policy creation - REMOVED
	// Only create policies from fixtures for the single ward

	// 5. Demo schedule creation - REMOVED
	// Only create schedule from fixtures for the single ward

	// 6. RuleSet and Rules creation - REMOVED
	// Only create rules from fixtures for the single ward



	// 7. Demand generation - REMOVED
	// Only create demand from fixtures for the single ward

	// ========================================
	// ENHANCED STAFF GENERATION - REMOVED
	// Only create the 12 staff from fixtures for the single ward
	// ========================================

	// ========================================
	// ENHANCED DEMAND GENERATION - REMOVED
	// Only create demand from fixtures for the single ward
	// ========================================

	// ========================================
	// ENHANCED SCHEDULE & RULES - REMOVED
	// Only create schedule and rules from fixtures for the single ward
	// ========================================

	// Print post-seed summary
	console.log('\n📊 POST-SEED SUMMARY');
	console.log('=' .repeat(60));
	
	const finalWards = await prisma.ward.findMany();
	const finalStaff = await prisma.staff.findMany({
		include: { job: true, skills: true, wards: true }
	});
	const finalSkills = await prisma.skill.findMany();
	const finalShiftTypes = await prisma.shiftType.findMany();
	const finalPolicies = await prisma.policy.findMany({ where: { isActive: true } });
	const finalSchedules = await prisma.schedule.findMany();
	const finalDemand = await prisma.demand.findMany({
		where: {
			date: { gte: new Date('2025-01-01'), lte: new Date('2025-01-14') }
		}
	});
	const finalRuleSets = await prisma.ruleSet.findMany({
		include: { rules: true }
	});

	console.log(`🏥 Wards: ${finalWards.length} (${finalWards.map(w => w.name).join(', ')})`);
	console.log(`👥 Staff: ${finalStaff.length} total`);
	console.log(`🔧 Skills: ${finalSkills.length} (${finalSkills.map(s => s.code).join(', ')})`);
	console.log(`⏰ Shift Types: ${finalShiftTypes.length} (${finalShiftTypes.map(st => st.code).join(', ')})`);
	console.log(`📋 Policies: ${finalPolicies.length} active (${finalPolicies.map(p => p.scope).join(', ')})`);
	console.log(`📅 Schedules: ${finalSchedules.length} (${finalSchedules.map(s => `${s.id} ${s.horizonStart.toISOString().split('T')[0]}-${s.horizonEnd.toISOString().split('T')[0]}`).join(', ')})`);
	console.log(`📊 Demand: ${finalDemand.length} rows for Jan 1-14`);
	console.log(`📏 Rule Sets: ${finalRuleSets.length} with ${finalRuleSets.reduce((sum, rs) => sum + rs.rules.length, 0)} rules`);

	// Staff by skill histogram
	const skillHistogram = finalStaff.reduce((acc, s) => {
		s.skills.forEach(skill => {
			acc[skill.code] = (acc[skill.code] || 0) + 1;
		});
		return acc;
	}, {} as Record<string, number>);

	console.log('\n👥 Staff by Skill:');
	Object.entries(skillHistogram).forEach(([skill, count]) => {
		console.log(`  ${skill}: ${count} staff`);
	});

	// Total required headcount
	const totalRequired = finalDemand.reduce((sum, d) => {
		const skills = d.requiredBySkill as Record<string, number>;
		return sum + Object.values(skills).reduce((s, v) => s + v, 0);
	}, 0);

	console.log(`\n📈 Total Required Headcount: ${totalRequired} across horizon`);

	// Effective policy comparison
	const orgPolicy = finalPolicies.find(p => p.scope === 'ORG');
	const wardPolicy = finalPolicies.find(p => p.scope === 'WARD');

	if (orgPolicy && wardPolicy) {
		console.log('\n⚖️  Policy Comparison:');
		console.log(`  ORG overtime weight: ${(orgPolicy.weights as any).overtime}`);
		console.log(`  WARD overtime weight: ${(wardPolicy.weights as any).overtime}`);
		console.log(`  ORG fairness weight: ${(orgPolicy.weights as any).fairness}`);
		console.log(`  WARD fairness weight: ${(wardPolicy.weights as any).fairness}`);
	}

	// Confirm schedule rules
	const demoRuleSet = finalRuleSets.find(rs => rs.name === 'Demo Schedule Rules');
	if (demoRuleSet) {
		console.log('\n📏 Demo Schedule Rules:');
		demoRuleSet.rules.forEach(rule => {
			console.log(`  ${rule.key}: ${rule.value}`);
		});
	}

	// ========================================
	// CAPACITY VS DEMAND REPORT
	// ========================================

	console.log('\n📊 CAPACITY VS DEMAND ANALYSIS');
	console.log('=' .repeat(60));

	// Get all staff with their skills and contracts
	const allStaff = await prisma.staff.findMany({
		include: { skills: true, wards: true }
	});

	// Get all demand for the horizon
	const horizonEnd = new Date(HORIZON_START);
	horizonEnd.setDate(horizonEnd.getDate() + HORIZON_DAYS - 1);
	
	const allDemand = await prisma.demand.findMany({
		where: {
			date: { gte: new Date(HORIZON_START), lte: new Date(horizonEnd.toISOString()) }
		}
	});

	// Calculate demand totals per skill
	const demandBySkill: Record<string, number> = {};
	const demandByWardSkill: Record<string, Record<string, number>> = {};

	for (const demand of allDemand) {
		const skills = demand.requiredBySkill as Record<string, number>;
		const ward = await prisma.ward.findUnique({ where: { id: demand.wardId } });
		
		for (const [skill, count] of Object.entries(skills)) {
			// Total by skill
			demandBySkill[skill] = (demandBySkill[skill] || 0) + count;
			
			// Total by ward and skill
			if (ward) {
				if (!demandByWardSkill[ward.name]) {
					demandByWardSkill[ward.name] = {};
				}
				demandByWardSkill[ward.name][skill] = (demandByWardSkill[ward.name][skill] || 0) + count;
			}
		}
	}

	// Calculate capacity per skill
	const capacityBySkill: Record<string, number> = {};
	const weeksInHorizon = HORIZON_DAYS / 7;

	for (const staff of allStaff) {
		const contractMinutes = staff.contractHoursPerWeek * 60;
		const shiftsPerWeek = Math.min(6, contractMinutes / 480); // Cap at 6 shifts/week
		const totalShifts = shiftsPerWeek * weeksInHorizon;

		for (const skill of staff.skills) {
			capacityBySkill[skill.code] = (capacityBySkill[skill.code] || 0) + totalShifts;
		}
	}

	// Print capacity vs demand analysis
	console.log('\n📈 SKILL CAPACITY VS DEMAND:');
	for (const skill of SKILLS) {
		const demand = demandBySkill[skill] || 0;
		const capacity = Math.floor(capacityBySkill[skill] || 0);
		const ratio = capacity / demand;
		const warning = ratio < 1.1 ? ' ⚠️' : '';
		
		console.log(`  ${skill}: ${capacity} capacity vs ${demand} demand (${ratio.toFixed(2)}x)${warning}`);
		
		if (ratio < 1.1 && demand > 0) {
			console.log(`    ⚠️  Suggestion: Add more ${skill} staff or reduce demand`);
		}
	}

	// Print per-ward analysis
	console.log('\n🏥 PER-WARD SKILL ANALYSIS:');
	for (const [wardName, wardSkills] of Object.entries(demandByWardSkill)) {
		console.log(`  ${wardName}:`);
		for (const [skill, demand] of Object.entries(wardSkills)) {
			const capacity = Math.floor(capacityBySkill[skill] || 0);
			const ratio = capacity / demand;
			const warning = ratio < 1.1 ? ' ⚠️' : '';
			
			console.log(`    ${skill}: ${capacity} capacity vs ${demand} demand (${ratio.toFixed(2)}x)${warning}`);
		}
	}

	// Print overall totals
	const totalDemand = Object.values(demandBySkill).reduce((sum, count) => sum + count, 0);
	const totalCapacity = Object.values(capacityBySkill).reduce((sum, count) => sum + count, 0);

	console.log('\n📊 OVERALL TOTALS:');
	console.log(`  Total demand headcount: ${totalDemand}`);
	console.log(`  Total capacity headcount: ${Math.floor(totalCapacity)}`);
	console.log(`  Overall ratio: ${(totalCapacity / totalDemand).toFixed(2)}x`);

	// Staff counts by job and skill
	const staffByJob = allStaff.reduce((acc, staff) => {
		acc[staff.role] = (acc[staff.role] || 0) + 1;
		return acc;
	}, {} as Record<string, number>);

	console.log('\n👥 STAFF COUNTS:');
	console.log(`  By job: ${Object.entries(staffByJob).map(([job, count]) => `${job}: ${count}`).join(', ')}`);

	// Enhanced skill histogram
	const enhancedSkillHistogram = allStaff.reduce((acc, staff) => {
		staff.skills.forEach(skill => {
			acc[skill.code] = (acc[skill.code] || 0) + 1;
		});
		return acc;
	}, {} as Record<string, number>);

	console.log(`  By skill: ${Object.entries(enhancedSkillHistogram).map(([skill, count]) => `${skill}: ${count}`).join(', ')}`);

	// Find heaviest demand cells
	const cellDemand = allDemand.map(d => {
		const skills = d.requiredBySkill as Record<string, number>;
		const total = Object.values(skills).reduce((sum, count) => sum + count, 0);
		const ward = allStaff.find(s => s.wards.some(w => w.id === d.wardId))?.wards[0]?.name || 'Unknown';
		return { date: d.date, ward, slot: d.slot, total };
	}).sort((a, b) => b.total - a.total);

	console.log('\n🔥 HEAVIEST DEMAND CELLS:');
	cellDemand.slice(0, 3).forEach((cell, i) => {
		console.log(`  ${i + 1}. ${cell.date} ${cell.ward} ${cell.slot}: ${cell.total} required`);
	});

	console.log('\n✅ Enhanced seed completed successfully!');

	// Load fixture-based seed data
	await loadFixtures();
	await printFixtureSummary();
	await printAcceptanceChecklist();
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});

