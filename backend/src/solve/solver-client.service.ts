import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosResponse } from 'axios';
import * as fs from 'fs';
import * as path from 'path';

export interface SolverRequest {
	horizon: {
		start: string;
		end: string;
	};
	wards: Array<{
		id: string;
		name: string;
	}>;
	shiftTypes: Array<{
		id: string;
		code: string;
		start: string;
		end: string;
		isNight: boolean;
		    durationMinutes: number;
	}>;
	staff: Array<{
		id: string;
		fullName: string;
		job: string;
		contractHoursPerWeek: number;
		skills: string[];
		eligibleWards: string[];
	}>;
	demand: Array<{
		wardId: string;
		date: string;
		slot: string;
		requirements: Record<string, number>;
	}>;
	rules: {
		minRestHours: number;
		maxConsecutiveNights: number;
		oneShiftPerDay: boolean;
	};
	locks: Array<{
		staffId: string;
		wardId: string;
		date: string;
		slot: string;
	}>;
	preferences: Array<{
		staffId: string;
		date: string;
		preferOff: boolean;
		preferOn: boolean;
	}>;
	objective: 'min_soft_penalties' | 'min_total_assignments';
	timeBudgetMs?: number;
	hints: Array<{
		staffId: string;
		wardId: string;
		date: string;
		slot: string;
	}>;
	// Policy configuration
	solverWeights?: {
		unmet: number;
		overtime: number;
		fairness: number;
		prefs: number;
		substitutes: number;
		flex: number;
	};
	solverLimits?: {
		maxOvertimePerWeekMinutes: number;
		maxFlexShiftsPerWeek: number;
	};
	solverToggles?: {
		enableWardFlex: boolean;
		enableSubstitution: boolean;
	};
	substitution?: Record<string, string[]>;
}

export interface SolverResponse {
	solutionId: string;
	assignments: Array<{
		staffId: string;
		wardId: string;
		date: string;
		slot: string;
		shiftTypeId: string;
	}>;
	metrics: {
		hardViolations: number;
		solveMs: number;
		fairnessNightStd: number;
		preferenceSatisfaction: number;
	};
	diagnostics: {
		unfilled: Array<{
			wardId: string;
			date: string;
			slot: string;
			skill: string;
			required: number;
			filled: number;
		}>;
		infeasible: boolean;
		notes: string[];
	};
}

export interface RepairRequest extends SolverRequest {
	events: Array<{
		type: 'sickness' | 'demand_change' | 'rule_change';
		staffId: string;
		wardId: string;
		date: string;
		slot: string;
	}>;
}

@Injectable()
export class SolverClientService {
	private readonly logger = new Logger(SolverClientService.name);
	private readonly solverUrl: string;

	constructor(private configService: ConfigService) {
		this.solverUrl = this.configService.get<string>('SOLVER_URL', 'http://localhost:8090');
	}

	async solveFull(request: SolverRequest): Promise<SolverResponse> {
		try {
			this.logger.log(`Sending solve_full request for ward ${request.wards[0]?.id}`);
			
			// Debug logging if enabled
			if (process.env.DEBUG_SOLVER === 'true') {
				const debugDir = path.join(process.cwd(), 'debug');
				if (!fs.existsSync(debugDir)) {
					fs.mkdirSync(debugDir, { recursive: true });
				}
				fs.writeFileSync(
					path.join(debugDir, 'last-solver-request.json'),
					JSON.stringify(request, null, 2)
				);
			}
			
			const response: AxiosResponse<SolverResponse> = await axios.post(
				`${this.solverUrl}/solve_full`,
				request,
				{
					timeout: request.timeBudgetMs || 300000, // 5 minutes default
					headers: {
						'Content-Type': 'application/json',
					},
				}
			);

			this.logger.log(`Solve completed in ${response.data.metrics.solveMs}ms`);
			
			// Debug logging if enabled
			if (process.env.DEBUG_SOLVER === 'true') {
				const debugDir = path.join(process.cwd(), 'debug');
				fs.writeFileSync(
					path.join(debugDir, 'last-solver-response.json'),
					JSON.stringify(response.data, null, 2)
				);
			}
			
			return response.data;
		} catch (error) {
			this.logger.error(`Solver error: ${error instanceof Error ? error.message : String(error)}`);
			
			if (axios.isAxiosError(error)) {
				if (error.response?.status === 422) {
					throw new HttpException(
						{
							statusCode: 422,
							message: 'Solver found problem infeasible',
							diagnostics: error.response.data,
						},
						HttpStatus.UNPROCESSABLE_ENTITY
					);
				}
				
				if (error.code === 'ECONNABORTED') {
					throw new HttpException(
						{
							statusCode: 408,
							message: 'Solver timeout',
							diagnostics: { status: 'timeout' },
						},
						HttpStatus.REQUEST_TIMEOUT
					);
				}
			}
			
			throw new HttpException(
				{
					statusCode: 500,
					message: 'Solver communication error',
					diagnostics: { status: 'error', message: error instanceof Error ? error.message : String(error) },
				},
				HttpStatus.INTERNAL_SERVER_ERROR
			);
		}
	}

	async solveRepair(request: RepairRequest): Promise<SolverResponse> {
		try {
			this.logger.log(`Sending solve_repair request for ward ${request.wards[0]?.id}`);
			
			const response: AxiosResponse<SolverResponse> = await axios.post(
				`${this.solverUrl}/solve_repair`,
				request,
				{
					timeout: request.timeBudgetMs || 60000, // 1 minute default for repair
					headers: {
						'Content-Type': 'application/json',
					},
				}
			);

			this.logger.log(`Repair completed in ${response.data.metrics.solveMs}ms`);
			return response.data;
		} catch (error) {
			this.logger.error(`Solver repair error: ${error instanceof Error ? error.message : String(error)}`);
			
			if (axios.isAxiosError(error)) {
				if (error.response?.status === 422) {
					throw new HttpException(
						{
							statusCode: 422,
							message: 'Solver found repair infeasible',
							diagnostics: error.response.data,
						},
						HttpStatus.UNPROCESSABLE_ENTITY
					);
				}
				
				if (error.code === 'ECONNABORTED') {
					throw new HttpException(
						{
							statusCode: 408,
							message: 'Solver repair timeout',
							diagnostics: { status: 'timeout' },
						},
						HttpStatus.REQUEST_TIMEOUT
					);
				}
			}
			
			throw new HttpException(
				{
					statusCode: 500,
					message: 'Solver repair communication error',
					diagnostics: { status: 'error', message: error instanceof Error ? error.message : String(error) },
				},
				HttpStatus.INTERNAL_SERVER_ERROR
			);
		}
	}
}
