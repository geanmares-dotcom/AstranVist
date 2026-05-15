const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const ghosts = await prisma.queue.findMany({
    where: { status: 'CONCLUIDO', inspection: { status: 'EM_ANDAMENTO' } },
    include: { inspection: true }
  });

  for (const g of ghosts) {
    const newStatus = (g.inspection.observacoes && g.inspection.observacoes.length > 0) ? 'APROVADO_COM_RESSALVA' : 'FINALIZADO';
    await prisma.inspection.update({
      where: { id: g.inspectionId },
      data: { status: newStatus }
    });
    console.log('Fixed:', g.inspection.protocol, 'to', newStatus);
  }
  console.log('All fixed!');
}

run().finally(() => prisma.$disconnect());
