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

    // Remove fotos existentes para as categorias enviadas para evitar duplicidade
    const categories = photos.map(p => p.categoria);
    await this.prisma.inspectionPhoto.deleteMany({
      where: {
        inspectionId: inspection.id,
        categoria: { in: categories }
      }
    });

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

  // Busca avançada com filtros
  async findAll(tenantId: string, filters?: any) {
    const where: any = { tenantId };

    if (filters) {
      // Filtro de texto (Placa, Cliente, Chassi, Protocolo)
      if (filters.searchType && filters.searchValue) {
        where[filters.searchType] = { contains: filters.searchValue };
      }

      // Filtro de Status
      if (filters.status) {
        where.status = filters.status;
      }

      // Filtro de Tipo de Veículo
      if (filters.tipoVeiculo) {
        where.tipoVeiculo = filters.tipoVeiculo;
      }

      // Filtro de Período
      if (filters.startDate || filters.endDate) {
        where.createdAt = {};
        if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
        if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
      }
    }

    return this.prisma.inspection.findMany({
      where,
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

  async markAsAccessed(id: string) {
    const inspection = await this.prisma.inspection.findUnique({ where: { id } });
    if (!inspection) return;

    // Só muda se ainda estiver no estado inicial
    if (inspection.status === InspectionStatus.AGUARDANDO_COLETA) {
      return this.prisma.inspection.update({
        where: { id },
        data: { status: InspectionStatus.COLETA_ACESSADA }
      });
    }
    return inspection;
  }

  async markAsStarted(id: string) {
    const inspection = await this.prisma.inspection.findUnique({ where: { id } });
    if (!inspection) return;

    if (inspection.status === InspectionStatus.COLETA_ACESSADA || inspection.status === InspectionStatus.AGUARDANDO_COLETA) {
      return this.prisma.inspection.update({
        where: { id },
        data: { status: InspectionStatus.COLETA_EM_ANDAMENTO }
      });
    }
    return inspection;
  }


  async getInitialPending(tenantId: string) {
    return this.prisma.inspection.findMany({
      where: {
        tenantId,
        status: {
          in: [
            InspectionStatus.AGUARDANDO_COLETA,
            InspectionStatus.COLETA_ACESSADA,
            InspectionStatus.COLETA_EM_ANDAMENTO
          ]
        }
      },
      include: {
        createdBy: { select: { name: true } }
      },
      orderBy: { updatedAt: 'desc' }
    });
  }


  async getDashboardStats(tenantId: string) {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const rawStatusCounts = await this.prisma.inspection.groupBy({
      by: ['status'],
      where: { 
        tenantId,
        createdAt: { gte: startOfMonth }
      },
      _count: { _all: true }
    });

    const statusMap: Record<string, number> = {
      'Aprovadas': 0,
      'Aguardando Nova Coleta': 0,
      'Enviadas': 0,
      'Reprovadas': 0,
      'Criadas': 0
    };

    rawStatusCounts.forEach(s => {
      statusMap['Criadas'] += s._count._all;
      
      if (s.status === 'FINALIZADO' || s.status === 'APROVADO_COM_RESSALVA' || s.status === 'APROVADO') {
        statusMap['Aprovadas'] += s._count._all;
      } else if (s.status === 'NOVA_COLETA') {
        statusMap['Aguardando Nova Coleta'] += s._count._all;
      } else if (s.status === 'ENVIADO' || s.status === 'EM_ANDAMENTO') {
        statusMap['Enviadas'] += s._count._all;
      } else if (s.status === 'REPROVADO') {
        statusMap['Reprovadas'] += s._count._all;
      }
    });

    const inspectionsThisMonth = await this.prisma.inspection.findMany({
      where: {
        tenantId,
        createdAt: { gte: startOfMonth }
      },
      select: { createdAt: true }
    });

    const dailyMap: Record<string, number> = {};
    inspectionsThisMonth.forEach(i => {
      const day = i.createdAt.toISOString().split('T')[0];
      dailyMap[day] = (dailyMap[day] || 0) + 1;
    });

    const dailyVolume = Object.entries(dailyMap).map(([date, count]) => ({ date, count }));

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

    const mesaCount = await this.prisma.queue.count({
      where: {
        inspection: { tenantId },
        status: 'EM_ANDAMENTO'
      }
    });

    return {
      statusDistribution: Object.entries(statusMap).map(([label, count]) => ({ status: label, count })),
      dailyVolume: dailyVolume,
      topAnalysts: formattedRanking.filter(Boolean),
      summary: {
        criadas: statusMap['Criadas'],
        mesa: mesaCount,
        concluidas: statusMap['Aprovadas'] + statusMap['Reprovadas']
      }
    };
  }
}
