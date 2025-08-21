#!/usr/bin/env node

/**
 * MediRota Production Seed Script
 * 
 * Creates comprehensive test data for production testing:
 * - 1 Trust
 * - 2 Hospitals
 * - 4 Wards (2 per hospital)
 * - 20 Staff members
 * - Suitable job roles for each hospital
 * - Suitable shift types
 * - 1 comprehensive policy
 * - Demand for each ward for the whole of August
 * 
 * Usage:
 *   node prisma/production_seed.js
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Production Seed...');
  
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
          name: 'Gravesend Community Hospital'
        }
      },
      update: {},
      create: {
        name: 'Gravesend Community Hospital',
        trustId: trust.id
      }
    });

    // 3. Create Wards (2 per hospital)
    console.log('🏥 Creating Wards...');
    const wards = await Promise.all([
      // Hospital 1 Wards
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
      // Hospital 2 Wards
      prisma.ward.create({
        data: {
          name: 'Rehabilitation Unit',
          hospitalId: hospital2.id,
          hourlyGranularity: false
        }
      }),
      prisma.ward.create({
        data: {
          name: 'Outpatient Clinic',
          hospitalId: hospital2.id,
          hourlyGranularity: false
        }
      })
    ]);

    // 4. Create Skills
    console.log('🔧 Creating Skills...');
    const skills = await Promise.all([
      prisma.skill.create({
        data: {
          code: 'MRI',
          name: 'MRI Scanning'
        }
      }),
      prisma.skill.create({
        data: {
          code: 'XRAY',
          name: 'X-Ray Imaging'
        }
      }),
      prisma.skill.create({
        data: {
          code: 'BLOOD',
          name: 'Blood Taking'
        }
      }),
      prisma.skill.create({
        data: {
          code: 'GENERAL',
          name: 'General Care'
        }
      }),
      prisma.skill.create({
        data: {
          code: 'DOCTOR_MRI',
          name: 'Doctor MRI'
        }
      }),
      prisma.skill.create({
        data: {
          code: 'DOCTOR_XRAY',
          name: 'Doctor X-Ray'
        }
      }),
      prisma.skill.create({
        data: {
          code: 'PHYSIO',
          name: 'Physiotherapy'
        }
      }),
      prisma.skill.create({
        data: {
          code: 'OCCUPATIONAL',
          name: 'Occupational Therapy'
        }
      })
    ]);

    // Create Ward-Skill relationships
    console.log('🔗 Creating Ward-Skill relationships...');
    await Promise.all([
      // MRI and XRay for Hospital 1 wards
      prisma.wardSkill.create({
        data: {
          wardId: wards[0].id,
          skillId: skills[0].id // MRI
        }
      }),
      prisma.wardSkill.create({
        data: {
          wardId: wards[0].id,
          skillId: skills[1].id // XRay
        }
      }),
      prisma.wardSkill.create({
        data: {
          wardId: wards[1].id,
          skillId: skills[0].id // MRI
        }
      }),
      prisma.wardSkill.create({
        data: {
          wardId: wards[1].id,
          skillId: skills[1].id // XRay
        }
      }),
      // Blood and General for all wards
      prisma.wardSkill.create({
        data: {
          wardId: wards[0].id,
          skillId: skills[2].id // Blood
        }
      }),
      prisma.wardSkill.create({
        data: {
          wardId: wards[0].id,
          skillId: skills[3].id // General
        }
      }),
      prisma.wardSkill.create({
        data: {
          wardId: wards[1].id,
          skillId: skills[2].id // Blood
        }
      }),
      prisma.wardSkill.create({
        data: {
          wardId: wards[1].id,
          skillId: skills[3].id // General
        }
      }),
      prisma.wardSkill.create({
        data: {
          wardId: wards[2].id,
          skillId: skills[2].id // Blood
        }
      }),
      prisma.wardSkill.create({
        data: {
          wardId: wards[2].id,
          skillId: skills[3].id // General
        }
      }),
      prisma.wardSkill.create({
        data: {
          wardId: wards[3].id,
          skillId: skills[2].id // Blood
        }
      }),
      prisma.wardSkill.create({
        data: {
          wardId: wards[3].id,
          skillId: skills[3].id // General
        }
      }),
      // Doctor skills for Hospital 1 wards
      prisma.wardSkill.create({
        data: {
          wardId: wards[0].id,
          skillId: skills[4].id // Doctor MRI
        }
      }),
      prisma.wardSkill.create({
        data: {
          wardId: wards[0].id,
          skillId: skills[5].id // Doctor XRay
        }
      }),
      prisma.wardSkill.create({
        data: {
          wardId: wards[1].id,
          skillId: skills[4].id // Doctor MRI
        }
      }),
      prisma.wardSkill.create({
        data: {
          wardId: wards[1].id,
          skillId: skills[5].id // Doctor XRay
        }
      }),
      // Therapy skills for Hospital 2 Rehabilitation ward
      prisma.wardSkill.create({
        data: {
          wardId: wards[2].id,
          skillId: skills[6].id // Physio
        }
      }),
      prisma.wardSkill.create({
        data: {
          wardId: wards[2].id,
          skillId: skills[7].id // Occupational
        }
      })
    ]);

    // 5. Create Job Roles (Trust-wide and Hospital-specific)
    console.log('👔 Creating Job Roles...');
    const jobRoles = await Promise.all([
      // Trust-wide roles
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
          code: 'RADIOGRAPHER_H1',
          name: 'Radiographer',
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
          code: 'PHYSIOTHERAPIST_H2',
          name: 'Physiotherapist',
          scope: 'HOSPITAL',
          trustId: null,
          hospitalId: hospital2.id
        }
      }),
      prisma.jobRole.create({
        data: {
          code: 'OCCUPATIONAL_THERAPIST_H2',
          name: 'Occupational Therapist',
          scope: 'HOSPITAL',
          trustId: null,
          hospitalId: hospital2.id
        }
      }),
      prisma.jobRole.create({
        data: {
          code: 'HCA',
          name: 'Healthcare Assistant',
          scope: 'TRUST',
          trustId: trust.id,
          hospitalId: null
        }
      })
    ]);

    // 6. Create Shift Types
    console.log('⏰ Creating Shift Types...');
    const shiftTypes = await Promise.all([
      prisma.shiftType.create({
        data: {
          code: 'DAY',
          name: 'Day Shift',
          startTime: '08:00',
          endTime: '20:00',
          isNight: false,
          durationMinutes: 720
        }
      }),
      prisma.shiftType.create({
        data: {
          code: 'NIGHT',
          name: 'Night Shift',
          startTime: '20:00',
          endTime: '08:00',
          isNight: true,
          durationMinutes: 720
        }
      }),
      prisma.shiftType.create({
        data: {
          code: 'EARLY',
          name: 'Early Shift',
          startTime: '06:00',
          endTime: '14:00',
          isNight: false,
          durationMinutes: 480
        }
      }),
      prisma.shiftType.create({
        data: {
          code: 'LATE',
          name: 'Late Shift',
          startTime: '14:00',
          endTime: '22:00',
          isNight: false,
          durationMinutes: 480
        }
      })
    ]);

    // 7. Create Staff (20 total)
    console.log('👥 Creating Staff...');
    const staff = await Promise.all([
      // Doctors (5) - Trust-wide
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
          wards: { connect: [{ id: wards[0].id }, { id: wards[1].id }] },
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
          wards: { connect: [{ id: wards[0].id }, { id: wards[1].id }] },
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
          wards: { connect: [{ id: wards[0].id }, { id: wards[1].id }] },
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
          wards: { connect: [{ id: wards[2].id }, { id: wards[3].id }] },
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
          wards: { connect: [{ id: wards[2].id }, { id: wards[3].id }] },
          skills: { connect: [{ id: skills[5].id }] } // DoctorXRay
        }
      }),
      // Hospital 1 Nurses (6)
      prisma.staff.create({
        data: {
          prefix: '',
          firstName: 'Lisa',
          lastName: 'Wilson',
          fullName: 'Lisa Wilson',
          role: 'nurse',
          contractHoursPerWeek: 37.5,
          active: true,
          jobRoleId: jobRoles[3].id, // SENIOR_NURSE_H1
          wards: { connect: [{ id: wards[0].id }] },
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
          jobRoleId: jobRoles[4].id, // STAFF_NURSE_H1
          wards: { connect: [{ id: wards[0].id }] },
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
          jobRoleId: jobRoles[4].id, // STAFF_NURSE_H1
          wards: { connect: [{ id: wards[1].id }] },
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
          jobRoleId: jobRoles[3].id, // SENIOR_NURSE_H1
          wards: { connect: [{ id: wards[1].id }] },
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
          jobRoleId: jobRoles[4].id, // STAFF_NURSE_H1
          wards: { connect: [{ id: wards[0].id }, { id: wards[1].id }] },
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
          jobRoleId: jobRoles[4].id, // STAFF_NURSE_H1
          wards: { connect: [{ id: wards[0].id }, { id: wards[1].id }] },
          skills: { connect: [{ id: skills[3].id }] } // GeneralCare
        }
      }),
      // Hospital 1 Radiographers (2)
      prisma.staff.create({
        data: {
          prefix: '',
          firstName: 'Amanda',
          lastName: 'Harris',
          fullName: 'Amanda Harris',
          role: 'nurse',
          contractHoursPerWeek: 37.5,
          active: true,
          jobRoleId: jobRoles[5].id, // RADIOGRAPHER_H1
          wards: { connect: [{ id: wards[0].id }, { id: wards[1].id }] },
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
          jobRoleId: jobRoles[5].id, // RADIOGRAPHER_H1
          wards: { connect: [{ id: wards[0].id }, { id: wards[1].id }] },
          skills: { connect: [{ id: skills[1].id }] } // XRay
        }
      }),
      // Hospital 2 Nurses (3)
      prisma.staff.create({
        data: {
          prefix: '',
          firstName: 'Thomas',
          lastName: 'Hall',
          fullName: 'Thomas Hall',
          role: 'nurse',
          contractHoursPerWeek: 37.5,
          active: true,
          jobRoleId: jobRoles[6].id, // SENIOR_NURSE_H2
          wards: { connect: [{ id: wards[2].id }] },
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
          jobRoleId: jobRoles[7].id, // STAFF_NURSE_H2
          wards: { connect: [{ id: wards[2].id }, { id: wards[3].id }] },
          skills: { connect: [{ id: skills[3].id }, { id: skills[2].id }] } // GeneralCare, Bloods
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
          jobRoleId: jobRoles[7].id, // STAFF_NURSE_H2
          wards: { connect: [{ id: wards[3].id }] },
          skills: { connect: [{ id: skills[3].id }] } // GeneralCare
        }
      }),
      // Hospital 2 Therapists (2)
      prisma.staff.create({
        data: {
          prefix: '',
          firstName: 'Kevin',
          lastName: 'Moore',
          fullName: 'Kevin Moore',
          role: 'nurse',
          contractHoursPerWeek: 25,
          active: true,
          jobRoleId: jobRoles[8].id, // PHYSIOTHERAPIST_H2
          wards: { connect: [{ id: wards[2].id }] },
          skills: { connect: [{ id: skills[6].id }] } // Physio
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
          jobRoleId: jobRoles[9].id, // OCCUPATIONAL_THERAPIST_H2
          wards: { connect: [{ id: wards[2].id }] },
          skills: { connect: [{ id: skills[7].id }] } // Occupational
        }
      }),
      // Healthcare Assistants (2) - Trust-wide
      prisma.staff.create({
        data: {
          prefix: '',
          firstName: 'Matthew',
          lastName: 'Garcia',
          fullName: 'Matthew Garcia',
          role: 'nurse',
          contractHoursPerWeek: 20,
          active: true,
          jobRoleId: jobRoles[10].id, // HCA
          wards: { connect: [{ id: wards[0].id }, { id: wards[1].id }] },
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
          jobRoleId: jobRoles[10].id, // HCA
          wards: { connect: [{ id: wards[2].id }, { id: wards[3].id }] },
          skills: { connect: [{ id: skills[3].id }] } // GeneralCare
        }
      })
    ]);

    // 8. Create Policy
    console.log('📋 Creating Policy...');
    const policy = await prisma.policy.create({
      data: {
        scope: 'TRUST',
        trustId: trust.id,
        hospitalId: null,
        wardId: null,
        label: 'Trust-wide Scheduling Policy',
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
          'CONSULTANT': ['REGISTRAR'],
          'REGISTRAR': ['SHO'],
          'SENIOR_NURSE_H1': ['STAFF_NURSE_H1'],
          'SENIOR_NURSE_H2': ['STAFF_NURSE_H2'],
          'PHYSIOTHERAPIST_H2': ['OCCUPATIONAL_THERAPIST_H2']
        },
        rules: [
          {
            key: 'minRestHours',
            value: '11',
            description: 'Minimum rest hours between shifts'
          },
          {
            key: 'maxConsecutiveNights',
            value: '3',
            description: 'Maximum consecutive night shifts'
          },
          {
            key: 'oneShiftPerDay',
            value: 'true',
            description: 'Only one shift per day allowed'
          }
        ],
        timeBudgetMs: 30000,
        isActive: true
      }
    });

    // 9. Create Demand for August (31 days)
    console.log('📊 Creating Demand for August...');
    const augustDemand = [];
    
    // Generate demand for each ward for the whole of August
    for (let day = 1; day <= 31; day++) {
      const date = `2025-08-${day.toString().padStart(2, '0')}`;
      
      // Ward 1: General Medicine - High demand
      augustDemand.push({
        wardId: wards[0].id,
        date: date,
        slot: 'DAY',
        requirements: {
          'CONSULTANT': 1,
          'REGISTRAR': 1,
          'SENIOR_NURSE_H1': 1,
          'STAFF_NURSE_H1': 3,
          'HCA': 2
        }
      });
      
      augustDemand.push({
        wardId: wards[0].id,
        date: date,
        slot: 'NIGHT',
        requirements: {
          'SHO': 1,
          'STAFF_NURSE_H1': 2,
          'HCA': 1
        }
      });
      
      // Ward 2: Emergency Department - Very high demand
      augustDemand.push({
        wardId: wards[1].id,
        date: date,
        slot: 'DAY',
        requirements: {
          'CONSULTANT': 2,
          'REGISTRAR': 2,
          'SENIOR_NURSE_H1': 2,
          'STAFF_NURSE_H1': 4,
          'RADIOGRAPHER_H1': 1,
          'HCA': 2
        }
      });
      
      augustDemand.push({
        wardId: wards[1].id,
        date: date,
        slot: 'NIGHT',
        requirements: {
          'REGISTRAR': 1,
          'SHO': 1,
          'STAFF_NURSE_H1': 3,
          'RADIOGRAPHER_H1': 1,
          'HCA': 1
        }
      });
      
      // Ward 3: Rehabilitation Unit - Medium demand
      augustDemand.push({
        wardId: wards[2].id,
        date: date,
        slot: 'DAY',
        requirements: {
          'CONSULTANT': 1,
          'SENIOR_NURSE_H2': 1,
          'STAFF_NURSE_H2': 2,
          'PHYSIOTHERAPIST_H2': 1,
          'OCCUPATIONAL_THERAPIST_H2': 1,
          'HCA': 1
        }
      });
      
      augustDemand.push({
        wardId: wards[2].id,
        date: date,
        slot: 'NIGHT',
        requirements: {
          'STAFF_NURSE_H2': 1,
          'HCA': 1
        }
      });
      
      // Ward 4: Outpatient Clinic - Low demand (weekdays only)
      if (day <= 5 || (day >= 8 && day <= 12) || (day >= 15 && day <= 19) || (day >= 22 && day <= 26) || (day >= 29 && day <= 31)) {
        augustDemand.push({
          wardId: wards[3].id,
          date: date,
          slot: 'DAY',
          requirements: {
            'CONSULTANT': 1,
            'STAFF_NURSE_H2': 1,
            'HCA': 1
          }
        });
      }
    }

    // Insert all demand records
    await Promise.all(
      augustDemand.map(demand =>
        prisma.demand.create({
          data: {
            wardId: demand.wardId,
            date: new Date(demand.date),
            slot: demand.slot,
            granularity: 'shift',
            requiredBySkill: demand.requirements
          }
        })
      )
    );

    console.log('');
    console.log('📊 PRODUCTION SEED SUMMARY');
    console.log('============================================================');
    console.log(`🏢 Trust: ${trust.name}`);
    console.log(`🏥 Hospitals: ${hospital1.name}, ${hospital2.name}`);
    console.log(`🏥 Wards: ${wards.map(w => w.name).join(', ')}`);
    console.log(`👔 Job Roles: ${jobRoles.length}`);
    console.log(`🔧 Skills: ${skills.length}`);
    console.log(`⏰ Shift Types: ${shiftTypes.length}`);
    console.log(`👥 Staff: ${staff.length}`);
    console.log(`📋 Policies: 1 (Trust-wide)`);
    console.log(`📊 Demand: ${augustDemand.length} records (August 2025)`);
    console.log('============================================================');
    console.log('');
    console.log('✅ Production seed completed successfully!');
    console.log('🎯 Ready for comprehensive testing with:');
    console.log(`   - ${staff.length} staff members across 2 hospitals`);
    console.log(`   - ${augustDemand.length} demand records for August`);
    console.log(`   - 1 comprehensive trust policy`);
    console.log(`   - 4 wards with realistic demand patterns`);

  } catch (error) {
    console.error('❌ Production seed failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
