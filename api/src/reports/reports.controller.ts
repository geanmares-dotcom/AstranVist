import { Controller, Get, Param, Res, UseGuards, StreamableFile } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('reports')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('inspection/:id')
  // @UseGuards(JwtAuthGuard) // Comentado para facilitar teste inicial
  async downloadReport(@Param('id') id: string, @Res() res: Response) {
    const tenantId = 'test-tenant'; // Em prod viria do token
    const { buffer, filename } = await this.reportsService.generateInspectionReport(id, tenantId);
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }
}

