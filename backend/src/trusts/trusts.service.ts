import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateTrustDto } from './dto/create-trust.dto.js';
import { UpdateTrustDto } from './dto/update-trust.dto.js';

@Injectable()
export class TrustsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.trust.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const trust = await this.prisma.trust.findUnique({
      where: { id },
    });

    if (!trust) {
      throw new NotFoundException(`Trust with ID ${id} not found`);
    }

    return trust;
  }

  async create(createTrustDto: CreateTrustDto) {
    return this.prisma.trust.create({
      data: createTrustDto,
    });
  }

  async update(id: string, updateTrustDto: UpdateTrustDto) {
    await this.findOne(id);

    return this.prisma.trust.update({
      where: { id },
      data: updateTrustDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.trust.delete({
      where: { id },
    });
  }
}
