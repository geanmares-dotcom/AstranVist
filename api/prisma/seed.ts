import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('admin123', 10);

  // 1. Create Tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'test-tenant' },
    update: {},
    create: {
      name: 'AstranVist Matriz',
      slug: 'test-tenant',
    },
  });

  // 2. Create User
  const user = await prisma.user.upsert({
    where: { email: 'admin@astranvist.com' },
    update: {},
    create: {
      email: 'admin@astranvist.com',
      name: 'Admin User',
      password,
      role: 'SUPER_ADMIN',
      tenantId: tenant.id,
    },
  });

  // 3. Create Inspections
  const inspection1 = await prisma.inspection.create({
    data: {
      protocol: 'VIST-2026-ABC12',
      placa: 'ABC-1234',
      cliente: 'João da Silva',
      modelo: 'Volvo FH 540',
      status: 'ENVIADO',
      tenantId: tenant.id,
      createdById: user.id,
      photos: {
        create: [
          { categoria: 'Frontal', url: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&q=80&w=800' },
          { categoria: 'Diagonal Dianteira', url: 'https://images.unsplash.com/photo-1586191121278-200df1b0a65f?auto=format&fit=crop&q=80&w=800' },
        ]
      }
    }
  });

  // Add to Queue
  await prisma.queue.create({
    data: {
      inspectionId: inspection1.id,
      status: 'EM_ANDAMENTO',
    }
  });

  console.log('Seed completed successfully!');
}


main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
