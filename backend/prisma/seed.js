import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting enhanced seed...');
  
  try {
    // 1. Create Trust
    console.log('🏢 Creating Trust...');
    const trust = await prisma.trust.upsert({
      where: { name: 'Gravesham NHS Trust' },
      update: {},
      create: {
        name: 'Gravesham NHS Trust'
      }
    });

    // 2. Create Hospitals
    console.log('🏥 Creating Hospitals...');
    const hospital1 = await prisma.hospital.upsert({
      where: { 
        trustId_name: {
          trustId: trust.id,
          name: 'Darenth Valley Hospital'
        }
      },
      update: {},
      create: {
        name: 'Darenth Valley Hospital',
        trustId: trust.id
      }
    });

    const hospital2 = await prisma.hospital.upsert({
      where: { 
        trustId_name: {
          trustId: trust.id,
          name: 'Queen Mary\'s Hospital'
        }
      },
      update: {},
      create: {
        name: 'Queen Mary\'s Hospital',
        trustId: trust.id
      }
    });

    // 3. Create Wards
    console.log('🏥 Creating Wards...');
    const wards = await Promise.all([
      prisma.ward.create({
        data: {
          name: 'General Medicine',
          hospitalId: hospital1.id,
          hourlyGranularity: false
        }
      }),
      prisma.ward.create({
        data: {
          name: 'Emergency Department',
          hospitalId: hospital1.id,
          hourlyGranularity: false
        }
      }),
      prisma.ward.create({
        data: {
          name: 'Cardiology',
          hospitalId: hospital2.id,
          hourlyGranularity: false
        }
      }),
      prisma.ward.create({
        data: {
          name: 'Intensive Care Unit',
          hospitalId: hospital2.id,
          hourlyGranularity: false
        }
      })
    ]);

    // 4. Create Job Roles
    console.log('👔 Creating Job Roles...');
    const jobRoles = await Promise.all([
      // Trust-level roles
      prisma.jobRole.create({
        data: {
          code: 'CONSULTANT',
          name: 'Consultant',
          scope: 'TRUST',
          trustId: trust.id,
          hospitalId: null
        }
      }),
      prisma.jobRole.create({
        data: {
          code: 'REGISTRAR',
          name: 'Registrar',
          scope: 'TRUST',
          trustId: trust.id,
          hospitalId: null
        }
      }),
      prisma.jobRole.create({
        data: {
          code: 'SHO',
          name: 'Senior House Officer',
          scope: 'TRUST',
          trustId: trust.id,
          hospitalId: null
        }
      }),
      // Hospital 1 roles
      prisma.jobRole.create({
        data: {
          code: 'SENIOR_NURSE_H1',
          name: 'Senior Nurse',
          scope: 'HOSPITAL',
          trustId: null,
          hospitalId: hospital1.id
        }
      }),
      prisma.jobRole.create({
        data: {
          code: 'STAFF_NURSE_H1',
          name: 'Staff Nurse',
          scope: 'HOSPITAL',
          trustId: null,
          hospitalId: hospital1.id
        }
      }),
      prisma.jobRole.create({
        data: {
          code: 'HCA_H1',
          name: 'Healthcare Assistant',
          scope: 'HOSPITAL',
          trustId: null,
          hospitalId: hospital1.id
        }
      }),
      // Hospital 2 roles
      prisma.jobRole.create({
        data: {
          code: 'SENIOR_NURSE_H2',
          name: 'Senior Nurse',
          scope: 'HOSPITAL',
          trustId: null,
          hospitalId: hospital2.id
        }
      }),
      prisma.jobRole.create({
        data: {
          code: 'STAFF_NURSE_H2',
          name: 'Staff Nurse',
          scope: 'HOSPITAL',
          trustId: null,
          hospitalId: hospital2.id
        }
      }),
      prisma.jobRole.create({
        data: {
          code: 'RADIOGRAPHER',
          name: 'Radiographer',
          scope: 'HOSPITAL',
          trustId: null,
          hospitalId: hospital2.id
        }
      }),
      prisma.jobRole.create({
        data: {
          code: 'ICU_SPECIALIST',
          name: 'ICU Specialist',
          scope: 'HOSPITAL',
          trustId: null,
          hospitalId: hospital2.id
        }
      })
    ]);

    // 5. Create Skills
    console.log('🔧 Creating Skills...');
    const skills = await Promise.all([
      prisma.skill.create({ data: { code: 'GeneralCare', name: 'General Care' } }),
      prisma.skill.create({ data: { code: 'Bloods', name: 'Blood Tests' } }),
      prisma.skill.create({ data: { code: 'MRI', name: 'MRI' } }),
      prisma.skill.create({ data: { code: 'XRay', name: 'X-Ray' } }),
      prisma.skill.create({ data: { code: 'ECG', name: 'ECG' } }),
      prisma.skill.create({ data: { code: 'ICUCare', name: 'ICU Care' } }),
      prisma.skill.create({ data: { code: 'EmergencyCare', name: 'Emergency Care' } }),
      prisma.skill.create({ data: { code: 'CardiacCare', name: 'Cardiac Care' } }),
      prisma.skill.create({ data: { code: 'DoctorMRI', name: 'Doctor MRI' } }),
      prisma.skill.create({ data: { code: 'DoctorXRay', name: 'Doctor X-Ray' } })
    ]);

    // 6. Create Shift Types
    console.log('⏰ Creating Shift Types...');
    const shiftTypes = await Promise.all([
      prisma.shiftType.create({
        data: {
          code: 'DAY',
          name: 'Day',
          startTime: '08:00',
          endTime: '16:00',
          durationMinutes: 480,
          isNight: false,
          scope: 'TRUST',
          trustId: trust.id,
          hospitalId: null,
          wardId: null
        }
      }),
      prisma.shiftType.create({
        data: {
          code: 'EVENING',
          name: 'Evening',
          startTime: '16:00',
          endTime: '00:00',
          durationMinutes: 480,
          isNight: false,
          scope: 'TRUST',
          trustId: trust.id,
          hospitalId: null,
          wardId: null
        }
      }),
      prisma.shiftType.create({
        data: {
          code: 'NIGHT',
          name: 'Night',
          startTime: '00:00',
          endTime: '08:00',
          durationMinutes: 480,
          isNight: true,
          scope: 'TRUST',
          trustId: trust.id,
          hospitalId: null,
          wardId: null
        }
      })
    ]);

    // 7. Create Ward Skills
    console.log('🏥 Creating Ward Skills...');
    const wardSkillMappings = [
      // General Medicine - basic care skills
      { wardId: wards[0].id, skillIds: [0, 1, 2, 3] }, // GeneralCare, Bloods, MRI, XRay
      // Emergency Department - emergency and general skills
      { wardId: wards[1].id, skillIds: [0, 1, 4, 6] }, // GeneralCare, Bloods, ECG, EmergencyCare
      // Cardiology - cardiac specific skills
      { wardId: wards[2].id, skillIds: [0, 1, 4, 7] }, // GeneralCare, Bloods, ECG, CardiacCare
      // ICU - intensive care skills
      { wardId: wards[3].id, skillIds: [0, 1, 5, 6] }  // GeneralCare, Bloods, ICUCare, EmergencyCare
    ];

    for (const mapping of wardSkillMappings) {
      for (const skillIndex of mapping.skillIds) {
        await prisma.wardSkill.create({
          data: {
            wardId: mapping.wardId,
            skillId: skills[skillIndex].id
          }
        });
      }
    }

    // 8. Create Staff (20 staff members)
    console.log('👥 Creating 20 Staff members...');
    const staffData = [
      // Consultants (Trust level) - 3 staff
      { firstName: 'John', lastName: 'Smith', prefix: 'Dr', jobRoleIndex: 0, role: 'doctor', wards: [0], skills: [0, 1, 8, 9], hours: 37.5 },
      { firstName: 'Sarah', lastName: 'Johnson', prefix: 'Dr', jobRoleIndex: 0, role: 'doctor', wards: [2], skills: [0, 1, 4, 7], hours: 37.5 },
      { firstName: 'Michael', lastName: 'Brown', prefix: 'Dr', jobRoleIndex: 0, role: 'doctor', wards: [3], skills: [0, 1, 5, 6], hours: 37.5 },
      
      // Registrars (Trust level) - 2 staff
      { firstName: 'Emily', lastName: 'Davis', prefix: 'Dr', jobRoleIndex: 1, role: 'doctor', wards: [0, 1], skills: [0, 1, 6], hours: 37.5 },
      { firstName: 'James', lastName: 'Wilson', prefix: 'Dr', jobRoleIndex: 1, role: 'doctor', wards: [2, 3], skills: [0, 1, 7, 5], hours: 37.5 },
      
      // SHOs (Trust level) - 2 staff
      { firstName: 'Lisa', lastName: 'Anderson', prefix: 'Dr', jobRoleIndex: 2, role: 'doctor', wards: [0], skills: [0, 1], hours: 37.5 },
      { firstName: 'Robert', lastName: 'Thomas', prefix: 'Dr', jobRoleIndex: 2, role: 'doctor', wards: [1], skills: [0, 1, 6], hours: 37.5 },
      
      // Senior Nurses Hospital 1 - 2 staff
      { firstName: 'Jennifer', lastName: 'Jackson', prefix: '', jobRoleIndex: 3, role: 'nurse', wards: [0], skills: [0, 1, 2], hours: 37.5 },
      { firstName: 'Christopher', lastName: 'White', prefix: '', jobRoleIndex: 3, role: 'nurse', wards: [1], skills: [0, 1, 6], hours: 37.5 },
      
      // Staff Nurses Hospital 1 - 3 staff
      { firstName: 'Amanda', lastName: 'Harris', prefix: '', jobRoleIndex: 4, role: 'nurse', wards: [0], skills: [0, 1], hours: 37.5 },
      { firstName: 'Daniel', lastName: 'Martin', prefix: '', jobRoleIndex: 4, role: 'nurse', wards: [0], skills: [0, 1, 2], hours: 30 },
      { firstName: 'Jessica', lastName: 'Thompson', prefix: '', jobRoleIndex: 4, role: 'nurse', wards: [1], skills: [0, 1, 6], hours: 37.5 },
      
      // HCAs Hospital 1 - 2 staff
      { firstName: 'Matthew', lastName: 'Garcia', prefix: '', jobRoleIndex: 5, role: 'nurse', wards: [0], skills: [0], hours: 20 },
      { firstName: 'Ashley', lastName: 'Martinez', prefix: '', jobRoleIndex: 5, role: 'nurse', wards: [1], skills: [0, 6], hours: 30 },
      
      // Senior Nurses Hospital 2 - 2 staff
      { firstName: 'Ryan', lastName: 'Rodriguez', prefix: '', jobRoleIndex: 6, role: 'nurse', wards: [2], skills: [0, 1, 7], hours: 37.5 },
      { firstName: 'Michelle', lastName: 'Lewis', prefix: '', jobRoleIndex: 6, role: 'nurse', wards: [3], skills: [0, 1, 5], hours: 37.5 },
      
      // Staff Nurses Hospital 2 - 2 staff
      { firstName: 'Kevin', lastName: 'Walker', prefix: '', jobRoleIndex: 7, role: 'nurse', wards: [2], skills: [0, 1, 4, 7], hours: 37.5 },
      { firstName: 'Nicole', lastName: 'Hall', prefix: '', jobRoleIndex: 7, role: 'nurse', wards: [3], skills: [0, 1, 5], hours: 30 },
      
      // Radiographer - 1 staff
      { firstName: 'Brian', lastName: 'Allen', prefix: '', jobRoleIndex: 8, role: 'nurse', wards: [2], skills: [2, 3, 8, 9], hours: 37.5 },
      
      // ICU Specialist - 1 staff
      { firstName: 'Stephanie', lastName: 'Young', prefix: '', jobRoleIndex: 9, role: 'nurse', wards: [3], skills: [0, 1, 5, 6], hours: 37.5 }
    ];

    const staff = [];
    for (const staffMember of staffData) {
      const fullName = staffMember.prefix ? 
        `${staffMember.prefix} ${staffMember.firstName} ${staffMember.lastName}` : 
        `${staffMember.firstName} ${staffMember.lastName}`;
      
      const wardConnections = staffMember.wards.map(wardIndex => ({ id: wards[wardIndex].id }));
      const skillConnections = staffMember.skills.map(skillIndex => ({ id: skills[skillIndex].id }));
      
      const createdStaff = await prisma.staff.create({
        data: {
          prefix: staffMember.prefix || null,
          firstName: staffMember.firstName,
          lastName: staffMember.lastName,
          fullName,
          role: staffMember.role,
          contractHoursPerWeek: staffMember.hours,
          active: true,
          jobRoleId: jobRoles[staffMember.jobRoleIndex].id,
          wards: { connect: wardConnections },
          skills: { connect: skillConnections }
        }
      });
      staff.push(createdStaff);
    }

    // 9. Create Schedule (August 2025 - full weeks)
    console.log('📅 Creating Schedule for August 2025...');
    const schedule = await prisma.schedule.create({
      data: {
        wardId: wards[0].id, // General Medicine ward
        horizonStart: new Date('2025-08-01'),
        horizonEnd: new Date('2025-08-31'),
        objective: 'General Medicine - August 2025',
        status: 'draft'
      }
    });

    // 10. Create Ward Policy
    console.log('📋 Creating Policies...');
    const wardPolicy = await prisma.policy.create({
      data: {
        scope: 'WARD',
        trustId: null,
        hospitalId: null,
        wardId: wards[0].id, // General Medicine ward
        weights: {
          unmet: 1000000,
          overtime: 6000,
          fairness: 200,
          prefs: 5,
          substitutes: 30000,
          flex: 3000
        },
        limits: {
          maxOvertimePerWeekMinutes: 240,
          maxFlexShiftsPerWeek: 3
        },
        toggles: {
          enableWardFlex: true,
          enableSubstitution: true
        },
        substitution: {
          GeneralCare: ["GeneralCare"],
          Bloods: ["Bloods", "GeneralCare"],
          MRI: ["MRI", "DoctorMRI"],
          XRay: ["XRay", "DoctorXRay"]
        },
        timeBudgetMs: 30000,
        label: "General Medicine Ward Policy",
        isActive: true,
        rules: [
          { type: 'MIN_REST_HOURS', kind: 'HARD', params: { hours: 11 }, weight: null },
          { type: 'MAX_CONSEC_NIGHTS', kind: 'SOFT', params: { maxNights: 3 }, weight: 100 },
          { type: 'ONE_SHIFT_PER_DAY', kind: 'HARD', params: {}, weight: null },
          { type: 'WEEKLY_CONTRACT_LIMITS', kind: 'SOFT', params: {}, weight: 50 },
          { type: 'WEEKEND_FAIRNESS', kind: 'SOFT', params: {}, weight: 75 }
        ]
      }
    });

    // 11. Create Demand for August 2025 (all wards)
    console.log('📊 Creating Demand for August 2025...');
    const demandRecords = [];
    const horizonStart = new Date('2025-08-01');
    const daysInAugust = 31;
    
    // Define demand patterns for each ward
    const wardDemandPatterns = [
      // General Medicine (ward 0)
      {
        wardId: wards[0].id,
        patterns: {
          DAY: { GeneralCare: 4, Bloods: 2, MRI: 1, XRay: 1 },
          EVENING: { GeneralCare: 3, Bloods: 1, XRay: 1 },
          NIGHT: { GeneralCare: 2, Bloods: 1 }
        }
      },
      // Emergency Department (ward 1)
      {
        wardId: wards[1].id,
        patterns: {
          DAY: { GeneralCare: 5, Bloods: 2, ECG: 2, EmergencyCare: 3 },
          EVENING: { GeneralCare: 4, Bloods: 1, ECG: 1, EmergencyCare: 2 },
          NIGHT: { GeneralCare: 3, EmergencyCare: 2 }
        }
      },
      // Cardiology (ward 2)
      {
        wardId: wards[2].id,
        patterns: {
          DAY: { GeneralCare: 3, Bloods: 1, ECG: 2, CardiacCare: 2 },
          EVENING: { GeneralCare: 2, ECG: 1, CardiacCare: 1 },
          NIGHT: { GeneralCare: 1, CardiacCare: 1 }
        }
      },
      // ICU (ward 3)
      {
        wardId: wards[3].id,
        patterns: {
          DAY: { GeneralCare: 4, Bloods: 2, ICUCare: 3, EmergencyCare: 1 },
          EVENING: { GeneralCare: 3, Bloods: 1, ICUCare: 2, EmergencyCare: 1 },
          NIGHT: { GeneralCare: 3, ICUCare: 2 }
        }
      }
    ];
    
    for (let day = 0; day < daysInAugust; day++) {
      const date = new Date(horizonStart);
      date.setDate(date.getDate() + day);
      
      // Check if it's a weekend
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const weekendFactor = isWeekend ? 0.7 : 1.0;
      
      // Create demand for each ward and shift
      const shifts = ['DAY', 'EVENING', 'NIGHT'];
      
      for (const wardPattern of wardDemandPatterns) {
        for (const slot of shifts) {
          const baseRequirements = wardPattern.patterns[slot];
          const requirements = {};
          
          // Apply weekend factor to all requirements
          for (const [skill, count] of Object.entries(baseRequirements)) {
            const adjustedCount = Math.floor(count * weekendFactor);
            if (adjustedCount > 0) {
              requirements[skill] = adjustedCount;
            }
          }
          
          // Only create demand if there are requirements
          if (Object.keys(requirements).length > 0) {
            demandRecords.push({
              wardId: wardPattern.wardId,
              date,
              granularity: 'shift',
              slot,
              requiredBySkill: requirements
            });
          }
        }
      }
    }

    // Create demand records in batches
    console.log(`Creating ${demandRecords.length} demand records...`);
    const batchSize = 50;
    for (let i = 0; i < demandRecords.length; i += batchSize) {
      const batch = demandRecords.slice(i, i + batchSize);
      await Promise.all(
        batch.map(demand => prisma.demand.create({ data: demand }))
      );
    }

    // 12. Print Summary
    console.log('\n📊 ENHANCED SEED SUMMARY');
    console.log('=' .repeat(60));
    console.log(`🏢 Trust: ${trust.name}`);
    console.log(`🏥 Hospitals: ${hospital1.name}, ${hospital2.name}`);
    console.log(`🏥 Wards: ${wards.map(w => w.name).join(', ')}`);
    console.log(`👔 Job Roles: ${jobRoles.length} (Trust and Hospital scoped)`);
    console.log(`🔧 Skills: ${skills.length} (${skills.map(s => s.code).join(', ')})`);
    console.log(`⏰ Shift Types: ${shiftTypes.length} (Day, Evening, Night)`);
    console.log(`👥 Staff: ${staff.length} across all wards`);
    console.log(`📋 Policies: 1 (Ward Policy for General Medicine)`);
    console.log(`📅 Schedule: ${schedule.objective}`);
    console.log(`📊 Demand: ${demandRecords.length} records (August 2025)`);

    // Staff breakdown by job role
    console.log('\n👥 STAFF BREAKDOWN:');
    const staffByJobRole = {};
    for (let i = 0; i < staff.length; i++) {
      const jobRole = jobRoles.find(jr => jr.id === staff[i].jobRoleId);
      const roleName = jobRole ? jobRole.name : 'Unknown';
      staffByJobRole[roleName] = (staffByJobRole[roleName] || 0) + 1;
    }
    Object.entries(staffByJobRole).forEach(([role, count]) => {
      console.log(`  ${role}: ${count}`);
    });

    // Ward breakdown
    console.log('\n🏥 WARD BREAKDOWN:');
    wards.forEach((ward, index) => {
      const hospital = index < 2 ? hospital1 : hospital2;
      console.log(`  ${ward.name} (${hospital.name})`);
    });

    // Demand analysis
    const totalRequired = demandRecords.reduce((sum, d) => {
      const skills = d.requiredBySkill;
      return sum + Object.values(skills).reduce((s, v) => s + v, 0);
    }, 0);

    console.log(`\n📈 Total Required Headcount: ${totalRequired} across August 2025`);

    // Capacity analysis (August = ~4.3 weeks)
    const weeksInAugust = 31 / 7;
    const totalStaffMinutes = staff.reduce((sum, s) => sum + (s.contractHoursPerWeek * 60 * weeksInAugust), 0);
    const totalDemandMinutes = totalRequired * 480; // 8 hours per shift

    console.log(`⚖️ Capacity vs Demand:`);
    console.log(`  Total staff minutes (August): ${Math.round(totalStaffMinutes)}`);
    console.log(`  Total demand minutes: ${totalDemandMinutes}`);
    console.log(`  Ratio: ${(totalStaffMinutes / totalDemandMinutes).toFixed(2)}x`);

    if (totalStaffMinutes >= totalDemandMinutes) {
      console.log(`  ✅ Sufficient capacity`);
    } else {
      console.log(`  ⚠️ Insufficient capacity - may need more staff`);
    }

    console.log('=' .repeat(60));
    console.log('\n✅ Enhanced seed completed successfully!');
    console.log('🎯 Ready for solver testing with:');
    console.log(`   - ${staff.length} staff members across 4 wards`);
    console.log(`   - ${demandRecords.length} demand records for August 2025`);
    console.log(`   - ${wardPolicy.rules?.length || 0} rules in ward policy`);
    console.log(`   - Schedule: ${schedule.objective}`);
    console.log(`   - Full organizational hierarchy: 1 Trust → 2 Hospitals → 4 Wards`);
    
  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
