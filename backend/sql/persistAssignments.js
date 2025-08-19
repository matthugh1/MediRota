import copyFrom from 'pg-copy-streams';
import { PassThrough } from 'stream';
export async function persistAssignments(client, scheduleId, rows, metricsJson) {
    await client.query('BEGIN');
    try {
        // Delete existing assignments for this schedule
        await client.query('DELETE FROM "Assignment" WHERE "scheduleId" = $1', [scheduleId]);
        if (rows.length === 0) {
            // No assignments to insert, just update metrics
            await client.query('UPDATE "Schedule" SET metrics = $2 WHERE id = $1', [scheduleId, metricsJson]);
            await client.query('COMMIT');
            return 0;
        }
        // Use COPY for bulk insert
        const stream = client.query(copyFrom.from('COPY "Assignment"("id","scheduleId","staffId","wardId","date","slot","shiftTypeId","createdAt") FROM STDIN WITH (FORMAT csv)'));
        const pass = new PassThrough();
        pass.pipe(stream);
        // Write rows to the COPY stream
        for (const row of rows) {
            const line = [
                row.id,
                scheduleId,
                row.staffId,
                row.wardId,
                row.date,
                row.slot,
                row.shiftTypeId,
                new Date().toISOString()
            ].join(',') + '\n';
            pass.write(line);
        }
        pass.end();
        // Wait for COPY to complete
        await new Promise((resolve, reject) => {
            stream.on('finish', () => resolve());
            stream.on('error', reject);
        });
        // Update schedule metrics
        await client.query('UPDATE "Schedule" SET metrics = $2 WHERE id = $1', [scheduleId, metricsJson]);
        await client.query('COMMIT');
        return rows.length;
    }
    catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
}
//# sourceMappingURL=persistAssignments.js.map