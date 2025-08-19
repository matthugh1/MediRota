import { Client } from 'pg';
import { PrismaClient } from '@prisma/client';
import { persistAssignments, AssignmentRow } from './persistAssignments.js';

// Performance test comparing COPY vs Prisma for bulk assignment insertion
export async function runPerformanceTest() {
	const client = new Client({
		connectionString: process.env.DATABASE_URL,
	});
	const prisma = new PrismaClient();

	try {
		await client.connect();
		await prisma.$connect();

		// Generate test data
		const testScheduleId = 'test-schedule-id';
		const testRows: AssignmentRow[] = Array.from({ length: 1000 }, (_, i) => ({
			id: `test-assignment-${i}`,
			staffId: `staff-${i % 10}`,
			wardId: 'test-ward-id',
			date: '2024-01-01T00:00:00Z',
			slot: `slot-${i % 24}`,
			shiftTypeId: `shift-${i % 5}`,
		}));

		const metricsJson = { test: true, count: testRows.length };

		console.log(`Testing with ${testRows.length} assignments...`);

		// Test COPY performance
		console.time('COPY Method');
		const copyCount = await persistAssignments(client, testScheduleId, testRows, metricsJson);
		console.timeEnd('COPY Method');
		console.log(`COPY inserted: ${copyCount} assignments`);

		// Test Prisma performance (for comparison)
		console.time('Prisma Method');
		await prisma.assignment.deleteMany({ where: { scheduleId: testScheduleId } });
		await prisma.assignment.createMany({
			data: testRows.map(row => ({
				id: row.id,
				scheduleId: testScheduleId,
				staffId: row.staffId,
				wardId: row.wardId,
				date: new Date(row.date),
				slot: row.slot,
				shiftTypeId: row.shiftTypeId,
			})),
		});
		console.timeEnd('Prisma Method');

		// Cleanup
		await client.query('DELETE FROM "Assignment" WHERE "scheduleId" = $1', [testScheduleId]);

	} catch (error) {
		console.error('Performance test failed:', error);
	} finally {
		await client.end();
		await prisma.$disconnect();
	}
}

// Run test if called directly
if (require.main === module) {
	runPerformanceTest().catch(console.error);
}
