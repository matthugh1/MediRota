import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testSolverRequest() {
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

    const wardId = schedule.wardId;

    // Get ward
    const ward = await prisma.ward.findUnique({
      where: { id: wardId },
    });

    // Get staff for this ward
    const staff = await prisma.staff.findMany({
      where: {
        wards: { some: { id: wardId } },
        active: true,
      },
      include: {
        skills: true,
        wards: true,
        job: true,
      },
    });

    // Get demands for the schedule period
    const demands = await prisma.demand.findMany({
      where: {
        wardId,
        date: {
          gte: schedule.horizonStart,
          lte: schedule.horizonEnd,
        },
      },
    });

    // Get shift types
    const shiftTypes = await prisma.shiftType.findMany();

    // Build the solver request (same as in solve.service.ts)
    const solverRequest = {
      horizon: {
        start: schedule.horizonStart.toISOString().split('T')[0],
        end: schedule.horizonEnd.toISOString().split('T')[0],
      },
      wards: [{
        id: ward!.id,
        name: ward!.name,
      }],
      shiftTypes: shiftTypes.map(st => ({
        id: st.id,
        code: st.code,
        start: st.startTime,
        end: st.endTime,
        isNight: st.isNight,
        durationMinutes: st.durationMinutes,
      })),
      staff: staff.map(s => ({
        id: s.id,
        fullName: s.fullName,
        job: s.job.name,
        contractHoursPerWeek: s.contractHoursPerWeek,
        skills: s.skills.map(skill => skill.code),
        eligibleWards: s.wards.map(w => w.id),
      })),
      demand: demands.map(d => ({
        wardId: d.wardId,
        date: d.date.toISOString().split('T')[0],
        slot: d.slot,
        requirements: d.requiredBySkill as Record<string, number>,
      })),
    };

    console.log('🔍 SOLVER REQUEST ANALYSIS:');
    console.log('=' .repeat(50));
    console.log(`Horizon: ${solverRequest.horizon.start} to ${solverRequest.horizon.end}`);
    console.log(`Wards: ${solverRequest.wards.length}`);
    console.log(`Shift Types: ${solverRequest.shiftTypes.length}`);
    console.log(`Staff: ${solverRequest.staff.length}`);
    console.log(`Demand: ${solverRequest.demand.length}`);

    console.log('\n⏰ SHIFT TYPES BEING SENT:');
    console.log('=' .repeat(50));
    solverRequest.shiftTypes.forEach((st, index) => {
      console.log(`${index + 1}. ID: ${st.id}`);
      console.log(`   Code: ${st.code}`);
      console.log(`   Name: ${st.start} - ${st.end}`);
      console.log(`   Duration: ${st.durationMinutes} minutes`);
      console.log(`   Is Night: ${st.isNight}`);
      console.log('');
    });

    console.log('\n📋 DEMAND SLOTS BEING SENT:');
    console.log('=' .repeat(50));
    const demandSlots = new Set(solverRequest.demand.map(d => d.slot));
    console.log(`Demand slots: ${Array.from(demandSlots).join(', ')}`);

    // Check for mismatches
    const shiftTypeCodes = new Set(solverRequest.shiftTypes.map(st => st.code));
    const mismatchedSlots = Array.from(demandSlots).filter(slot => !shiftTypeCodes.has(slot));
    
    if (mismatchedSlots.length > 0) {
      console.log('\n⚠️  MISMATCH DETECTED:');
      console.log(`Demand slots that don't match shift type codes: ${mismatchedSlots.join(', ')}`);
    } else {
      console.log('\n✅ All demand slots match shift type codes');
    }

  } catch (error) {
    console.error('Error testing solver request:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSolverRequest();
