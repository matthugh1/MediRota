import { Controller, Post, Body, UseGuards, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SolveService } from './solve.service.js';
import { SolveDto } from './dto/solve.dto.js';
import { RepairDto } from './dto/repair.dto.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Role } from '../auth/roles.enum.js';
import * as fs from 'fs';
import * as path from 'path';

@ApiTags('solve')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller('solve')
export class SolveController {
	constructor(private readonly solveService: SolveService) {}

	@Post()
	@ApiOperation({ 
		summary: 'Solve a schedule',
		description: 'Generate a complete schedule by calling the Python solver'
	})
	@ApiResponse({ 
		status: 200, 
		description: 'Schedule solved successfully',
		schema: {
			example: {
				schedule: {
					id: 'uuid',
					wardId: 'uuid',
					horizonStart: '2024-01-01T00:00:00Z',
					horizonEnd: '2024-01-31T23:59:59Z',
					status: 'draft',
					metrics: {
						objective: 150.5,
						unfilledDemand: 0,
						hardViolations: 0,
						fairnessScore: 85.2,
						preferenceScore: 92.1,
						solveTimeMs: 45000
					}
				},
				assignmentsCount: 124,
				metrics: {
					hardViolations: 0,
					solveMs: 45000,
					fairnessNightStd: 0.8,
					preferenceSatisfaction: 0.92
				},
				diagnostics: {
					unfilled: [],
					infeasible: false,
					notes: ['Solution found successfully']
				}
			}
		}
	})
	@ApiResponse({ 
		status: 422, 
		description: 'Solver found problem infeasible',
		schema: {
			example: {
				statusCode: 422,
				message: 'Solver found problem infeasible',
				diagnostics: {
					unfilled: [
						{
							wardId: 'uuid',
							date: '2024-01-15',
							slot: 'Night',
							skill: 'Resus',
							required: 2,
							filled: 1
						}
					],
					infeasible: true,
					notes: ['Insufficient staff with required skills']
				}
			}
		}
	})
	@ApiResponse({ 
		status: 408, 
		description: 'Solver timeout',
		schema: {
			example: {
				statusCode: 408,
				message: 'Solver timeout',
				diagnostics: { 
					unfilled: [],
					infeasible: false,
					notes: ['Solver timeout']
				}
			}
		}
	})
	@ApiResponse({ status: 404, description: 'Schedule not found' })
	solve(@Body() solveDto: SolveDto) {
		return this.solveService.solve(solveDto);
	}

	@Post('repair')
	@ApiOperation({ 
		summary: 'Repair a schedule',
		description: 'Repair a schedule after events (staff unavailable, demand changes, etc.)'
	})
	@ApiResponse({ 
		status: 200, 
		description: 'Schedule repaired successfully',
		schema: {
			example: {
				schedule: {
					id: 'uuid',
					wardId: 'uuid',
					horizonStart: '2024-01-01T00:00:00Z',
					horizonEnd: '2024-01-31T23:59:59Z',
					status: 'draft',
					metrics: {
						objective: 155.2,
						unfilledDemand: 0,
						hardViolations: 0,
						fairnessScore: 83.1,
						preferenceScore: 89.5,
						solveTimeMs: 12000
					}
				},
				assignmentsCount: 124,
				metrics: {
					hardViolations: 0,
					solveMs: 12000,
					fairnessNightStd: 0.9,
					preferenceSatisfaction: 0.89
				},
				diagnostics: {
					unfilled: [],
					infeasible: false,
					notes: ['Repair completed successfully']
				}
			}
		}
	})
	@ApiResponse({ 
		status: 422, 
		description: 'Solver found repair infeasible',
		schema: {
			example: {
				statusCode: 422,
				message: 'Solver found repair infeasible',
				diagnostics: {
					unfilled: [
						{
							wardId: 'uuid',
							date: '2024-01-15',
							slot: 'Night',
							skill: 'Ventilator',
							required: 6,
							filled: 4
						}
					],
					infeasible: true,
					notes: ['Cannot repair schedule with current events']
				}
			}
		}
	})
	@ApiResponse({ 
		status: 408, 
		description: 'Solver repair timeout',
		schema: {
			example: {
				statusCode: 408,
				message: 'Solver repair timeout',
				diagnostics: { 
					unfilled: [],
					infeasible: false,
					notes: ['Solver repair timeout']
				}
			}
		}
	})
	@ApiResponse({ status: 404, description: 'Schedule not found' })
	repair(@Body() repairDto: RepairDto) {
		return this.solveService.repair(repairDto);
	}

	@Get('_debug/last')
	@ApiOperation({ 
		summary: 'Get last solver request/response for debugging',
		description: 'Returns the last solver request and response files if DEBUG_SOLVER=true'
	})
	@ApiResponse({ 
		status: 200, 
		description: 'Debug information retrieved successfully'
	})
	@ApiResponse({ 
		status: 404, 
		description: 'Debug files not found or DEBUG_SOLVER not enabled'
	})
	getDebugLast() {
		const debugEnabled = process.env.DEBUG_SOLVER === 'true';
		if (!debugEnabled) {
			return { error: 'DEBUG_SOLVER not enabled' };
		}

		const requestPath = path.join(process.cwd(), 'debug', 'last-solver-request.json');
		const responsePath = path.join(process.cwd(), 'debug', 'last-solver-response.json');

		try {
			const request = fs.existsSync(requestPath) ? JSON.parse(fs.readFileSync(requestPath, 'utf8')) : null;
			const response = fs.existsSync(responsePath) ? JSON.parse(fs.readFileSync(responsePath, 'utf8')) : null;

			return {
				request,
				response,
				timestamp: new Date().toISOString()
			};
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { error: `Failed to read debug files: ${errorMessage}` };
		}
	}
}
