#!/usr/bin/env node
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const log = (message: string) => {
	console.log(`[${new Date().toISOString()}] ${message}`);
};

const logError = (message: string, error?: any) => {
	console.error(`[${new Date().toISOString()}] ERROR: ${message}`, error?.message || error);
};

async function cleanupTestWard() {
	log('Starting TestWard cleanup using Prisma...');

	try {
		// Step 1: Delete all assignments
		log('Step 1: Cleaning up assignments...');
		const deletedAssignments = await prisma.assignment.deleteMany({});
		log(`  Deleted ${deletedAssignments.count} assignments`);

		// Step 2: Delete all locks
		log('Step 2: Cleaning up locks...');
		const deletedLocks = await prisma.lock.deleteMany({});
		log(`  Deleted ${deletedLocks.count} locks`);

		// Step 3: Delete all events
		log('Step 3: Cleaning up events...');
		const deletedEvents = await prisma.event.deleteMany({});
		log(`  Deleted ${deletedEvents.count} events`);

		// Step 4: Delete all preferences
		log('Step 4: Cleaning up preferences...');
		const deletedPreferences = await prisma.preference.deleteMany({});
		log(`  Deleted ${deletedPreferences.count} preferences`);

		// Step 5: Delete all schedules
		log('Step 5: Cleaning up schedules...');
		const deletedSchedules = await prisma.schedule.deleteMany({});
		log(`  Deleted ${deletedSchedules.count} schedules`);

		// Step 6: Delete all demand entries
		log('Step 6: Cleaning up demand...');
		const deletedDemand = await prisma.demand.deleteMany({});
		log(`  Deleted ${deletedDemand.count} demand entries`);

		// Step 7: Delete all rules
		log('Step 7: Cleaning up rules...');
		const deletedRules = await prisma.rule.deleteMany({});
		log(`  Deleted ${deletedRules.count} rules`);

		// Step 8: Delete all rule sets
		log('Step 8: Cleaning up rule sets...');
		const deletedRuleSets = await prisma.ruleSet.deleteMany({});
		log(`  Deleted ${deletedRuleSets.count} rule sets`);

		// Step 9: Delete all staff (this will also remove many-to-many relationships)
		log('Step 9: Cleaning up staff...');
		const deletedStaff = await prisma.staff.deleteMany({});
		log(`  Deleted ${deletedStaff.count} staff members`);

		// Step 10: Delete all shift types
		log('Step 10: Cleaning up shift types...');
		const deletedShiftTypes = await prisma.shiftType.deleteMany({});
		log(`  Deleted ${deletedShiftTypes.count} shift types`);

		// Step 11: Delete all skills
		log('Step 11: Cleaning up skills...');
		const deletedSkills = await prisma.skill.deleteMany({});
		log(`  Deleted ${deletedSkills.count} skills`);

		// Step 12: Delete all jobs
		log('Step 12: Cleaning up jobs...');
		const deletedJobs = await prisma.job.deleteMany({});
		log(`  Deleted ${deletedJobs.count} jobs`);

		// Step 13: Delete all wards
		log('Step 13: Cleaning up wards...');
		const deletedWards = await prisma.ward.deleteMany({});
		log(`  Deleted ${deletedWards.count} wards`);

		log('✅ TestWard cleanup completed successfully!');
		log('You can now run the seed script again to create fresh test data.');

	} catch (error) {
		logError('Failed to cleanup TestWard data', error);
		process.exit(1);
	} finally {
		await prisma.$disconnect();
	}
}

cleanupTestWard().catch((error) => {
	logError('Unexpected error during cleanup', error);
	process.exit(1);
});

export { cleanupTestWard };
