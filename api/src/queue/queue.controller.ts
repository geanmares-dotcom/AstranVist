import { Controller, Get, Post, Param, UseGuards, Body } from '@nestjs/common';
import { QueueService } from './queue.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, AnalysisStatus } from '../common/enums';
import { GetUser } from '../auth/decorators/get-user.decorator';


@Controller('queue')
@UseGuards(JwtAuthGuard, RolesGuard)
export class QueueController {


  constructor(private readonly queueService: QueueService) {}

  @Get('available')
  @Roles(UserRole.ANALYST, UserRole.SUPERVISOR, UserRole.ADMIN)
  getAvailable(@GetUser('tenantId') tenantId: string) {
    return this.queueService.getAvailable(tenantId);
  }

  @Get('finished')
  @Roles(UserRole.ANALYST, UserRole.SUPERVISOR, UserRole.ADMIN)
  getFinished(@GetUser('tenantId') tenantId: string) {
    return this.queueService.getFinished(tenantId);
  }

  @Get('stats/daily')
  @Roles(UserRole.ANALYST, UserRole.SUPERVISOR, UserRole.ADMIN)
  getDailyStats(@GetUser('tenantId') tenantId: string) {
    return this.queueService.getDailyStats(tenantId);
  }

  @Get('stats/me')
  @Roles(UserRole.ANALYST, UserRole.SUPERVISOR, UserRole.ADMIN)
  getMyStats(
    @GetUser('userId') userId: string,
    @GetUser('tenantId') tenantId: string
  ) {
    return this.queueService.getMyStats(userId, tenantId);
  }

  @Get('pending-collection')
  @Roles(UserRole.ANALYST, UserRole.SUPERVISOR, UserRole.ADMIN)
  getPendingCollection(@GetUser('tenantId') tenantId: string) {
    return this.queueService.getPendingCollection(tenantId);
  }





  @Post(':inspectionId/assign')
  @Roles(UserRole.ANALYST, UserRole.SUPERVISOR, UserRole.ADMIN)
  assign(
    @Param('inspectionId') inspectionId: string,
    @GetUser('userId') userId: string,
    @GetUser('tenantId') tenantId: string,
  ) {
    return this.queueService.assign(inspectionId, userId, tenantId);
  }

  @Post(':inspectionId/release')
  @Roles(UserRole.ANALYST, UserRole.SUPERVISOR, UserRole.ADMIN)
  release(
    @Param('inspectionId') inspectionId: string,
    @GetUser('tenantId') tenantId: string,
  ) {
    return this.queueService.release(inspectionId, tenantId);
  }

  @Post(':inspectionId/finish')
  @Roles(UserRole.ANALYST, UserRole.SUPERVISOR, UserRole.ADMIN)
  finish(
    @Param('inspectionId') inspectionId: string,
    @Body('status') status: AnalysisStatus,
    @Body('comment') comment: string,
    @GetUser('tenantId') tenantId: string,
  ) {
    return this.queueService.finish(inspectionId, status, tenantId, comment);
  }

}
