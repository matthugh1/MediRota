import { Controller, Get, Post, Body, Param, Put, Delete, Query, UseGuards } from '@nestjs/common';
import { HospitalsService } from './hospitals.service.js';
import { CreateHospitalDto } from './dto/create-hospital.dto.js';
import { UpdateHospitalDto } from './dto/update-hospital.dto.js';
import { QueryHospitalDto } from './dto/query-hospital.dto.js';
import { RolesGuard } from '../auth/roles.guard.js';

@Controller('hospitals')
export class HospitalsController {
  constructor(private readonly hospitalsService: HospitalsService) {}

  @Get()
  async findAll(@Query() queryDto: QueryHospitalDto) {
    return this.hospitalsService.findAll(queryDto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.hospitalsService.findOne(id);
  }

  @Post()
  async create(@Body() createHospitalDto: CreateHospitalDto) {
    return this.hospitalsService.create(createHospitalDto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateHospitalDto: UpdateHospitalDto) {
    return this.hospitalsService.update(id, updateHospitalDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.hospitalsService.remove(id);
  }
}
