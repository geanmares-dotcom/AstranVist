import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import * as handlebars from 'handlebars';
import * as puppeteer from 'puppeteer';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async generateInspectionReport(inspectionId: string, tenantId: string) {
    try {
      const inspection = await this.prisma.inspection.findFirst({
        where: { id: inspectionId, tenantId },
        include: {
          photos: true,
          createdBy: true,
          tenant: true,
        },
      });

      if (!inspection) {
        throw new NotFoundException('Vistoria não encontrada');
      }

      const reportData = {
        protocol: inspection.protocol,
        date: inspection.createdAt.toLocaleDateString('pt-BR'),
        client: inspection.cliente || 'N/A',
        plate: inspection.placa,
        model: inspection.modelo || 'N/A',
        chassi: inspection.chassi || 'N/A',
        renavam: inspection.renavam || 'N/A',
        analyst: 'Sistema AstranVist',
        photos: inspection.photos.map(p => ({
          label: p.categoria,
          url: p.url,
          timestamp: p.capturedAt.toLocaleString('pt-BR'),
          lat: p.latitude || 'N/A',
          lon: p.longitude || 'N/A'
        }))
      };

      // Compila o template HTML
      const templatePath = path.join(process.cwd(), 'src', 'reports', 'templates', 'laudo.html');
      if (!fs.existsSync(templatePath)) {
        throw new Error(`Template não encontrado em: ${templatePath}`);
      }
      
      const templateHtml = fs.readFileSync(templatePath, 'utf-8');
      const template = handlebars.compile(templateHtml);
      const html = template(reportData);

      // Converte HTML para PDF usando Puppeteer
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'load' });


      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px'
        }
      });

      await browser.close();

      return { 
        buffer: pdfBuffer,
        filename: `laudo_${inspection.protocol}.pdf`
      };
    } catch (error) {
      fs.writeFileSync('pdf_error.log', `[${new Date().toISOString()}] Error: ${error.message}\nStack: ${error.stack}`);
      throw error;
    }
  }

}


