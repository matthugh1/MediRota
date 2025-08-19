import { Client } from 'pg';
export interface AssignmentRow {
    id: string;
    staffId: string;
    wardId: string;
    date: string;
    slot: string;
    shiftTypeId: string;
}
export declare function persistAssignments(client: Client, scheduleId: string, rows: AssignmentRow[], metricsJson: any): Promise<number>;
