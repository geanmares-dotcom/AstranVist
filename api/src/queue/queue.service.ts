import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AnalysisStatus } from '../common/enums';

@Injectable()
export class QueueService {
  constructor(private readonly prisma: PrismaService) {}

  // Lista vistorias aguardando análise (em aberto ou assumidas)
  async getAvailable(tenantId: string) {
    return this.prisma.queue.findMany({
      where: {
        inspection: { tenantId },
        status: {
          in: [AnalysisStatus.EM_ANDAMENTO]
        }
      },
      include: {
        inspection: {
          include: {
            createdBy: {
              select: { name: true }
            }
          }
        },
        assignedTo: {
          select: { name: true }
        }
      },
      orderBy: { updatedAt: 'asc' }
    });
  }

  // Lista vistorias já finalizadas
  async getFinished(tenantId: string) {
    return this.prisma.queue.findMany({
      where: {
        inspection: { tenantId },
        status: {
          in: [AnalysisStatus.FINALIZADO, AnalysisStatus.REPROVADO, AnalysisStatus.APROVADO_COM_RESSALVA]
        }
      },

      include: {
        inspection: {
          include: {
            createdBy: { select: { name: true } }
          }
        },
        assignedTo: {
          select: { name: true }
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: 50
    });
  }

  // Lista vistorias que estão aguardando nova coleta do cliente
  async getPendingCollection(tenantId: string) {
    return this.prisma.queue.findMany({
      where: {
        inspection: { tenantId },
        status: AnalysisStatus.NOVA_COLETA
      },
      include: {
        inspection: {
          include: {
            createdBy: { select: { name: true } }
          }
        },
        assignedTo: {
          select: { name: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });
  }

  // Estatísticas de produtividade do dia
  async getDailyStats(tenantId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats = await this.prisma.queue.groupBy({
      by: ['assignedToId'],
      where: {
        inspection: { tenantId },
        status: { in: [AnalysisStatus.FINALIZADO, AnalysisStatus.REPROVADO, AnalysisStatus.NOVA_COLETA, AnalysisStatus.APROVADO_COM_RESSALVA] },
        updatedAt: { gte: today }
      },

      _count: {
        _all: true
      }
    });

    // Busca os nomes dos analistas
    const results = await Promise.all(stats.map(async (s) => {
      if (!s.assignedToId) return null;
      const user = await this.prisma.user.findUnique({ where: { id: s.assignedToId }, select: { name: true } });
      return {
        name: user?.name || 'Desconhecido',
        count: s._count._all
      };
    }));

    return results.filter(r => r !== null).sort((a, b) => b.count - a.count);
  }

  // Estatísticas pessoais do analista logado
  async getMyStats(userId: string, tenantId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const count = await this.prisma.queue.count({
      where: {
        assignedToId: userId,
        inspection: { tenantId },
        status: { in: [AnalysisStatus.FINALIZADO, AnalysisStatus.REPROVADO, AnalysisStatus.NOVA_COLETA, AnalysisStatus.APROVADO_COM_RESSALVA] },
        updatedAt: { gte: today }
      }

    });

    return { count };
  }

  // Analista assume uma vistoria
  async assign(inspectionId: string, userId: string, tenantId: string) {
    const queueItem = await this.prisma.queue.findFirst({
      where: { inspectionId, inspection: { tenantId } }
    });

    if (!queueItem) throw new NotFoundException('Item não encontrado');

    return this.prisma.queue.update({
      where: { id: queueItem.id },
      data: {
        assignedToId: userId,
        lockedAt: new Date()
      }
    });
  }

  // Libera a vistoria de volta para a fila
  async release(inspectionId: string, tenantId: string) {
    const queueItem = await this.prisma.queue.findFirst({
      where: { inspectionId, inspection: { tenantId } }
    });

    if (!queueItem) throw new NotFoundException('Item não encontrado');

    return this.prisma.queue.update({
      where: { id: queueItem.id },
      data: {
        assignedToId: null,
        lockedAt: null
      }
    });
  }

  // Finaliza a análise
  async finish(inspectionId: string, status: AnalysisStatus, tenantId: string, comment?: string) {
    const queueItem = await this.prisma.queue.findFirst({
      where: { inspectionId, inspection: { tenantId } }
    });

    if (!queueItem) throw new NotFoundException('Item não encontrado');

    await this.prisma.inspection.update({
      where: { id: inspectionId },
      data: { 
        status,
        observacoes: comment 
      }
    });

    return this.prisma.queue.update({
      where: { id: queueItem.id },
      data: { status, lockedAt: null }
    });
  }

}
