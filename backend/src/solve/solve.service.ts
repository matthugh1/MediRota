import { Injectable, Logger, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'pg';
import { PrismaService } from '../prisma/prisma.service.js';
import { SchedulesService } from '../schedules/schedules.service.js';
import { SolverClientService, SolverRequest, RepairRequest } from './solver-client.service.js';
import { SolveDto } from './dto/solve.dto.js';
import { RepairDto } from './dto/repair.dto.js';
import { persistAssignments, AssignmentRow } from '../sql/persistAssignments.js';
import { PolicyService } from '../policy/policy.service.js';

@Injectable()
export class SolveService {
	private readonly logger = new Logger(SolveService.name);

	constructor(
		private prisma: PrismaService,
		private schedulesService: SchedulesService,
		private solverClient: SolverClientService,
		private configService: ConfigService,
		private policyService: PolicyService,
	) {}

	async solve(solveDto: SolveDto) {
		const { scheduleId, timeBudgetMs } = solveDto;

		// Fetch schedule with all related data
		const schedule = await this.schedulesService.findOne(scheduleId);
		if (!schedule) {
			throw new NotFoundException(`Schedule ${scheduleId} not found`);
		}

		// Fetch all inputs for the solver
		const solverInputs = await this.buildSolverRequest(schedule.wardId, schedule);

		// Call the solver
		this.logger.log(`Starting solve for schedule ${scheduleId}`);
		const solverResponse = await this.solverClient.solveFull({
			...solverInputs,
			timeBudgetMs,
		});

		// Check if solver found the problem infeasible
		if (solverResponse.diagnostics.infeasible) {
			throw new UnprocessableEntityException({
				message: 'Solver found problem infeasible',
				diagnostics: solverResponse.diagnostics,
			});
		}

		// Use high-performance bulk persistence with PostgreSQL COPY
		const client = new Client({
			connectionString: this.configService.get<string>('DATABASE_URL'),
		});

		try {
			await client.connect();

			// Prepare assignment rows for bulk insert
			const assignmentRows: AssignmentRow[] = solverResponse.assignments.map(assignment => ({
				id: crypto.randomUUID(), // Generate UUID for each assignment
				staffId: assignment.staffId,
				wardId: assignment.wardId,
				date: assignment.date,
				slot: assignment.slot,
				shiftTypeId: assignment.shiftTypeId,
			}));

			// Persist assignments using COPY
			const insertedCount = await persistAssignments(
				client,
				scheduleId,
				assignmentRows,
				solverResponse.metrics
			);

			// Update schedule status and log event using Prisma
			const [updatedSchedule] = await Promise.all([
				this.prisma.schedule.update({
					where: { id: scheduleId },
					data: { status: 'draft' },
				}),
				this.prisma.event.create({
					data: {
						scheduleId,
						type: 'solve_completed',
						payload: {
							solutionId: solverResponse.solutionId,
							assignmentsCount: insertedCount,
							metrics: solverResponse.metrics,
							diagnostics: solverResponse.diagnostics,
						},
					},
				}),
			]);

			const result = {
				schedule: updatedSchedule,
				assignmentsCount: insertedCount,
				metrics: solverResponse.metrics,
				diagnostics: solverResponse.diagnostics,
			};

			this.logger.log(`Solve completed for schedule ${scheduleId}: ${result.assignmentsCount} assignments`);
			return result;
		} finally {
			await client.end();
		}
	}

	async repair(repairDto: RepairDto) {
		const { scheduleId, events, timeBudgetMs } = repairDto;

		// Fetch schedule with all related data
		const schedule = await this.schedulesService.findOne(scheduleId);
		if (!schedule) {
			throw new NotFoundException(`Schedule ${scheduleId} not found`);
		}

		// Fetch all inputs for the solver
		const solverInputs = await this.buildSolverRequest(schedule.wardId, schedule);

		// Call the solver for repair
		this.logger.log(`Starting repair for schedule ${scheduleId} with ${events.length} events`);
		const solverResponse = await this.solverClient.solveRepair({
			...solverInputs,
			events: events.map(event => ({
				type: event.type === 'staff_unavailable' ? 'sickness' : event.type,
				staffId: event.staffId || '',
				wardId: event.wardId || '',
				date: event.date,
				slot: event.slot || '',
			})),
			timeBudgetMs,
		});

		// Check if solver found the repair infeasible
		if (solverResponse.diagnostics.infeasible) {
			throw new UnprocessableEntityException({
				message: 'Solver found repair infeasible',
				diagnostics: solverResponse.diagnostics,
			});
		}

		// Use high-performance bulk persistence with PostgreSQL COPY
		const client = new Client({
			connectionString: this.configService.get<string>('DATABASE_URL'),
		});

		try {
			await client.connect();

			// Prepare assignment rows for bulk insert
			const assignmentRows: AssignmentRow[] = solverResponse.assignments.map(assignment => ({
				id: crypto.randomUUID(), // Generate UUID for each assignment
				staffId: assignment.staffId,
				wardId: assignment.wardId,
				date: assignment.date,
				slot: assignment.slot,
				shiftTypeId: assignment.shiftTypeId,
			}));

			// Persist assignments using COPY
			const insertedCount = await persistAssignments(
				client,
				scheduleId,
				assignmentRows,
				solverResponse.metrics
			);

			// Log the repair event using Prisma
			await this.prisma.event.create({
				data: {
					scheduleId,
					type: 'repair_completed',
					payload: {
						solutionId: solverResponse.solutionId,
						events: events.map(e => ({
							type: e.type,
							date: e.date,
							slot: e.slot,
							staffId: e.staffId,
							payload: e.payload,
						})),
						assignmentsCount: insertedCount,
						metrics: solverResponse.metrics,
						diagnostics: solverResponse.diagnostics,
					},
				},
			});

			const result = {
				schedule: { id: scheduleId }, // Schedule already updated by persistAssignments
				assignmentsCount: insertedCount,
				metrics: solverResponse.metrics,
				diagnostics: solverResponse.diagnostics,
			};

			this.logger.log(`Repair completed for schedule ${scheduleId}: ${result.assignmentsCount} assignments`);
			return result;
		} finally {
			await client.end();
		}
	}

	private async buildSolverRequest(wardId: string, schedule: any): Promise<SolverRequest> {
		// Get effective policy for this schedule
		const policy = await this.policyService.getEffectivePolicy({ 
			wardId, 
			scheduleId: schedule.id 
		});
		// Fetch ward
		const ward = await this.prisma.ward.findUnique({
			where: { id: wardId },
		});

		// Fetch staff for this ward
		const staff = await this.prisma.staff.findMany({
			where: {
				wards: { some: { id: wardId } },
				active: true,
			},
			include: {
				skills: true,
				wards: true,
				jobRole: {
					select: {
						id: true,
						code: true,
						name: true,
					},
				},
			},
		});

		// Fetch demands for the schedule period
		const demands = await this.prisma.demand.findMany({
			where: {
				wardId,
				date: {
					gte: schedule.horizonStart,
					lte: schedule.horizonEnd,
				},
			},
		});

		// Fetch shift types
		const shiftTypes = await this.prisma.shiftType.findMany();

		// Fetch rules for this ward
		const ruleSets = await this.prisma.ruleSet.findMany({
			where: {
				wardId,
				active: true,
			},
			include: {
				rules: true,
			},
		});

		// Fetch preferences for the schedule period
		const preferences = await this.prisma.preference.findMany({
			where: {
				staff: {
					wards: { some: { id: wardId } },
				},
				date: {
					gte: schedule.horizonStart,
					lte: schedule.horizonEnd,
				},
			},
		});

		// Fetch locks for this schedule
		const locks = await this.prisma.lock.findMany({
			where: { scheduleId: schedule.id },
		});

		// Build rules object from rule sets
		const rules = {
			minRestHours: 11, // Default values
			maxConsecutiveNights: 3,
			oneShiftPerDay: true,
		};

		// Override with actual rules from database
		for (const ruleSet of ruleSets) {
			for (const rule of ruleSet.rules) {
				switch (rule.type) {
					case 'minRestHours':
						rules.minRestHours = parseInt(rule.value as string);
						break;
					case 'maxConsecutiveNights':
						rules.maxConsecutiveNights = parseInt(rule.value as string);
						break;
					case 'oneShiftPerDay':
						rules.oneShiftPerDay = rule.value === 'true';
						break;
				}
			}
		}

		// Build solver request
		return {
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
				job: s.jobRole.name,
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
			rules,
			locks: locks.map(l => ({
				staffId: l.staffId,
				wardId: l.wardId,
				date: l.date.toISOString().split('T')[0],
				slot: l.slot,
			})),
			preferences: preferences.map(p => ({
				staffId: p.staffId,
				date: p.date.toISOString().split('T')[0],
				preferOff: p.preferOff ?? false,
				preferOn: p.preferOn ?? false,
			})),
			objective: 'min_soft_penalties',
			hints: [], // No hints for now
			// Policy configuration
			solverWeights: policy.weights as any,
			solverLimits: policy.limits as any,
			solverToggles: policy.toggles as any,
			substitution: policy.substitution as any,
			timeBudgetMs: policy.timeBudgetMs,
		};
	}
}
