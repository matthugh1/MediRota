import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards } from '@nestjs/common';
import { TrustsService } from './trusts.service.js';
import { CreateTrustDto } from './dto/create-trust.dto.js';
import { UpdateTrustDto } from './dto/update-trust.dto.js';
import { RolesGuard } from '../auth/roles.guard.js';

@Controller('trusts')
@UseGuards(RolesGuard)
export class TrustsController {
  constructor(private readonly trustsService: TrustsService) {}

  @Get()
  async findAll() {
    return this.trustsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.trustsService.findOne(id);
  }

  @Post()
  async create(@Body() createTrustDto: CreateTrustDto) {
    return this.trustsService.create(createTrustDto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateTrustDto: UpdateTrustDto) {
    return this.trustsService.update(id, updateTrustDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.trustsService.remove(id);
  }
}
