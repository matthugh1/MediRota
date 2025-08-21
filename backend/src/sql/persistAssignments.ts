import { Client } from 'pg';
import copyFrom from 'pg-copy-streams';
import { PassThrough } from 'stream';

export interface AssignmentRow {
	id: string;
	staffId: string;
	wardId: string;
	date: string;
	slot: string;
	shiftTypeId: string;
}

export async function persistAssignments(
	client: Client,
	scheduleId: string,
	rows: AssignmentRow[],
	metricsJson: any
): Promise<number> {
	await client.query('BEGIN');

	try {
		// Delete existing assignments for this schedule
		await client.query('DELETE FROM "Assignment" WHERE "scheduleId" = $1', [scheduleId]);

		if (rows.length === 0) {
			// No assignments to insert
			await client.query('COMMIT');
			return 0;
		}

		// Use COPY for bulk insert
		const stream = client.query(copyFrom.from(
			'COPY "Assignment"("id","scheduleId","staffId","wardId","date","slot","shiftTypeId","createdAt","updatedAt") FROM STDIN WITH (FORMAT csv)'
		));
		const pass = new PassThrough();
		pass.pipe(stream);

		// Write rows to the COPY stream
		for (const row of rows) {
			const now = new Date().toISOString();
			const line = [
				row.id,
				scheduleId,
				row.staffId,
				row.wardId,
				row.date,
				row.slot,
				row.shiftTypeId,
				now,  // createdAt
				now   // updatedAt
			].join(',') + '\n';
			pass.write(line);
		}
		pass.end();

		// Wait for COPY to complete
		await new Promise<void>((resolve, reject) => {
			stream.on('finish', () => resolve());
			stream.on('error', reject);
		});

		await client.query('COMMIT');
		return rows.length;
	} catch (error) {
		await client.query('ROLLBACK');
		throw error;
	}
}
