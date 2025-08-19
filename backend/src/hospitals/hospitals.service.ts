import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateHospitalDto } from './dto/create-hospital.dto.js';
import { UpdateHospitalDto } from './dto/update-hospital.dto.js';
import { QueryHospitalDto } from './dto/query-hospital.dto.js';

@Injectable()
export class HospitalsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(queryDto: QueryHospitalDto) {
    const where: any = {};
    
    if (queryDto.trustId) {
      where.trustId = queryDto.trustId;
    }

    return this.prisma.hospital.findMany({
      where,
      include: {
        trust: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const hospital = await this.prisma.hospital.findUnique({
      where: { id },
      include: {
        trust: true,
      },
    });

    if (!hospital) {
      throw new NotFoundException(`Hospital with ID ${id} not found`);
    }

    return hospital;
  }

  async create(createHospitalDto: CreateHospitalDto) {
    return this.prisma.hospital.create({
      data: createHospitalDto,
      include: {
        trust: true,
      },
    });
  }

  async update(id: string, updateHospitalDto: UpdateHospitalDto) {
    await this.findOne(id);

    return this.prisma.hospital.update({
      where: { id },
      data: updateHospitalDto,
      include: {
        trust: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.hospital.delete({
      where: { id },
    });
  }
}
