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
    const jobRoles = await Promise.all([
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
      prisma.jobRole.create({
        data: {
          code: 'SENIOR_NURSE',
          name: 'Senior Nurse',
          scope: 'HOSPITAL',
          trustId: null,
          hospitalId: hospital.id
        }
      }),
      prisma.jobRole.create({
        data: {
          code: 'STAFF_NURSE',
          name: 'Staff Nurse',
          scope: 'HOSPITAL',
          trustId: null,
          hospitalId: hospital.id
        }
      }),
      prisma.jobRole.create({
        data: {
          code: 'HCA',
          name: 'Healthcare Assistant',
          scope: 'HOSPITAL',
          trustId: null,
          hospitalId: hospital.id
        }
      }),
      prisma.jobRole.create({
        data: {
          code: 'RADIOGRAPHER',
          name: 'Radiographer',
          scope: 'HOSPITAL',
          trustId: null,
          hospitalId: hospital.id
        }
      })
    ]);

    // 5. Create Skills
    console.log('🔧 Creating Skills...');
    const skills = await Promise.all([
      prisma.skill.create({ data: { code: 'MRI', name: 'MRI' } }),
      prisma.skill.create({ data: { code: 'XRay', name: 'X-Ray' } }),
      prisma.skill.create({ data: { code: 'Bloods', name: 'Blood Tests' } }),
      prisma.skill.create({ data: { code: 'GeneralCare', name: 'General Care' } }),
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
    await Promise.all(
      skills.map(skill =>
        prisma.wardSkill.create({
          data: {
            wardId: ward.id,
            skillId: skill.id
          }
        })
      )
    );

    // 8. Create Staff
    console.log('👥 Creating Staff...');
    const staff = await Promise.all([
      // Doctors (3)
      prisma.staff.create({
        data: {
          prefix: 'Dr',
          firstName: 'John',
          lastName: 'Smith',
          fullName: 'Dr John Smith',
          role: 'doctor',
          contractHoursPerWeek: 37.5,
          active: true,
          jobRoleId: jobRoles[0].id, // CONSULTANT
          wards: { connect: [{ id: ward.id }] },
          skills: { connect: [{ id: skills[4].id }, { id: skills[5].id }] } // DoctorMRI, DoctorXRay
        }
      }),
      prisma.staff.create({
        data: {
          prefix: 'Dr',
          firstName: 'Sarah',
          lastName: 'Johnson',
          fullName: 'Dr Sarah Johnson',
          role: 'doctor',
          contractHoursPerWeek: 37.5,
          active: true,
          jobRoleId: jobRoles[1].id, // REGISTRAR
          wards: { connect: [{ id: ward.id }] },
          skills: { connect: [{ id: skills[4].id }, { id: skills[5].id }] } // DoctorMRI, DoctorXRay
        }
      }),
      prisma.staff.create({
        data: {
          prefix: 'Dr',
          firstName: 'Michael',
          lastName: 'Brown',
          fullName: 'Dr Michael Brown',
          role: 'doctor',
          contractHoursPerWeek: 37.5,
          active: true,
          jobRoleId: jobRoles[2].id, // SHO
          wards: { connect: [{ id: ward.id }] },
          skills: { connect: [{ id: skills[5].id }] } // DoctorXRay
        }
      }),
      prisma.staff.create({
        data: {
          prefix: 'Dr',
          firstName: 'Emily',
          lastName: 'Davis',
          fullName: 'Dr Emily Davis',
          role: 'doctor',
          contractHoursPerWeek: 40,
          active: true,
          jobRoleId: jobRoles[0].id, // CONSULTANT
          wards: { connect: [{ id: ward.id }] },
          skills: { connect: [{ id: skills[4].id }] } // DoctorMRI
        }
      }),
      prisma.staff.create({
        data: {
          prefix: 'Dr',
          firstName: 'Robert',
          lastName: 'Wilson',
          fullName: 'Dr Robert Wilson',
          role: 'doctor',
          contractHoursPerWeek: 35,
          active: true,
          jobRoleId: jobRoles[1].id, // REGISTRAR
          wards: { connect: [{ id: ward.id }] },
          skills: { connect: [{ id: skills[5].id }] } // DoctorXRay
        }
      }),
      // Nurses (8)
      prisma.staff.create({
        data: {
          prefix: '',
          firstName: 'Lisa',
          lastName: 'Wilson',
          fullName: 'Lisa Wilson',
          role: 'nurse',
          contractHoursPerWeek: 37.5,
          active: true,
          jobRoleId: jobRoles[3].id, // SENIOR_NURSE
          wards: { connect: [{ id: ward.id }] },
          skills: { connect: [{ id: skills[3].id }, { id: skills[2].id }] } // GeneralCare, Bloods
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
          jobRoleId: jobRoles[4].id, // STAFF_NURSE
          wards: { connect: [{ id: ward.id }] },
          skills: { connect: [{ id: skills[3].id }] } // GeneralCare
        }
      }),
      prisma.staff.create({
        data: {
          prefix: '',
          firstName: 'Anna',
          lastName: 'Anderson',
          fullName: 'Anna Anderson',
          role: 'nurse',
          contractHoursPerWeek: 37.5,
          active: true,
          jobRoleId: jobRoles[4].id, // STAFF_NURSE
          wards: { connect: [{ id: ward.id }] },
          skills: { connect: [{ id: skills[3].id }, { id: skills[2].id }] } // GeneralCare, Bloods
        }
      }),
      prisma.staff.create({
        data: {
          prefix: '',
          firstName: 'Jennifer',
          lastName: 'Clark',
          fullName: 'Jennifer Clark',
          role: 'nurse',
          contractHoursPerWeek: 37.5,
          active: true,
          jobRoleId: jobRoles[3].id, // SENIOR_NURSE
          wards: { connect: [{ id: ward.id }] },
          skills: { connect: [{ id: skills[3].id }] } // GeneralCare
        }
      }),
      prisma.staff.create({
        data: {
          prefix: '',
          firstName: 'Christopher',
          lastName: 'Lee',
          fullName: 'Christopher Lee',
          role: 'nurse',
          contractHoursPerWeek: 30,
          active: true,
          jobRoleId: jobRoles[4].id, // STAFF_NURSE
          wards: { connect: [{ id: ward.id }] },
          skills: { connect: [{ id: skills[3].id }, { id: skills[2].id }] } // GeneralCare, Bloods
        }
      }),
      prisma.staff.create({
        data: {
          prefix: '',
          firstName: 'Michelle',
          lastName: 'White',
          fullName: 'Michelle White',
          role: 'nurse',
          contractHoursPerWeek: 25,
          active: true,
          jobRoleId: jobRoles[4].id, // STAFF_NURSE
          wards: { connect: [{ id: ward.id }] },
          skills: { connect: [{ id: skills[3].id }] } // GeneralCare
        }
      }),
      prisma.staff.create({
        data: {
          prefix: '',
          firstName: 'Thomas',
          lastName: 'Hall',
          fullName: 'Thomas Hall',
          role: 'nurse',
          contractHoursPerWeek: 37.5,
          active: true,
          jobRoleId: jobRoles[4].id, // STAFF_NURSE
          wards: { connect: [{ id: ward.id }] },
          skills: { connect: [{ id: skills[3].id }] } // GeneralCare
        }
      }),
      prisma.staff.create({
        data: {
          prefix: '',
          firstName: 'Jessica',
          lastName: 'Young',
          fullName: 'Jessica Young',
          role: 'nurse',
          contractHoursPerWeek: 30,
          active: true,
          jobRoleId: jobRoles[4].id, // STAFF_NURSE
          wards: { connect: [{ id: ward.id }] },
          skills: { connect: [{ id: skills[3].id }, { id: skills[2].id }] } // GeneralCare, Bloods
        }
      }),
      // Radiographers (4)
      prisma.staff.create({
        data: {
          prefix: '',
          firstName: 'Amanda',
          lastName: 'Harris',
          fullName: 'Amanda Harris',
          role: 'nurse',
          contractHoursPerWeek: 37.5,
          active: true,
          jobRoleId: jobRoles[6].id, // RADIOGRAPHER
          wards: { connect: [{ id: ward.id }] },
          skills: { connect: [{ id: skills[0].id }, { id: skills[1].id }] } // MRI, XRay
        }
      }),
      prisma.staff.create({
        data: {
          prefix: '',
          firstName: 'Daniel',
          lastName: 'Martin',
          fullName: 'Daniel Martin',
          role: 'nurse',
          contractHoursPerWeek: 30,
          active: true,
          jobRoleId: jobRoles[6].id, // RADIOGRAPHER
          wards: { connect: [{ id: ward.id }] },
          skills: { connect: [{ id: skills[1].id }] } // XRay
        }
      }),
      prisma.staff.create({
        data: {
          prefix: '',
          firstName: 'Rachel',
          lastName: 'Thompson',
          fullName: 'Rachel Thompson',
          role: 'nurse',
          contractHoursPerWeek: 35,
          active: true,
          jobRoleId: jobRoles[6].id, // RADIOGRAPHER
          wards: { connect: [{ id: ward.id }] },
          skills: { connect: [{ id: skills[0].id }] } // MRI
        }
      }),
      prisma.staff.create({
        data: {
          prefix: '',
          firstName: 'Kevin',
          lastName: 'Moore',
          fullName: 'Kevin Moore',
          role: 'nurse',
          contractHoursPerWeek: 25,
          active: true,
          jobRoleId: jobRoles[6].id, // RADIOGRAPHER
          wards: { connect: [{ id: ward.id }] },
          skills: { connect: [{ id: skills[0].id }, { id: skills[1].id }] } // MRI, XRay
        }
      }),
      // Healthcare Assistants (5)
      prisma.staff.create({
        data: {
          prefix: '',
          firstName: 'Matthew',
          lastName: 'Garcia',
          fullName: 'Matthew Garcia',
          role: 'nurse',
          contractHoursPerWeek: 20,
          active: true,
          jobRoleId: jobRoles[5].id, // HCA
          wards: { connect: [{ id: ward.id }] },
          skills: { connect: [{ id: skills[3].id }] } // GeneralCare
        }
      }),
      prisma.staff.create({
        data: {
          prefix: '',
          firstName: 'Ashley',
          lastName: 'Martinez',
          fullName: 'Ashley Martinez',
          role: 'nurse',
          contractHoursPerWeek: 30,
          active: true,
          jobRoleId: jobRoles[5].id, // HCA
          wards: { connect: [{ id: ward.id }] },
          skills: { connect: [{ id: skills[3].id }] } // GeneralCare
        }
      }),
      prisma.staff.create({
        data: {
          prefix: '',
          firstName: 'Ryan',
          lastName: 'Johnson',
          fullName: 'Ryan Johnson',
          role: 'nurse',
          contractHoursPerWeek: 20,
          active: true,
          jobRoleId: jobRoles[5].id, // HCA
          wards: { connect: [{ id: ward.id }] },
          skills: { connect: [{ id: skills[3].id }] } // GeneralCare
        }
      }),
      prisma.staff.create({
        data: {
          prefix: '',
          firstName: 'Nicole',
          lastName: 'Davis',
          fullName: 'Nicole Davis',
          role: 'nurse',
          contractHoursPerWeek: 25,
          active: true,
          jobRoleId: jobRoles[5].id, // HCA
          wards: { connect: [{ id: ward.id }] },
          skills: { connect: [{ id: skills[3].id }] } // GeneralCare
        }
      }),
      prisma.staff.create({
        data: {
          prefix: '',
          firstName: 'Steven',
          lastName: 'Miller',
          fullName: 'Steven Miller',
          role: 'nurse',
          contractHoursPerWeek: 20,
          active: true,
          jobRoleId: jobRoles[5].id, // HCA
          wards: { connect: [{ id: ward.id }] },
          skills: { connect: [{ id: skills[3].id }] } // GeneralCare
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

    // 10. Create Policies
    console.log('📋 Creating Policies...');
    const trustPolicy = await prisma.policy.create({
      data: {
        scope: 'TRUST',
        trustId: trust.id,
        hospitalId: null,
        wardId: null,
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
        label: "Trust Policy",
        isActive: true,
        rules: []
      }
    });

    const hospitalPolicy = await prisma.policy.create({
      data: {
        scope: 'HOSPITAL',
        trustId: null,
        hospitalId: hospital.id,
        wardId: null,
        weights: {
          unmet: 1000000,
          overtime: 8000,
          fairness: 150,
          prefs: 2,
          substitutes: 40000,
          flex: 4000
        },
        limits: {
          maxOvertimePerWeekMinutes: 360,
          maxFlexShiftsPerWeek: 2
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
        timeBudgetMs: 45000,
        label: "Hospital Policy",
        isActive: true,
        rules: []
      }
    });

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
          MRI: ["MRI", "DoctorMRI"],
          XRay: ["XRay", "DoctorXRay"],
          Bloods: ["Bloods", "GeneralCare"]
        },
        timeBudgetMs: 30000,
        label: "Ward Policy",
        isActive: true,
        rules: [
          { type: 'MIN_REST_HOURS', kind: 'HARD', params: { hours: 11 }, weight: null },
          { type: 'MAX_CONSEC_NIGHTS', kind: 'SOFT', params: { maxNights: 3 }, weight: 100 },
          { type: 'ONE_SHIFT_PER_DAY', kind: 'HARD', params: {}, weight: null },
          { type: 'WEEKLY_CONTRACT_LIMITS', kind: 'SOFT', params: {}, weight: 50 },
          { type: 'WEEKEND_FAIRNESS', kind: 'SOFT', params: {}, weight: 75 },
          { type: 'PREFERENCES', kind: 'SOFT', params: {}, weight: 25 }
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
        let requirements: Record<string, number> = {};
        
        if (slot === 'DAY') {
          requirements = {
            'GeneralCare': Math.floor(3 * weekendFactor),
            'Bloods': Math.floor(1 * weekendFactor),
            'XRay': Math.floor(1 * weekendFactor),
            'DoctorXRay': Math.floor(1 * weekendFactor)
          };
        } else if (slot === 'EVENING') {
          requirements = {
            'GeneralCare': Math.floor(2 * weekendFactor),
            'Bloods': Math.floor(1 * weekendFactor),
            'XRay': Math.floor(1 * weekendFactor),
            'DoctorXRay': Math.floor(1 * weekendFactor)
          };
        } else if (slot === 'NIGHT') {
          requirements = {
            'GeneralCare': Math.floor(2 * weekendFactor),
            'Bloods': Math.floor(1 * weekendFactor),
            'MRI': Math.floor(1 * weekendFactor),
            'DoctorMRI': Math.floor(1 * weekendFactor)
          };
        }
        
        // Only create demand if there are requirements
        if (Object.values(requirements).some(count => count > 0)) {
                  demandRecords.push({
          wardId: ward.id,
          date,
          granularity: 'shift' as const,
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
    console.log(`👔 Job Roles: ${jobRoles.length}`);
    console.log(`🔧 Skills: ${skills.length}`);
    console.log(`⏰ Shift Types: ${shiftTypes.length}`);
    console.log(`👥 Staff: ${staff.length}`);
    console.log(`📋 Policies: 3 (Trust, Hospital, Ward)`);
    console.log(`📅 Schedule: ${schedule.objective}`);
    console.log(`📊 Demand: ${demandRecords.length} records`);

    // Staff breakdown
    console.log('\n👥 STAFF BREAKDOWN:');
    const jobRoleCounts = staff.reduce((acc, s) => {
      const jobRole = jobRoles.find(jr => jr.id === s.jobRoleId);
      const roleName = jobRole ? jobRole.name : 'Unknown';
      acc[roleName] = (acc[roleName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(jobRoleCounts).forEach(([role, count]) => {
      console.log(`  ${role}: ${count}`);
    });

    // Skills breakdown
    console.log('\n🔧 SKILLS BREAKDOWN:');
    const skillCounts = staff.reduce((acc, s) => {
      // This would need to be fetched with includes, but for now just show skills
      return acc;
    }, {} as Record<string, number>);

    skills.forEach(skill => {
      console.log(`  ${skill.name}: ${skill.code}`);
    });

    // Demand analysis
    const totalRequired = demandRecords.reduce((sum, d) => {
      const skills = d.requiredBySkill as Record<string, number>;
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
    console.log(`   - ${Array.isArray(wardPolicy.rules) ? wardPolicy.rules.length : 0} rules in ward policy`);
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

