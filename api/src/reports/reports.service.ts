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
        where: { id: inspectionId },
        include: {
          photos: true,
          createdBy: true,
          tenant: true,
        },
      });

      if (!inspection) {
        throw new NotFoundException('Vistoria não encontrada');
      }

      // Ler o arquivo de logo do frontend
      const logoPath = path.join(process.cwd(), '..', 'web', 'public', 'logo-light.png');
      let logoDataUri = '';
      if (fs.existsSync(logoPath)) {
        const logoBase64 = fs.readFileSync(logoPath).toString('base64');
        logoDataUri = `data:image/png;base64,${logoBase64}`;
      }

      const reportData = {
        logoUrl: logoDataUri,
        protocol: inspection.protocol,
        date: inspection.createdAt.toLocaleDateString('pt-BR') + ' ' + inspection.createdAt.toLocaleTimeString('pt-BR'),
        client: inspection.cliente || 'CONSUMIDOR FINAL',
        plate: inspection.placa,
        model: inspection.modelo || 'NÃO CONSTAM DADOS',
        chassi: inspection.chassi || 'NÃO CONSTAM DADOS',
        renavam: inspection.renavam || 'NÃO CONSTAM DADOS',
        cor: inspection.cor || 'NÃO CONSTAM DADOS',
        ano: inspection.ano || 'NÃO CONSTAM DADOS',
        municipio: `${inspection.municipio || 'N/A'} - ${inspection.uf || 'SP'}`,
        combustivel: inspection.combustivel || 'NÃO CONSTAM DADOS',
        motor: inspection.motor || 'NÃO CONSTAM DADOS',
        status: inspection.status === 'FINALIZADO' ? 'APROVADO' : (inspection.status === 'APROVADO_COM_RESSALVA' ? 'APROVADO COM RESSALVAS' : inspection.status),
        analyst: inspection.createdBy?.name || 'Sistema STRSAT',
        observacoes: inspection.observacoes,
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
      
      // Registrar helpers do Handlebars para lógica de UI
      handlebars.registerHelper('eq', function (a, b) {
        return a === b;
      });

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
        displayHeaderFooter: false,
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


