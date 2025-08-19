import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateLockDto } from './dto/create-lock.dto.js';
import { QueryLocksDto } from './dto/query-locks.dto.js';

@Injectable()
export class LocksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createLockDto: CreateLockDto) {
    // Get the schedule to find the wardId
    const schedule = await this.prisma.schedule.findUnique({
      where: { id: createLockDto.scheduleId },
      select: { wardId: true }
    });

    if (!schedule) {
      throw new Error('Schedule not found');
    }

    return this.prisma.lock.create({
      data: {
        scheduleId: createLockDto.scheduleId,
        staffId: createLockDto.staffId,
        wardId: schedule.wardId,
        date: new Date(createLockDto.date),
        slot: createLockDto.slot,
      },
    });
  }

  async findAll(query: QueryLocksDto) {
    const where: any = {};
    
    if (query.scheduleId) {
      where.scheduleId = query.scheduleId;
    }

    return this.prisma.lock.findMany({
      where,
    });
  }

  async findOne(id: string) {
    return this.prisma.lock.findUnique({
      where: { id },
    });
  }

  async remove(id: string) {
    return this.prisma.lock.delete({
      where: { id },
    });
  }
}
