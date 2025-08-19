#!/usr/bin/env node
import axios, { AxiosInstance } from 'axios';

const API_BASE = process.env.API_BASE || 'http://localhost:3000';
const AUTH_TOKEN = process.env.AUTH_TOKEN;
const api: AxiosInstance = axios.create({
	baseURL: API_BASE,
	headers: AUTH_TOKEN ? { Authorization: `Bearer ${AUTH_TOKEN}` } : {},
});

const log = (message: string) => {
	console.log(`[${new Date().toISOString()}] ${message}`);
};

const logError = (message: string, error?: any) => {
	console.error(`[${new Date().toISOString()}] ERROR: ${message}`, error?.response?.data || error?.message || error);
};

async function cleanupTestWard() {
	log('Starting TestWard cleanup...');

	try {
		// Step 1: Get all assignments and delete them (they reference schedules, staff, wards, shiftTypes)
		log('Step 1: Cleaning up assignments...');
		try {
			const assignmentsResponse = await api.get('/assignments');
			const assignments = assignmentsResponse.data.data || [];
			
			for (const assignment of assignments) {
				log(`  Deleting assignment: ${assignment.id}`);
				await api.delete(`/assignments/${assignment.id}`);
			}
		} catch (error) {
			log('  No assignments endpoint found, skipping...');
		}

		// Step 2: Get all locks and delete them (they reference schedules, staff, wards)
		log('Step 2: Cleaning up locks...');
		try {
			const locksResponse = await api.get('/locks');
			const locks = locksResponse.data.data || [];
			
			for (const lock of locks) {
				log(`  Deleting lock: ${lock.id}`);
				await api.delete(`/locks/${lock.id}`);
			}
		} catch (error) {
			log('  No locks endpoint found, skipping...');
		}

		// Step 3: Get all events and delete them (they reference schedules)
		log('Step 3: Cleaning up events...');
		try {
			const eventsResponse = await api.get('/events');
			const events = eventsResponse.data.data || [];
			
			for (const event of events) {
				log(`  Deleting event: ${event.id}`);
				await api.delete(`/events/${event.id}`);
			}
		} catch (error) {
			log('  No events endpoint found, skipping...');
		}

		// Step 4: Get all preferences and delete them (they reference staff)
		log('Step 4: Cleaning up preferences...');
		try {
			const preferencesResponse = await api.get('/preferences');
			const preferences = preferencesResponse.data.data || [];
			
			for (const preference of preferences) {
				log(`  Deleting preference: ${preference.id}`);
				await api.delete(`/preferences/${preference.id}`);
			}
		} catch (error) {
			log('  No preferences endpoint found, skipping...');
		}

		// Step 5: Get all schedules and delete them
		log('Step 5: Cleaning up schedules...');
		const schedulesResponse = await api.get('/schedules');
		const schedules = schedulesResponse.data.data || [];
		
		for (const schedule of schedules) {
			log(`  Deleting schedule: ${schedule.id}`);
			await api.delete(`/schedules/${schedule.id}`);
		}

		// Step 6: Get all demand entries and delete them
		log('Step 6: Cleaning up demand...');
		const demandResponse = await api.get('/demand');
		const demandEntries = demandResponse.data.data || [];
		
		for (const demand of demandEntries) {
			log(`  Deleting demand: ${demand.id}`);
			await api.delete(`/demand/${demand.id}`);
		}

		// Step 7: Get all rule sets and delete them
		log('Step 7: Cleaning up rule sets...');
		const ruleSetsResponse = await api.get('/rule-sets');
		const ruleSets = ruleSetsResponse.data.data || [];
		
		for (const ruleSet of ruleSets) {
			log(`  Deleting rule set: ${ruleSet.id}`);
			await api.delete(`/rule-sets/${ruleSet.id}`);
		}

		// Step 8: Get all staff and delete them
		log('Step 8: Cleaning up staff...');
		const staffResponse = await api.get('/staff?limit=1000');
		const staff = staffResponse.data.data || [];
		
		for (const staffMember of staff) {
			log(`  Deleting staff: ${staffMember.fullName} (${staffMember.id})`);
			await api.delete(`/staff/${staffMember.id}`);
		}

		// Step 9: Get all shift types and delete them
		log('Step 9: Cleaning up shift types...');
		const shiftTypesResponse = await api.get('/shift-types');
		const shiftTypes = shiftTypesResponse.data.data || [];
		
		for (const shiftType of shiftTypes) {
			log(`  Deleting shift type: ${shiftType.name} (${shiftType.id})`);
			await api.delete(`/shift-types/${shiftType.id}`);
		}

		// Step 10: Get all skills and delete them
		log('Step 10: Cleaning up skills...');
		const skillsResponse = await api.get('/skills');
		const skills = skillsResponse.data.data || [];
		
		for (const skill of skills) {
			log(`  Deleting skill: ${skill.name} (${skill.id})`);
			await api.delete(`/skills/${skill.id}`);
		}

		// Step 11: Get all jobs and delete them
		log('Step 11: Cleaning up jobs...');
		const jobsResponse = await api.get('/jobs');
		const jobs = jobsResponse.data.data || [];
		
		for (const job of jobs) {
			log(`  Deleting job: ${job.name} (${job.id})`);
			await api.delete(`/jobs/${job.id}`);
		}

		// Step 12: Get all wards and delete them
		log('Step 12: Cleaning up wards...');
		const wardsResponse = await api.get('/wards');
		const wards = wardsResponse.data.data || [];
		
		for (const ward of wards) {
			log(`  Deleting ward: ${ward.name} (${ward.id})`);
			await api.delete(`/wards/${ward.id}`);
		}

		log('✅ TestWard cleanup completed successfully!');
		log('You can now run the seed script again to create fresh test data.');

	} catch (error) {
		logError('Failed to cleanup TestWard data', error);
		process.exit(1);
	}
}

cleanupTestWard().catch((error) => {
	logError('Unexpected error during cleanup', error);
	process.exit(1);
});

export { cleanupTestWard };
