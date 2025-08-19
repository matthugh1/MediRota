import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearSchedule() {
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

    // Clear all assignments for this schedule
    const deletedAssignments = await prisma.assignment.deleteMany({
      where: {
        scheduleId: schedule.id
      }
    });

    console.log(`🗑️  Deleted ${deletedAssignments.count} assignments from schedule`);

    // Verify the schedule is now empty
    const remainingAssignments = await prisma.assignment.count({
      where: {
        scheduleId: schedule.id
      }
    });

    console.log(`✅ Schedule now has ${remainingAssignments} assignments`);

  } catch (error) {
    console.error('Error clearing schedule:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearSchedule();
