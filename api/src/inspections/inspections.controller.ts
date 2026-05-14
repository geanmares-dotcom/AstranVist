import { Controller, Get, Post, Body, Param, Patch, UseGuards, Query } from '@nestjs/common';

import { InspectionsService } from './inspections.service';
import { CreateInspectionDto } from './dto/create-inspection.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, InspectionStatus } from '../common/enums';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('inspections')
export class InspectionsController {
  constructor(private readonly inspectionsService: InspectionsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OPERATOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  create(
    @Body() dto: CreateInspectionDto,
    @GetUser('userId') userId: string,
    @GetUser('tenantId') tenantId: string,
  ) {
    return this.inspectionsService.create(dto, userId, tenantId);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  findAll(
    @GetUser('tenantId') tenantId: string,
    @Query() filters: any,
  ) {
    return this.inspectionsService.findAll(tenantId, filters);
  }


  // Rota administrativa para ver detalhes (com tenantId)
  @Get('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  findOneAdmin(@Param('id') id: string, @GetUser('tenantId') tenantId: string) {
    return this.inspectionsService.findOne(id, tenantId);
  }

  // Rota PÚBLICA para o cliente ver dados básicos da vistoria
  @Get(':id')
  async findOnePublic(@Param('id') id: string) {
    return this.inspectionsService.findOnePublic(id);
  }

  @Post('public/:id/mark-accessed')
  markAsAccessed(@Param('id') id: string) {
    return this.inspectionsService.markAsAccessed(id);
  }

  @Post('public/:id/mark-started')
  markAsStarted(@Param('id') id: string) {
    return this.inspectionsService.markAsStarted(id);
  }


  @Post(':id/photos')
  // Endpoint público para o cliente enviar fotos
  async addPhotos(
    @Param('id') id: string,
    @Body('photos') photos: any[],
  ) {
    const inspection = await this.inspectionsService.findOnePublic(id);
    return this.inspectionsService.addPhotos(id, photos, inspection.tenantId);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ANALYST, UserRole.SUPERVISOR, UserRole.ADMIN)
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: InspectionStatus,
    @GetUser('tenantId') tenantId: string,
  ) {
    return this.inspectionsService.updateStatus(id, tenantId, status);
  }

  @Get('pending/initial')
  @UseGuards(JwtAuthGuard, RolesGuard)
  getInitialPending(@GetUser('tenantId') tenantId: string) {
    return this.inspectionsService.getInitialPending(tenantId);
  }

  @Get('stats/dashboard')
  @UseGuards(JwtAuthGuard, RolesGuard)
  getDashboardStats(@GetUser('tenantId') tenantId: string) {
    return this.inspectionsService.getDashboardStats(tenantId);
  }
}
