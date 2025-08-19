import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateDemandDto } from './dto/create-demand.dto.js';
import { UpdateDemandDto } from './dto/update-demand.dto.js';
import { QueryDemandDto } from './dto/query-demand.dto.js';
import { OrgCompatService } from '../common/org-compat.service.js';

@Injectable()
export class DemandService {
  constructor(
    private readonly prisma: PrismaService,
    private orgCompatService: OrgCompatService,
  ) {}

  async create(createDemandDto: CreateDemandDto) {
    return this.prisma.demand.create({
      data: {
        wardId: createDemandDto.wardId,
        date: new Date(createDemandDto.date),
        slot: createDemandDto.slot,
        requiredBySkill: createDemandDto.requiredBySkill,
        granularity: createDemandDto.hourlyGranularity ? 'hour' : 'shift',
      },
    });
  }

  async findAll(query: QueryDemandDto) {
    const where: any = {};
    
    if (query.wardId) {
      where.wardId = query.wardId;
    }
    
    if (query.startDate && query.endDate) {
      // Parse ISO strings and extract just the date part for comparison
      const startDate = new Date(query.startDate);
      const endDate = new Date(query.endDate);
      
      where.date = {
        gte: startDate,
        lte: endDate,
      };
    }

    // Apply hospital filter if provided and hierarchy is enabled
    const finalWhere = this.orgCompatService.applyHospitalFilter(where, query.hospitalId);

    return this.prisma.demand.findMany({
      where: finalWhere,
      include: {
        ward: true,
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.demand.findUnique({
      where: { id },
      include: {
        ward: true,
      },
    });
  }

  async update(id: string, updateDemandDto: UpdateDemandDto) {
    return this.prisma.demand.update({
      where: { id },
      data: updateDemandDto,
      include: {
        ward: true,
      },
    });
  }

  async remove(id: string) {
    return this.prisma.demand.delete({
      where: { id },
    });
  }
}
