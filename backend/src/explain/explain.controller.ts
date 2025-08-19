import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ExplainService } from './explain.service.js';
import { ExplainQueryDto } from './dto/explain-query.dto.js';
import { ApplyAlternativeDto } from './dto/apply-alternative.dto.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { Role } from '../auth/roles.enum.js';

@ApiTags('Explain')
@ApiBearerAuth()
@Controller('explain')
@UseGuards(RolesGuard)
export class ExplainController {
  constructor(private readonly explainService: ExplainService) {}

  @Get()
  @Roles(Role.PLANNER)
  @ApiOperation({ summary: 'Get explanation for an assignment' })
  @ApiResponse({ 
    status: 200, 
    description: 'Explanation retrieved successfully',
    schema: {
      example: {
        reasons: [
          'Staff member has required skills for this shift',
          'Fairness balance maintained across the schedule',
          'No conflicts with existing assignments'
        ],
        alternatives: [
          {
            id: 'alt-1',
            staffId: 'staff-456',
            staffName: 'Dr. John Doe',
            staffRole: 'doctor',
            fairnessDelta: 0.15,
            newBreaches: [],
            reason: 'Alternative staff member with similar skills'
          },
          {
            id: 'alt-2',
            staffId: 'staff-789',
            staffName: 'Nurse Sarah Wilson',
            staffRole: 'nurse',
            fairnessDelta: -0.05,
            newBreaches: [
              {
                date: '2024-01-16',
                slot: 'Night',
                severity: 'low',
                description: 'Slight under-coverage in Night shift'
              }
            ],
            reason: 'Nurse with required skills but creates minor breach'
          }
        ],
        currentAssignment: {
          staffId: 'staff-123',
          staffName: 'Dr. Jane Smith',
          staffRole: 'doctor',
          shiftType: 'Early'
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 404, description: 'Assignment not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  explain(@Query() query: ExplainQueryDto) {
    return this.explainService.explain(query);
  }

  @Post('apply')
  @Roles(Role.PLANNER)
  @ApiOperation({ summary: 'Apply an alternative assignment' })
  @ApiResponse({ 
    status: 200, 
    description: 'Alternative applied successfully',
    schema: {
      example: {
        success: true,
        message: 'Alternative applied successfully',
        scheduleId: 'schedule-456',
        alternativeId: 'alt-1'
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 404, description: 'Schedule or alternative not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  applyAlternative(@Body() applyDto: ApplyAlternativeDto) {
    return this.explainService.applyAlternative(applyDto);
  }
}
