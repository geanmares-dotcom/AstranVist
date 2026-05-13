import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { user, method, url, body } = request;

    return next.handle().pipe(
      tap(async () => {
        // Apenas registra logs para métodos que alteram dados (POST, PATCH, PUT, DELETE)
        if (method !== 'GET' && user) {
          try {
            await this.prisma.auditLog.create({
              data: {
                tenantId: user.tenantId,
                userId: user.userId,
                action: `${method} ${url}`,
                entity: url.split('/')[1] || 'unknown',
                entityId: body?.id || request.params?.id || 'N/A',
                details: body,
              },
            });
          } catch (error) {
            console.error('Failed to create audit log', error);
          }
        }
      }),
    );
  }
}
