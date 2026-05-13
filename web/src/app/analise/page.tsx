'use client';

import React, { useState } from 'react';
import { 
  Search, 
  Zap,
  ArrowUpDown,
  Camera,
  Link as LinkIcon,
  UserCheck,
  History,
  FileText,
  Download,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  MessageCircle,
  AlertCircle,
  Send,
  Timer,
  Copy
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { queueService } from '../../services/queueService';
import { inspectionService } from '../../services/inspectionService';
import api from '../../services/api';
import Sidebar from '../../components/Sidebar';
import Link from 'next/link';

export default function MesaAnalisePage() {
  const [activeTab, setActiveTab] = useState<'fila' | 'novos' | 'pendentes' | 'concluidos'>('fila');
  const [filter, setFilter] = useState('');
  const [isSpinning, setIsSpinning] = useState(false);

  const { data: queueItems, isLoading: loadingQueue, isFetching: fetchingQueue, refetch: refetchQueue } = useQuery({
    queryKey: ['queue'],
    queryFn: () => queueService.getAvailable(),
    refetchInterval: activeTab === 'fila' ? 30000 : false,
  });

  const { data: finishedItems, isLoading: loadingFinished, isFetching: fetchingFinished, refetch: refetchFinished } = useQuery({
    queryKey: ['finished'],
    queryFn: () => queueService.getFinished(),
    enabled: activeTab === 'concluidos',
  });

  const { data: pendingItems, isLoading: loadingPending, isFetching: fetchingPending, refetch: refetchPending } = useQuery({
    queryKey: ['pending'],
    queryFn: () => queueService.getPendingCollection(),
    enabled: activeTab === 'pendentes',
  });

  const { data: initialPending, isLoading: loadingInitial, isFetching: fetchingInitial, refetch: refetchInitial } = useQuery({
    queryKey: ['initial'],
    queryFn: () => inspectionService.getInitialPending(),
    enabled: activeTab === 'novos',
  });

  const handleRefresh = async () => {
    setIsSpinning(true);
    if (activeTab === 'fila') await refetchQueue();
    if (activeTab === 'concluidos') await refetchFinished();
    if (activeTab === 'pendentes') await refetchPending();
    if (activeTab === 'novos') await refetchInitial();
    setTimeout(() => setIsSpinning(false), 800);
  };

  const getList = () => {
    switch(activeTab) {
      case 'fila': return queueItems || [];
      case 'novos': return (initialPending || []).map(i => ({ inspection: i, status: 'AGUARDANDO_COLETA', updatedAt: i.updatedAt }));
      case 'pendentes': return pendingItems || [];
      case 'concluidos': return finishedItems || [];
      default: return [];
    }
  };

  const isLoading = activeTab === 'fila' ? loadingQueue : (activeTab === 'novos' ? loadingInitial : (activeTab === 'pendentes' ? loadingPending : loadingFinished));
  const isFetching = activeTab === 'fila' ? fetchingQueue : (activeTab === 'novos' ? fetchingInitial : (activeTab === 'pendentes' ? fetchingPending : fetchingFinished));

  const filteredList = getList().filter((item: any) => 
    item.inspection.placa.toLowerCase().includes(filter.toLowerCase()) || 
    item.inspection.cliente?.toLowerCase().includes(filter.toLowerCase())
  );

  const handleCopyLink = (id: string) => {
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/coleta/${id}`;
    navigator.clipboard.writeText(link);
    alert('Link copiado para a área de transferência!');
  };

  const handleWhatsAppFollowup = (item: any, type: 'initial' | 'correction') => {

    const phone = '5511999999999'; 
    let message = '';
    
    if (type === 'initial') {
      message = `Olá! Notamos que a sua vistoria (Placa: ${item.inspection.placa}) ainda não foi iniciada. O link expira em breve, por favor acesse para garantir a cobertura do seu seguro: [LINK]`;
    } else {
      message = `Olá! Notamos que a sua vistoria (Placa: ${item.inspection.placa}) possui fotos pendentes de correção. Por favor, acesse o link para refazer as imagens destacadas em vermelho.`;
    }
    
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-800 overflow-hidden font-sans">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header Superior */}
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0 relative z-20">
          <div className="flex items-center gap-6">
             <div className="flex items-center gap-3 pr-6 border-r border-slate-200">
                <Zap className="text-indigo-600" size={20} />
                <h1 className="text-lg font-bold text-slate-700">Mesa de Análise</h1>
             </div>

             <nav className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <TabButton active={activeTab === 'fila'} onClick={() => setActiveTab('fila')} color="indigo" icon={<Zap size={14} />} label="Fila Analista" />
                <TabButton active={activeTab === 'novos'} onClick={() => setActiveTab('novos')} color="blue" icon={<Send size={14} />} label="Novos Links" />
                <TabButton active={activeTab === 'pendentes'} onClick={() => setActiveTab('pendentes')} color="orange" icon={<AlertCircle size={14} />} label="Pendentes Cliente" />
                <TabButton active={activeTab === 'concluidos'} onClick={() => setActiveTab('concluidos')} color="emerald" icon={<History size={14} />} label="Concluídos" />
             </nav>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="relative group hidden lg:block">
               <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
               <input 
                 type="text" 
                 placeholder="Placa ou cliente..." 
                 className="bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-10 py-1.5 text-sm w-48 outline-none focus:ring-2 focus:ring-indigo-500/20"
                 value={filter}
                 onChange={e => setFilter(e.target.value)}
               />
            </div>
            <button 
              onClick={handleRefresh} 
              disabled={isFetching || isSpinning}
              className="flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:opacity-70 disabled:opacity-50"
            >
               <RefreshCw size={14} className={isSpinning ? 'animate-spin' : ''} />
               Atualizar
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
             <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                   <tr className={`text-white transition-colors ${getTabColor(activeTab)}`}>
                      <th className="px-3 py-3 font-bold border-r border-white/10 text-center w-12">#</th>
                      <th className="px-3 py-3 font-bold border-r border-white/10">Protocolo</th>
                      <th className="px-3 py-3 font-bold border-r border-white/10 text-center w-36">Status</th>
                      <th className="px-3 py-3 font-bold border-r border-white/10">Analista/Origem</th>
                      <th className="px-3 py-3 font-bold border-r border-white/10">Cliente</th>
                      <th className="px-3 py-3 font-bold border-r border-white/10">Placa</th>
                      <th className="px-3 py-3 font-bold border-r border-white/10">Última Atualização</th>
                      <th className="px-3 py-3 font-bold text-center">Ações</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                   {isLoading ? (
                      <tr><td colSpan={8} className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest animate-pulse">Carregando dados...</td></tr>
                   ) : filteredList.map((item: any) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                         <td className="px-3 py-2 text-center text-slate-400 font-mono italic">{filteredList.indexOf(item) + 1}</td>
                         <td className="px-3 py-2 font-bold text-slate-600">{item.inspection.protocol}</td>
                         <td className="px-3 py-2 text-center">
                            <StatusBadge status={item.status} tab={activeTab} />
                         </td>
                         <td className="px-3 py-2">
                            {item.assignedTo ? (
                               <div className="flex items-center gap-2">
                                  <div className="h-4 w-4 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-black text-[8px] uppercase">{item.assignedTo.name.charAt(0)}</div>
                                  <span className="font-bold text-slate-700">{item.assignedTo.name}</span>
                               </div>
                            ) : (
                               <span className="text-slate-400 italic">{item.inspection.createdBy?.name || 'SISTEMA'}</span>
                            )}
                         </td>
                         <td className="px-3 py-2 font-medium text-slate-700 truncate max-w-[150px]">{item.inspection.cliente || 'CONSUMIDOR FINAL'}</td>
                         <td className="px-3 py-2 font-black text-slate-900">{item.inspection.placa}</td>
                         <td className="px-3 py-2 text-slate-500">
                            {new Date(item.updatedAt || item.inspection.updatedAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                         </td>
                         <td className="px-3 py-2">
                            <div className="flex items-center justify-center gap-2">
                               {activeTab === 'fila' && (
                                  <Link href={`/analise/${item.inspectionId}`} target="_blank" className="bg-indigo-600 text-white px-4 py-1 rounded text-[10px] font-black uppercase hover:bg-indigo-700 transition-all">Analisar</Link>
                               )}

                               {activeTab === 'novos' && (
                                  <div className="flex gap-2">
                                     <button 
                                       onClick={() => handleCopyLink(item.inspection.id)}
                                       className="bg-slate-100 text-slate-600 px-3 py-1 rounded text-[9px] font-black uppercase hover:bg-slate-200 transition-all flex items-center gap-1"
                                       title="Copiar Link"
                                     >
                                       <Copy size={10} /> Copiar
                                     </button>
                                     <button 
                                       onClick={() => handleWhatsAppFollowup(item, 'initial')}
                                       className="bg-blue-600 text-white px-3 py-1 rounded text-[9px] font-black uppercase hover:bg-blue-700 transition-all flex items-center gap-1"
                                     >
                                       <MessageCircle size={10} /> Cobrar
                                     </button>
                                  </div>
                               )}

                               {activeTab === 'pendentes' && (
                                  <button 
                                    onClick={() => handleWhatsAppFollowup(item, 'correction')}
                                    className="bg-orange-500 text-white px-3 py-1 rounded text-[9px] font-black uppercase hover:bg-orange-600 transition-all flex items-center gap-1"
                                  >
                                    <MessageCircle size={10} /> Orientar
                                  </button>
                               )}

                               {activeTab === 'concluidos' && (
                                  <button 
                                    onClick={() => window.open(`${api.defaults.baseURL}/reports/inspection/${item.inspectionId}`, '_blank')}
                                    className="bg-slate-900 text-white px-3 py-1 rounded text-[9px] font-black uppercase hover:bg-black transition-all flex items-center gap-1"
                                  >
                                    <FileText size={10} /> Relatório
                                  </button>
                               )}
                               
                               <Link href={`/analise/${item.inspectionId || item.inspection.id}`} target="_blank" className="text-slate-400 hover:text-indigo-600 transition-colors">
                                  <ExternalLink size={14} />
                               </Link>
                            </div>
                         </td>
                      </tr>
                   ))}
                   {filteredList.length === 0 && !isLoading && (
                      <tr><td colSpan={8} className="py-24 text-center text-xs font-bold text-slate-300 uppercase tracking-[0.2em] italic">Nenhum registro encontrado nesta aba.</td></tr>
                   )}
                </tbody>
             </table>
          </div>
        </div>
      </main>
    </div>
  );
}

function TabButton({ active, onClick, color, icon, label }: any) {
  const colors: any = {
    indigo: active ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500',
    blue: active ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500',
    orange: active ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500',
    emerald: active ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500',
  };

  return (
    <button onClick={onClick} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${colors[color]}`}>
       {icon} {label}
    </button>
  );
}

function getTabColor(tab: string) {
  switch(tab) {
    case 'novos': return 'bg-blue-600';
    case 'pendentes': return 'bg-orange-600';
    case 'concluidos': return 'bg-emerald-700';
    default: return 'bg-[#1e40af]';
  }
}

function StatusBadge({ status, tab }: { status: string, tab: string }) {
  const styles: any = {
    AGUARDANDO_COLETA: 'bg-blue-50 text-blue-600 border-blue-100',
    NOVA_COLETA: 'bg-orange-50 text-orange-600 border-orange-100',
    FINALIZADO: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    REPROVADO: 'bg-rose-50 text-rose-600 border-rose-100',
    APROVADO_COM_RESSALVA: 'bg-orange-50 text-orange-600 border-orange-100',
    EM_ANDAMENTO: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  };

  const labels: any = {
    AGUARDANDO_COLETA: 'LINK ENVIADO',
    NOVA_COLETA: 'PENDENTE RETORNO',
    FINALIZADO: 'APROVADO',
    REPROVADO: 'REPROVADO',
    APROVADO_COM_RESSALVA: 'APROVADO C/ RESS.',
    EM_ANDAMENTO: 'AGUARDANDO ANÁLISE',
  };

  const currentStatus = tab === 'fila' ? 'EM_ANDAMENTO' : status;

  return (
    <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-black w-28 border text-center ${styles[currentStatus] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
       {labels[currentStatus] || currentStatus}
    </span>
  );
}
