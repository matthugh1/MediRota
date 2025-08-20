import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');
  
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

    // 2. Create Hospital
    console.log('🏥 Creating Hospital...');
    const hospital = await prisma.hospital.upsert({
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

    // 3. Create Ward
    console.log('🏥 Creating Ward...');
    const ward = await prisma.ward.create({
      data: {
        name: 'General Medicine',
        hospitalId: hospital.id,
        hourlyGranularity: false
      }
    });

    // 4. Create Job Roles
    console.log('👔 Creating Job Roles...');
    const consultantRole = await prisma.jobRole.create({
      data: {
        code: 'CONSULTANT',
        name: 'Consultant',
        scope: 'TRUST',
        trustId: trust.id,
        hospitalId: null
      }
    });

    const nurseRole = await prisma.jobRole.create({
      data: {
        code: 'STAFF_NURSE',
        name: 'Staff Nurse',
        scope: 'HOSPITAL',
        trustId: null,
        hospitalId: hospital.id
      }
    });

    // 5. Create Skills
    console.log('🔧 Creating Skills...');
    const generalCareSkill = await prisma.skill.create({ 
      data: { code: 'GeneralCare', name: 'General Care' } 
    });

    const bloodsSkill = await prisma.skill.create({ 
      data: { code: 'Bloods', name: 'Blood Tests' } 
    });

    // 6. Create Shift Types
    console.log('⏰ Creating Shift Types...');
    const dayShift = await prisma.shiftType.create({
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
    });

    const eveningShift = await prisma.shiftType.create({
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
    });

    const nightShift = await prisma.shiftType.create({
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
    });

    // 7. Create Ward Skills
    console.log('🏥 Creating Ward Skills...');
    await prisma.wardSkill.create({
      data: {
        wardId: ward.id,
        skillId: generalCareSkill.id
      }
    });

    await prisma.wardSkill.create({
      data: {
        wardId: ward.id,
        skillId: bloodsSkill.id
      }
    });

    // 8. Create Staff
    console.log('👥 Creating Staff...');
    const staff = await Promise.all([
      prisma.staff.create({
        data: {
          prefix: 'Dr',
          firstName: 'John',
          lastName: 'Smith',
          fullName: 'Dr John Smith',
          role: 'doctor',
          contractHoursPerWeek: 37.5,
          active: true,
          jobRoleId: consultantRole.id,
          wards: { connect: [{ id: ward.id }] },
          skills: { connect: [{ id: generalCareSkill.id }] }
        }
      }),
      prisma.staff.create({
        data: {
          prefix: '',
          firstName: 'Lisa',
          lastName: 'Wilson',
          fullName: 'Lisa Wilson',
          role: 'nurse',
          contractHoursPerWeek: 37.5,
          active: true,
          jobRoleId: nurseRole.id,
          wards: { connect: [{ id: ward.id }] },
          skills: { connect: [{ id: generalCareSkill.id }, { id: bloodsSkill.id }] }
        }
      }),
      prisma.staff.create({
        data: {
          prefix: '',
          firstName: 'David',
          lastName: 'Taylor',
          fullName: 'David Taylor',
          role: 'nurse',
          contractHoursPerWeek: 30,
          active: true,
          jobRoleId: nurseRole.id,
          wards: { connect: [{ id: ward.id }] },
          skills: { connect: [{ id: generalCareSkill.id }] }
        }
      })
    ]);

    // 9. Create Schedule
    console.log('📅 Creating Schedule...');
    const schedule = await prisma.schedule.create({
      data: {
        wardId: ward.id,
        horizonStart: new Date('2025-01-01'),
        horizonEnd: new Date('2025-01-14'),
        objective: 'General Medicine - 14 days',
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
        wardId: ward.id,
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
          Bloods: ["Bloods", "GeneralCare"]
        },
        timeBudgetMs: 30000,
        label: "Ward Policy",
        isActive: true,
        rules: [
          { type: 'MIN_REST_HOURS', kind: 'HARD', params: { hours: 11 }, weight: null },
          { type: 'MAX_CONSEC_NIGHTS', kind: 'SOFT', params: { maxNights: 3 }, weight: 100 },
          { type: 'ONE_SHIFT_PER_DAY', kind: 'HARD', params: {}, weight: null }
        ]
      }
    });

    // 11. Create Demand
    console.log('📊 Creating Demand...');
    const demandRecords = [];
    const horizonStart = new Date('2025-01-01');
    
    for (let day = 0; day < 14; day++) {
      const date = new Date(horizonStart);
      date.setDate(date.getDate() + day);
      
      // Check if it's a weekend
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const weekendFactor = isWeekend ? 0.6 : 1;
      
      // Create demand for each shift
      const shifts = ['DAY', 'EVENING', 'NIGHT'];
      for (const slot of shifts) {
        let requirements = {};
        
        if (slot === 'DAY') {
          requirements = {
            'GeneralCare': Math.floor(2 * weekendFactor),
            'Bloods': Math.floor(1 * weekendFactor)
          };
        } else if (slot === 'EVENING') {
          requirements = {
            'GeneralCare': Math.floor(1 * weekendFactor),
            'Bloods': Math.floor(1 * weekendFactor)
          };
        } else if (slot === 'NIGHT') {
          requirements = {
            'GeneralCare': Math.floor(1 * weekendFactor)
          };
        }
        
        // Only create demand if there are requirements
        if (Object.values(requirements).some(count => count > 0)) {
          demandRecords.push({
            wardId: ward.id,
            date,
            granularity: 'shift',
            slot,
            requiredBySkill: requirements
          });
        }
      }
    }

    // Create demand records
    await Promise.all(
      demandRecords.map(demand =>
        prisma.demand.create({ data: demand })
      )
    );

    // 12. Print Summary
    console.log('\n📊 SEED SUMMARY');
    console.log('=' .repeat(60));
    console.log(`🏢 Trust: ${trust.name}`);
    console.log(`🏥 Hospital: ${hospital.name}`);
    console.log(`🏥 Ward: ${ward.name}`);
    console.log(`👔 Job Roles: 2 (Consultant, Staff Nurse)`);
    console.log(`🔧 Skills: 2 (General Care, Blood Tests)`);
    console.log(`⏰ Shift Types: 3 (Day, Evening, Night)`);
    console.log(`👥 Staff: ${staff.length}`);
    console.log(`📋 Policies: 1 (Ward)`);
    console.log(`📅 Schedule: ${schedule.objective}`);
    console.log(`📊 Demand: ${demandRecords.length} records`);

    // Demand analysis
    const totalRequired = demandRecords.reduce((sum, d) => {
      const skills = d.requiredBySkill;
      return sum + Object.values(skills).reduce((s, v) => s + v, 0);
    }, 0);

    console.log(`\n📈 Total Required Headcount: ${totalRequired} across 14 days`);

    // Capacity analysis
    const totalStaffMinutes = staff.reduce((sum, s) => sum + (s.contractHoursPerWeek * 60 * 2), 0);
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

    console.log('=' .repeat(60));
    console.log('\n✅ Seed completed successfully!');
    console.log('🎯 Ready for solver testing with:');
    console.log(`   - ${staff.length} staff members`);
    console.log(`   - ${demandRecords.length} demand records`);
    console.log(`   - ${wardPolicy.rules?.length || 0} rules in ward policy`);
    console.log(`   - Schedule: ${schedule.objective}`);
    
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
