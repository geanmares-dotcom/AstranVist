import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class QueueService {
  constructor(private prisma: PrismaService) {}

  // Busca fila disponível (Não assumida ou assumida pelo próprio usuário)
  async getAvailable(tenantId: string, userId: string) {
    return this.prisma.queue.findMany({
      where: {
        inspection: { tenantId },
        status: 'EM_ANDAMENTO',
        OR: [
          { assignedToId: null },
          { assignedToId: userId }
        ]
      },
      include: {
        inspection: {
          select: {
            id: true,
            protocol: true,
            placa: true,
            cliente: true,
            createdAt: true,
            updatedAt: true,
          }
        },
        assignedTo: {
          select: { id: true, name: true }
        }
      },
      orderBy: { updatedAt: 'asc' }
    });
  }

  // Assumir uma vistoria para análise
  async assign(inspectionId: string, userId: string, tenantId: string) {
    const item = await this.prisma.queue.findUnique({
      where: { inspectionId }
    });

    if (!item) throw new NotFoundException('Fila não encontrada');

    // Se já estiver assumida por outra pessoa
    if (item.assignedToId && item.assignedToId !== userId) {
      throw new BadRequestException('Esta vistoria já está sendo analisada por outro colaborador');
    }

    // Atualiza status da vistoria para EM_ANDAMENTO
    await this.prisma.inspection.update({
      where: { id: inspectionId },
      data: { status: 'EM_ANDAMENTO' }
    });

    return this.prisma.queue.update({
      where: { inspectionId },
      data: {
        assignedToId: userId,
        lockedAt: new Date()
      },
      include: { assignedTo: true }
    });
  }

  // Devolver para a mesa (liberar análise)
  async release(inspectionId: string, tenantId: string) {
    // Volta o status da vistoria para ENVIADO (Aguardando Análise)
    await this.prisma.inspection.update({
      where: { id: inspectionId },
      data: { status: 'ENVIADO' }
    });

    return this.prisma.queue.update({
      where: { inspectionId },
      data: {
        assignedToId: null,
        lockedAt: null
      }
    });
  }



  // Finalizar análise
  async finish(inspectionId: string, status: string, tenantId: string, comment?: string, rejectedPhotoIds?: string[]) {
    // Se for solicitado nova coleta, deleta as fotos rejeitadas para que o cliente possa refazê-las
    if (status === 'NOVA_COLETA' && rejectedPhotoIds && rejectedPhotoIds.length > 0) {
      await this.prisma.inspectionPhoto.deleteMany({
        where: {
          id: { in: rejectedPhotoIds },
          inspectionId
        }
      });
    }

    await this.prisma.inspection.update({
      where: { id: inspectionId },
      data: { 
        status: status as any,
        observacoes: comment 
      }
    });

    // Remove da fila de análise (status muda para concluído)
    return this.prisma.queue.update({
      where: { inspectionId },
      data: { 
        status: 'CONCLUIDO',
        lockedAt: null 
      }
    });
  }


  async getFinished(tenantId: string) {
    return this.prisma.queue.findMany({
      where: {
        inspection: { 
          tenantId,
          status: { not: 'NOVA_COLETA' }
        },
        status: 'CONCLUIDO'
      },
      include: {
        inspection: true,
        assignedTo: true
      },
      orderBy: { updatedAt: 'desc' }
    });
  }

  async getPendingCollection(tenantId: string) {
    return this.prisma.queue.findMany({
      where: {
        inspection: { 
          tenantId,
          status: 'NOVA_COLETA'
        }
      },
      include: {
        inspection: true
      },
    });
  }

  async getDailyStats(tenantId: string) {

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats = await this.prisma.inspection.groupBy({
      by: ['status'],
      where: {
        tenantId,
        updatedAt: { gte: today }
      },
      _count: { _all: true }
    });

    return stats.map(s => ({ name: s.status, count: s._count._all }));
  }

  async getMyStats(userId: string, tenantId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Vistorias aprovadas por mim hoje
    const approvedToday = await this.prisma.inspection.count({
      where: {
        queue: {
          assignedToId: userId,
          status: 'CONCLUIDO'
        },
        status: { in: ['FINALIZADO', 'APROVADO_COM_RESSALVA', 'APROVADO'] },
        updatedAt: { gte: today }
      }
    });

    // Vistorias reprovadas por mim hoje
    const rejectedToday = await this.prisma.inspection.count({
      where: {
        queue: {
          assignedToId: userId,
          status: 'CONCLUIDO'
        },
        status: 'REPROVADO',
        updatedAt: { gte: today }
      }
    });

    // Vistorias que estou analisando agora
    const myCurrent = await this.prisma.queue.count({
      where: {
        assignedToId: userId,
        status: 'EM_ANDAMENTO'
      }
    });

    return {
      approvedToday,
      rejectedToday,
      finishedToday: approvedToday + rejectedToday,
      myCurrent
    };
  }

}

