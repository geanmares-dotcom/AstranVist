'use client';

import React from 'react';
import { 
  Search, 
  Filter, 
  Download,
  MessageSquare,
  Link as LinkIcon,
  Copy,
  ChevronDown,
  ArrowUpDown,
  CheckCircle2,
  Camera,
  FileText
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { inspectionService } from '../../services/inspectionService';
import Link from 'next/link';
import Sidebar from '../../components/Sidebar';

export default function VistoriasPage() {
  const { data: inspections, isLoading } = useQuery({
    queryKey: ['inspections'],
    queryFn: () => inspectionService.getAll(),
  });

  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-800 overflow-hidden font-sans">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header Superior (Título e Busca) */}
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
             <FileText className="text-indigo-600" size={20} />
             <h1 className="text-lg font-bold text-slate-700">Histórico de Vistorias</h1>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input type="text" placeholder="Buscar vistorias..." className="bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-10 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none w-64" />
             </div>
             <button className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-indigo-700 transition-all">
                <Filter size={16} /> Filtros
             </button>
          </div>
        </header>

        {/* Área da Tabela */}
        <div className="flex-1 overflow-auto p-4">
           <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <table className="w-full text-left border-collapse text-[11px]">
                 <thead>
                    <tr className="bg-[#1e40af] text-white">
                       <th className="px-3 py-3 font-bold border-r border-white/10 text-center w-12">Avaliação <ArrowUpDown size={12} className="inline ml-1" /></th>
                       <th className="px-3 py-3 font-bold border-r border-white/10">Protocolo <ArrowUpDown size={12} className="inline ml-1" /></th>
                       <th className="px-3 py-3 font-bold border-r border-white/10 text-center w-28">Status <ArrowUpDown size={12} className="inline ml-1" /></th>
                       <th className="px-3 py-3 font-bold border-r border-white/10">Cliente <ArrowUpDown size={12} className="inline ml-1" /></th>
                       <th className="px-3 py-3 font-bold border-r border-white/10">Placa <ArrowUpDown size={12} className="inline ml-1" /></th>
                       <th className="px-3 py-3 font-bold border-r border-white/10">Celular</th>
                       <th className="px-3 py-3 font-bold border-r border-white/10">Chassi</th>
                       <th className="px-3 py-3 font-bold border-r border-white/10">Criado Por</th>
                       <th className="px-3 py-3 font-bold border-r border-white/10">Data Criação <ArrowUpDown size={12} className="inline ml-1" /></th>
                       <th className="px-3 py-3 font-bold border-r border-white/10">Última Atualização <ArrowUpDown size={12} className="inline ml-1" /></th>
                       <th className="px-3 py-3 font-bold border-r border-white/10">Avaliado Por</th>
                       <th className="px-3 py-3 font-bold text-center">Ações</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                    {isLoading ? (
                       <tr><td colSpan={12} className="py-20 text-center text-slate-400">Carregando dados...</td></tr>
                    ) : inspections?.map((item) => (
                       <tr key={item.id} className="hover:bg-blue-50/50 transition-colors">
                          <td className="px-3 py-2 text-center">
                             <div className="flex justify-center gap-1">
                                <div className="h-5 w-5 bg-rose-500 rounded-full flex items-center justify-center text-white"><Camera size={10} /></div>
                                {item.status === 'APROVADO' && <div className="h-5 w-5 bg-emerald-500 rounded-full flex items-center justify-center text-white"><CheckCircle2 size={10} /></div>}
                                {item.status === 'ENVIADO' && <div className="h-5 w-5 bg-white border border-slate-300 rounded flex items-center justify-center text-slate-400"><FileText size={10} /></div>}
                             </div>
                          </td>
                          <td className="px-3 py-2 font-bold text-slate-600">{item.protocol}</td>
                          <td className="px-3 py-2 text-center">
                             <StatusBadge status={item.status} />
                          </td>
                          <td className="px-3 py-2 font-medium text-slate-700 truncate max-w-[150px]">{item.cliente || 'CONSUMIDOR FINAL'}</td>
                          <td className="px-3 py-2 font-black text-slate-900">{item.placa}</td>
                          <td className="px-3 py-2 text-slate-500">{item.celular || '(27) 99903-8344'}</td>
                          <td className="px-3 py-2 text-slate-400 text-center">-</td>
                          <td className="px-3 py-2 text-slate-600">{item.createdBy?.name || 'ALEXANDRE MACHADO'}</td>
                          <td className="px-3 py-2 text-slate-500">{new Date(item.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                          <td className="px-3 py-2 text-slate-500">{new Date(item.updatedAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                          <td className="px-3 py-2 text-slate-600">{item.status === 'APROVADO' ? 'GEAN MARES' : '-'}</td>
                          <td className="px-3 py-2">
                             <div className="flex items-center justify-center gap-2">
                                <Link href={`/analise/${item.id}`} className="text-slate-400 hover:text-indigo-600 transition-colors"><FileText size={16} /></Link>
                                <button className="text-emerald-500 hover:text-emerald-700 transition-colors"><MessageSquare size={16} /></button>
                                <button className="text-sky-500 hover:text-sky-700 transition-colors"><LinkIcon size={16} /></button>
                             </div>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      </main>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: any = {
    FINALIZADO: 'bg-[#d1fae5] text-[#065f46] border border-[#065f46]/10',
    APROVADO: 'bg-[#d1fae5] text-[#065f46] border border-[#065f46]/10',
    ENVIADO: 'bg-[#dbeafe] text-[#1e40af] border border-[#1e40af]/10',
    ABERTO: 'bg-[#cffafe] text-[#0e7490] border border-[#0e7490]/10',
    AGUARDANDO_COLETA: 'bg-[#fef3c7] text-[#92400e] border border-[#92400e]/10',
    REPROVADO: 'bg-rose-100 text-rose-700 border border-rose-200',
  };

  const label: any = {
    FINALIZADO: 'FINALIZADO',
    APROVADO: 'FINALIZADO',
    ENVIADO: 'ENVIADO',
    ABERTO: 'ABERTO',
    AGUARDANDO_COLETA: 'ABERTO',
    REPROVADO: 'REPROVADO',
  };

  return (
    <span className={`inline-block px-4 py-0.5 rounded text-[9px] font-black tracking-tighter w-24 ${styles[status] || styles.ENVIADO}`}>
       {label[status] || status}
    </span>
  );
}
