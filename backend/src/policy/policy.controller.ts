import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  Query,
  HttpCode,
  HttpStatus,
  Inject,
  forwardRef
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { PolicyService } from './policy.service.js';
import { CreatePolicyDto, UpdatePolicyDto } from './dto/index.js';
import { PolicyEntity } from './entities/policy.entity.js';
import { SolveService } from '../solve/solve.service.js';


@ApiTags('Policy')
@Controller('api/policy')
export class PolicyController {
  constructor(
    private readonly policyService: PolicyService,
    @Inject(forwardRef(() => SolveService))
    private readonly solveService: SolveService
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new policy' })
  @ApiResponse({ status: 201, description: 'Policy created successfully', type: PolicyEntity })
  create(@Body() createPolicyDto: CreatePolicyDto) {
    return this.policyService.create(createPolicyDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all policies' })
  @ApiResponse({ status: 200, description: 'List of policies', type: [PolicyEntity] })
  findAll() {
    return this.policyService.findAll();
  }

  @Get('effective')
  @ApiOperation({ summary: 'Get effective policy for given scope' })
  @ApiQuery({ name: 'wardId', required: false, description: 'Ward ID for WARD scope' })
  @ApiResponse({ status: 200, description: 'Effective policy', type: PolicyEntity })
  getEffective(
    @Query('wardId') wardId?: string,
  ) {
    return this.policyService.getEffectivePolicy({ wardId });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get policy by ID' })
  @ApiResponse({ status: 200, description: 'Policy found', type: PolicyEntity })
  findOne(@Param('id') id: string) {
    return this.policyService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update policy' })
  @ApiResponse({ status: 200, description: 'Policy updated successfully', type: PolicyEntity })
  update(@Param('id') id: string, @Body() updatePolicyDto: UpdatePolicyDto) {
    return this.policyService.update(id, updatePolicyDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deactivate policy' })
  @ApiResponse({ status: 204, description: 'Policy deactivated successfully' })
  remove(@Param('id') id: string) {
    return this.policyService.remove(id);
  }



  @Post('test')
  @ApiOperation({ summary: 'Test policy with solver' })
  @ApiResponse({ 
    status: 200, 
    description: 'Policy test completed',
    schema: {
      example: {
        coverage: 95.5,
        solveTime: 2500,
        status: 'success',
        assignments: 24,
        unmet: 2
      }
    }
  })
  async testPolicy(@Body() body: { policy: CreatePolicyDto }) {
    try {
      // Use an existing schedule for policy testing
      const solveRequest = {
        scheduleId: '9df124d5-db2a-44ac-9962-603083ffc68e', // Use the demo schedule
        policy: body.policy,
        timeBudgetMs: body.policy.timeBudgetMs || 30000
      };

      const startTime = Date.now();
      
      // Call the solver service
      const result = await this.solveService.solve(solveRequest);
      
      const solveTime = Date.now() - startTime;

      // Extract metrics from the result
      const assignments = result.assignmentsCount || 0;
      const hardViolations = result.metrics?.hardViolations || 0;
      const coverage = assignments > 0 ? ((assignments - hardViolations) / assignments) * 100 : 0;

      return {
        coverage: Math.round(coverage * 10) / 10,
        solveTime,
        status: 'success',
        assignments,
        unmet: hardViolations,
        objective: result.metrics?.solveMs || 0
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        coverage: 0,
        solveTime: 0,
        status: 'error',
        assignments: 0,
        unmet: 0,
        error: errorMessage
      };
    }
  }
}
