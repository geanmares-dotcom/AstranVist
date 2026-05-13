import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInspectionDto } from './dto/create-inspection.dto';
import { InspectionStatus } from '../common/enums';

@Injectable()
export class InspectionsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateInspectionDto, userId: string, tenantId: string) {
    try {
      const protocol = `VIST-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

      const inspection = await this.prisma.inspection.create({
        data: {
          ...dto,
          protocol,
          tenantId,
          createdById: userId,
          status: InspectionStatus.AGUARDANDO_COLETA,
        },
      });

      const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const shareLink = `${baseUrl}/coleta/${inspection.id}`;

      return {
        ...inspection,
        shareLink,
      };
    } catch (error) {
      console.error('Erro ao criar vistoria (DETALHADO):', error);
      throw new Error(`Falha na criação da vistoria: ${error.message}`);
    }
  }

  async addPhotos(id: string, photos: { categoria: string; url: string; latitude?: number; longitude?: number }[], tenantId: string) {
    const inspection = await this.findOnePublic(id);

    await this.prisma.inspectionPhoto.createMany({
      data: photos.map(p => ({
        ...p,
        inspectionId: inspection.id,
      })),
    });

    await this.prisma.inspection.update({
      where: { id: inspection.id },
      data: { status: InspectionStatus.ENVIADO }
    });

    return this.prisma.queue.upsert({
      where: { inspectionId: inspection.id },
      update: { 
        status: 'EM_ANDAMENTO',
        lockedAt: null,
        assignedToId: null 
      },
      create: {
        inspectionId: inspection.id,
        status: 'EM_ANDAMENTO'
      }
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.inspection.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: {
          select: { name: true, email: true }
        }
      }
    });
  }

  async findOnePublic(id: string) {
    const inspection = await this.prisma.inspection.findUnique({
      where: { id },
    });
    if (!inspection) throw new NotFoundException('Vistoria não encontrada');
    return inspection;
  }

  async findOne(id: string, tenantId: string) {
    const inspection = await this.prisma.inspection.findFirst({
      where: { id, tenantId },
      include: {
        photos: true,
        queue: true,
      },
    });

    if (!inspection) throw new NotFoundException('Vistoria não encontrada');
    return inspection;
  }

  async updateStatus(id: string, tenantId: string, status: InspectionStatus) {
    const inspection = await this.findOne(id, tenantId);

    return this.prisma.inspection.update({
      where: { id: inspection.id },
      data: { status },
    });
  }

  async getInitialPending(tenantId: string) {
    return this.prisma.inspection.findMany({
      where: {
        tenantId,
        status: InspectionStatus.AGUARDANDO_COLETA
      },
      include: {
        createdBy: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getDashboardStats(tenantId: string) {
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);

    const statusCounts = await this.prisma.inspection.groupBy({
      by: ['status'],
      where: { tenantId },
      _count: { _all: true }
    });

    const dailyVolume = await this.prisma.inspection.groupBy({
      by: ['createdAt'],
      where: {
        tenantId,
        createdAt: { gte: sevenDaysAgo }
      },
      _count: { _all: true }
    });

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    
    const analystRanking = await this.prisma.queue.groupBy({
      by: ['assignedToId'],
      where: {
        inspection: { tenantId },
        status: { in: ['FINALIZADO', 'REPROVADO', 'APROVADO_COM_RESSALVA'] },
        updatedAt: { gte: startOfToday }
      },
      _count: { _all: true },
      orderBy: { _count: { assignedToId: 'desc' } },
      take: 5
    });

    const formattedRanking = await Promise.all(analystRanking.map(async (r) => {
      if (!r.assignedToId) return null;
      const user = await this.prisma.user.findUnique({ where: { id: r.assignedToId }, select: { name: true } });
      return { name: user?.name, count: r._count._all };
    }));

    return {
      statusDistribution: statusCounts.map(s => ({ status: s.status, count: s._count._all })),
      dailyVolume: dailyVolume.map(v => ({ date: v.createdAt, count: v._count._all })),
      topAnalysts: formattedRanking.filter(Boolean)
    };
  }
}
