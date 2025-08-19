#!/usr/bin/env node

/**
 * Rota.ai Organizational Hierarchy Backfill Script
 * 
 * This script safely migrates existing data to the new Trust → Hospital → Ward hierarchy:
 * - Creates default Trust "Demo NHS Trust"
 * - Creates default Hospital "City Hospital" under that Trust
 * - Attaches all existing Wards to the default Hospital
 * - Sets ShiftTypes to TRUST scope
 * - Maps legacy ORG policies to TRUST scope
 * - Creates default RuleSet at TRUST level
 * 
 * Usage:
 *   npm run db:backfill:org
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting organizational hierarchy backfill...');

  try {
    // Step 1: Create default Trust
    console.log('📋 Creating default Trust...');
    const trust = await prisma.trust.upsert({
      where: { name: 'Demo NHS Trust' },
      update: {},
      create: {
        name: 'Demo NHS Trust'
      }
    });
    console.log(`✅ Trust created/found: ${trust.name} (${trust.id})`);

    // Step 2: Create default Hospital
    console.log('🏥 Creating default Hospital...');
    const hospital = await prisma.hospital.upsert({
      where: { 
        trustId_name: {
          trustId: trust.id,
          name: 'City Hospital'
        }
      },
      update: {},
      create: {
        name: 'City Hospital',
        trustId: trust.id
      }
    });
    console.log(`✅ Hospital created/found: ${hospital.name} (${hospital.id})`);

    // Step 3: Attach existing Wards to the Hospital
    console.log('🏥 Attaching existing Wards to Hospital...');
    const wards = await prisma.ward.findMany({
      where: { hospitalId: null }
    });
    
    if (wards.length > 0) {
      const updateResult = await prisma.ward.updateMany({
        where: { hospitalId: null },
        data: { hospitalId: hospital.id }
      });
      console.log(`✅ Attached ${updateResult.count} wards to ${hospital.name}`);
    } else {
      console.log('ℹ️  No unattached wards found');
    }

    // Step 4: Set ShiftTypes to TRUST scope (they should already have TRUST scope by default)
    console.log('⏰ Setting ShiftTypes trustId...');
    const shiftTypes = await prisma.shiftType.findMany({
      where: { trustId: null }
    });
    
    if (shiftTypes.length > 0) {
      const updateResult = await prisma.shiftType.updateMany({
        where: { trustId: null },
        data: { 
          trustId: trust.id
        }
      });
      console.log(`✅ Updated ${updateResult.count} shift types with trustId`);
    } else {
      console.log('ℹ️  All shift types already have trustId');
    }

    // Step 5: Map policies without trustId to TRUST scope
    console.log('📋 Mapping policies without trustId to TRUST scope...');
    const policiesWithoutTrust = await prisma.policy.findMany({
      where: { 
        trustId: null
      }
    });
    
    if (policiesWithoutTrust.length > 0) {
      for (const policy of policiesWithoutTrust) {
        await prisma.policy.update({
          where: { id: policy.id },
          data: {
            trustId: trust.id
          }
        });
      }
      console.log(`✅ Mapped ${policiesWithoutTrust.length} policies to TRUST scope`);
    } else {
      console.log('ℹ️  All policies already have trustId');
    }

    // Step 6: Create default TRUST RuleSet
    console.log('📋 Creating default TRUST RuleSet...');
    const existingTrustRuleSet = await prisma.ruleSet.findFirst({
      where: {
        scope: 'TRUST',
        trustId: trust.id
      }
    });

    if (!existingTrustRuleSet) {
      const trustRuleSet = await prisma.ruleSet.create({
        data: {
          scope: 'TRUST',
          trustId: trust.id,
          label: 'Default Trust Rules',
          minRestHours: 11,
          maxConsecutiveNights: 3,
          oneShiftPerDay: true
        }
      });
      console.log(`✅ Created TRUST RuleSet: ${trustRuleSet.label}`);
    } else {
      console.log(`ℹ️  TRUST RuleSet already exists: ${existingTrustRuleSet.label}`);
    }

    // Step 7: Optionally infer Staff.trustId/homeHospitalId from first eligible ward
    console.log('👥 Inferring Staff organizational context...');
    const staffWithoutTrust = await prisma.staff.findMany({
      where: { trustId: null },
      include: {
        wards: true
      }
    });

    let staffUpdated = 0;
    for (const staffMember of staffWithoutTrust) {
      if (staffMember.wards.length > 0) {
        const firstWard = staffMember.wards[0];
        const wardWithHospital = await prisma.ward.findUnique({
          where: { id: firstWard.id },
          include: { hospital: true }
        });

        if (wardWithHospital?.hospital) {
          await prisma.staff.update({
            where: { id: staffMember.id },
            data: {
              trustId: wardWithHospital.hospital.trustId,
              homeHospitalId: wardWithHospital.hospital.id
            }
          });
          staffUpdated++;
        }
      }
    }
    console.log(`✅ Updated ${staffUpdated} staff members with organizational context`);

    // Step 8: Optionally set Schedule.hospitalId/trustId for single-ward schedules
    console.log('📅 Inferring Schedule organizational context...');
    const schedulesWithoutHospital = await prisma.schedule.findMany({
      where: { hospitalId: null },
      include: { ward: true }
    });

    let schedulesUpdated = 0;
    for (const schedule of schedulesWithoutHospital) {
      if (schedule.ward?.hospitalId) {
        const wardWithHospital = await prisma.ward.findUnique({
          where: { id: schedule.ward.id },
          include: { hospital: true }
        });

        if (wardWithHospital?.hospital) {
          await prisma.schedule.update({
            where: { id: schedule.id },
            data: {
              hospitalId: wardWithHospital.hospital.id,
              trustId: wardWithHospital.hospital.trustId
            }
          });
          schedulesUpdated++;
        }
      }
    }
    console.log(`✅ Updated ${schedulesUpdated} schedules with organizational context`);

    console.log('\n✅ Organizational hierarchy backfill completed successfully!');
    
    // Print summary
    const trustCount = await prisma.trust.count();
    const hospitalCount = await prisma.hospital.count();
    const wardCount = await prisma.ward.count();
    const staffCount = await prisma.staff.count();
    const scheduleCount = await prisma.schedule.count();
    
    console.log('\n📊 BACKFILL SUMMARY');
    console.log('============================================================');
    console.log(`🏥 Trusts: ${trustCount}`);
    console.log(`🏥 Hospitals: ${hospitalCount}`);
    console.log(`🏥 Wards: ${wardCount}`);
    console.log(`👥 Staff: ${staffCount}`);
    console.log(`📅 Schedules: ${scheduleCount}`);
    console.log('============================================================');

  } catch (error) {
    console.error('❌ Error during backfill:', error);
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
