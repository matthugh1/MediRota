import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ExplainQueryDto } from './dto/explain-query.dto.js';
import { ApplyAlternativeDto } from './dto/apply-alternative.dto.js';
import { OrgCompatService } from '../common/org-compat.service.js';

@Injectable()
export class ExplainService {
  constructor(
    private readonly prisma: PrismaService,
    private orgCompatService: OrgCompatService,
  ) {}

  async explain(query: ExplainQueryDto) {
    // This is a placeholder implementation
    // In a real implementation, this would call the solver to get explain data
    
    // Apply hospital filter if provided and hierarchy is enabled
    const where = this.orgCompatService.applyHospitalFilter({
      scheduleId: query.scheduleId,
      staffId: query.staffId,
      date: query.date,
      slot: query.slot,
    }, query.hospitalId);

    const currentAssignment = await this.prisma.assignment.findFirst({
      where,
      include: {
        staff: true,
        shiftType: true,
      },
    });

    if (!currentAssignment) {
      throw new Error('Assignment not found');
    }

    // Mock explain data - in reality this would come from the solver
    return {
      reasons: [
        'Staff member has required skills for this shift',
        'Fairness balance maintained across the schedule',
        'No conflicts with existing assignments',
      ],
      alternatives: [
        {
          id: 'alt-1',
          staffId: 'staff-456',
          staffName: 'Dr. John Doe',
          staffRole: 'doctor',
          fairnessDelta: 0.15,
          newBreaches: [],
          reason: 'Alternative staff member with similar skills',
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
              severity: 'low' as const,
              description: 'Slight under-coverage in Night shift',
            },
          ],
          reason: 'Nurse with required skills but creates minor breach',
        },
      ],
      currentAssignment: {
        staffId: currentAssignment.staffId,
        staffName: currentAssignment.staff.fullName,
        staffRole: currentAssignment.staff.role,
        shiftType: currentAssignment.shiftType.name,
      },
    };
  }

  async applyAlternative(applyDto: ApplyAlternativeDto) {
    // This is a placeholder implementation
    // In a real implementation, this would validate and apply the alternative
    // through the solver and update the schedule
    
    // For now, just return success
    return {
      success: true,
      message: 'Alternative applied successfully',
      scheduleId: applyDto.scheduleId,
      alternativeId: applyDto.alternativeId,
    };
  }
}
