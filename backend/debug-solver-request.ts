import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugSolverRequest() {
  try {
    // Find the schedule
    const schedule = await prisma.schedule.findFirst({
      where: {
        objective: 'sched-ward1-14d'
      }
    });

    if (!schedule) {
      console.log('❌ Schedule not found');
      return;
    }

    console.log(`📅 Found schedule: ${schedule.id} (${schedule.objective})`);

    // Get the ward
    const ward = await prisma.ward.findUnique({
      where: { id: schedule.wardId }
    });

    if (!ward) {
      console.log('❌ Ward not found');
      return;
    }

    console.log(`🏥 Ward: ${ward.id} (${ward.name})`);

    // Get all shift types
    const shiftTypes = await prisma.shiftType.findMany();
    console.log('\n⏰ SHIFT TYPES IN DATABASE:');
    console.log('=' .repeat(50));
    shiftTypes.forEach((st, index) => {
      console.log(`${index + 1}. ID: ${st.id}`);
      console.log(`   Code: ${st.code}`);
      console.log(`   Name: ${st.name}`);
      console.log(`   Start: ${st.startTime}`);
      console.log(`   End: ${st.endTime}`);
      console.log(`   Duration: ${st.durationMinutes} minutes`);
      console.log(`   Is Night: ${st.isNight}`);
      console.log('');
    });

    // Get staff for this ward
    const staff = await prisma.staff.findMany({
      where: {
        wards: { some: { id: ward.id } },
        active: true,
      },
      include: {
        skills: true,
        wards: true,
        job: true,
      },
    });

    console.log(`👥 Staff for ward: ${staff.length} members`);

    // Get demands for the schedule period
    const demands = await prisma.demand.findMany({
      where: {
        wardId: ward.id,
        date: {
          gte: schedule.horizonStart,
          lte: schedule.horizonEnd,
        },
      },
    });

    console.log(`📊 Demands for schedule: ${demands.length} entries`);

    // Check for any duplicate shift type codes
    const shiftTypeCodes = shiftTypes.map(st => st.code);
    const uniqueCodes = new Set(shiftTypeCodes);
    
    console.log('\n🔍 SHIFT TYPE ANALYSIS:');
    console.log('=' .repeat(50));
    console.log(`Total shift types: ${shiftTypes.length}`);
    console.log(`Unique codes: ${uniqueCodes.size}`);
    console.log(`Codes: ${Array.from(uniqueCodes).join(', ')}`);
    
    if (shiftTypes.length !== uniqueCodes.size) {
      console.log('⚠️  DUPLICATE SHIFT TYPE CODES DETECTED!');
      const duplicates = shiftTypeCodes.filter((code, index) => shiftTypeCodes.indexOf(code) !== index);
      console.log(`Duplicate codes: ${duplicates.join(', ')}`);
    }

    // Check if there are any shift types with similar names
    const eveningShifts = shiftTypes.filter(st => 
      st.code.includes('EVE') || st.code.includes('EVENING') || st.name.toLowerCase().includes('evening')
    );
    
    if (eveningShifts.length > 1) {
      console.log('\n⚠️  MULTIPLE EVENING SHIFTS DETECTED:');
      eveningShifts.forEach(st => {
        console.log(`   - ${st.code} (${st.name})`);
      });
    }

    // Check demand slot values
    const demandSlots = new Set(demands.map(d => d.slot));
    console.log('\n📋 DEMAND SLOT ANALYSIS:');
    console.log('=' .repeat(50));
    console.log(`Demand slots: ${Array.from(demandSlots).join(', ')}`);
    
    // Check if demand slots match shift type codes
    const shiftTypeCodeSet = new Set(shiftTypeCodes);
    const mismatchedSlots = Array.from(demandSlots).filter(slot => !shiftTypeCodeSet.has(slot));
    
    if (mismatchedSlots.length > 0) {
      console.log('⚠️  DEMAND SLOTS DON\'T MATCH SHIFT TYPE CODES:');
      console.log(`Mismatched slots: ${mismatchedSlots.join(', ')}`);
    }

  } catch (error) {
    console.error('Error debugging solver request:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugSolverRequest();
