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
  Copy,
  ChevronUp,
  ChevronDown,
  Filter
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  Tooltip as RechartsTooltip
} from 'recharts';
import { queueService } from '../../services/queueService';

import { inspectionService } from '../../services/inspectionService';
import api from '../../services/api';
import Sidebar from '../../components/Sidebar';
import Link from 'next/link';

import { useTheme } from '../../contexts/ThemeContext';

export default function MesaAnalisePage() {
  const [activeTab, setActiveTab] = useState<'fila' | 'novos' | 'pendentes' | 'concluidos'>('fila');
  const [filter, setFilter] = useState('');
  const [isSpinning, setIsSpinning] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const { theme } = useTheme();

  const isDark = theme === 'dark';

  React.useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, filter]);

  React.useEffect(() => {
    setMounted(true);
  }, []);


  // Sorting State
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>({

    key: 'updatedAt',
    direction: 'desc'
  });

  const { data: queueItems, isLoading: loadingQueue, isFetching: fetchingQueue, refetch: refetchQueue } = useQuery({
    queryKey: ['queue'],
    queryFn: () => queueService.getAvailable(),
    refetchInterval: activeTab === 'fila' ? 10000 : 30000,
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

  const { data: myStats } = useQuery({
    queryKey: ['myStats'],
    queryFn: () => queueService.getMyStats(),
    refetchInterval: 30000,
  });


  const handleRefresh = async () => {
    setIsSpinning(true);
    try {
      if (activeTab === 'fila') await refetchQueue();
      else if (activeTab === 'concluidos') await refetchFinished();
      else if (activeTab === 'pendentes') await refetchPending();
      else if (activeTab === 'novos') await refetchInitial();
    } catch (err) {
      console.error('Erro ao atualizar:', err);
    }
    // Garante pelo menos 1 segundo de animação para o feedback visual ser claro
    setTimeout(() => setIsSpinning(false), 1000);
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

  const filteredList = getList().filter((item: any) => 
    item.inspection.placa.toLowerCase().includes(filter.toLowerCase()) || 
    item.inspection.cliente?.toLowerCase().includes(filter.toLowerCase())
  );

  const handleCopyLink = (id: string) => {
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/coleta/${id}`;
    navigator.clipboard.writeText(link);
    toast.success('Link copiado para a área de transferência!');
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedList = React.useMemo(() => {
    let sortableItems = [...filteredList];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key] || a.inspection?.[sortConfig.key] || '';
        let bValue = b[sortConfig.key] || b.inspection?.[sortConfig.key] || '';
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [filteredList, sortConfig]);

  const paginatedList = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedList.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedList, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedList.length / itemsPerPage);

  const handleWhatsAppFollowup = (item: any, type: 'initial' | 'correction') => {
    const phone = '5511999999999'; 
    let message = '';
    if (type === 'initial') {
      message = `Olá! Notamos que a sua vistoria (Placa: ${item.inspection.placa}) ainda não foi iniciada. Por favor, acesse o link para garantir a cobertura do seu seguro.`;
    } else {
      message = `Olá! Sua vistoria (Placa: ${item.inspection.placa}) possui fotos pendentes de correção. Acesse o link para refazer.`;
    }
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="flex h-screen bg-[var(--bg-main)] text-slate-800 dark:text-slate-200 overflow-hidden font-sans">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">

        {/* Header Moderno */}
        <header className="h-20 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800 px-10 flex items-center justify-between shrink-0 z-30">
          <div className="flex items-center gap-8">
             <div className="flex items-center gap-3 pr-8 border-r border-slate-200 dark:border-slate-800">
                <div className="h-10 w-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-none">
                   <Zap className="text-white" size={20} />
                </div>
                <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Mesa de Análise</h1>
             </div>

             <nav className="flex items-center gap-2 bg-slate-100/80 dark:bg-slate-800/80 p-1.5 rounded-full border border-slate-200/50 dark:border-slate-700/50">
                <TabButton active={activeTab === 'fila'} onClick={() => setActiveTab('fila')} color="indigo" icon={<Zap size={14} />} label="Fila Analista" count={queueItems?.length || 0} />
                <TabButton active={activeTab === 'novos'} onClick={() => setActiveTab('novos')} color="blue" icon={<Send size={14} />} label="Enviado" count={initialPending?.length || 0} />
                <TabButton active={activeTab === 'pendentes'} onClick={() => setActiveTab('pendentes')} color="orange" icon={<AlertCircle size={14} />} label="Aguardando Coleta" count={pendingItems?.length || 0} />
                <TabButton active={activeTab === 'concluidos'} onClick={() => setActiveTab('concluidos')} color="emerald" icon={<History size={14} />} label="Concluídos" count={finishedItems?.length || 0} />
             </nav>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="relative group hidden lg:block">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
               <input 
                 type="text" 
                 placeholder="Buscar por placa..." 
                 className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full pl-11 pr-6 py-2.5 text-xs font-bold w-64 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600"
                 value={filter}
                 onChange={e => setFilter(e.target.value)}
               />
            </div>
            <button 
              onClick={handleRefresh} 
              disabled={isSpinning}
              className={`h-11 w-11 flex items-center justify-center rounded-full transition-all shadow-sm border ${
                isSpinning 
                ? 'bg-indigo-600 text-white border-indigo-600 scale-110 shadow-lg shadow-indigo-200' 
                : 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-slate-700 active:scale-95'
              }`}
            >
               <RefreshCw size={18} className={isSpinning ? 'animate-spin' : ''} />
            </button>

          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-10 space-y-6">
          {/* Mini Dashboard Pessoal */}
          <div className="flex gap-4 animate-in">
             <div className="ovi-card px-8 py-5 flex items-center gap-4 flex-1">
                <div className="h-12 w-12 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center">
                   <CheckCircle2 size={24} />
                </div>
                <div>
                   <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1">Finalizadas Hoje</p>
                   <p className="text-2xl font-black text-slate-900 dark:text-white leading-none">{myStats?.finishedToday || 0}</p>
                </div>
             </div>

             <div className="ovi-card px-8 py-5 flex items-center gap-4 flex-1">
                <div className="h-12 w-12 bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-2xl flex items-center justify-center">
                   <Timer size={24} />
                </div>
                <div>
                   <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1">Em Minha Análise</p>
                   <p className="text-2xl font-black text-slate-900 dark:text-white leading-none">{myStats?.myCurrent || 0}</p>
                </div>
             </div>

             <div className="ovi-card px-8 py-4 flex items-center gap-6 flex-[1.5]">
                <div className="h-20 w-20 shrink-0">
                   <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                         <Pie
                            data={[
                               { name: 'Aprovadas', value: myStats?.approvedToday || 0 },
                               { name: 'Reprovadas', value: myStats?.rejectedToday || 0 }
                            ]}
                            innerRadius={25}
                            outerRadius={35}
                            paddingAngle={5}
                            dataKey="value"
                            startAngle={90}
                            endAngle={450}
                         >
                            <Cell fill="#10b981" />
                            <Cell fill="#ef4444" />
                         </Pie>
                         <RechartsTooltip 
                            contentStyle={{ 
                               backgroundColor: isDark ? '#0f172a' : '#ffffff', 
                               borderRadius: '12px', 
                               border: isDark ? '1px solid #1e293b' : 'none',
                               fontSize: '10px',
                               fontWeight: 'bold',
                               color: isDark ? '#ffffff' : '#0f172a',
                               padding: '8px'
                            }}
                            itemStyle={{ color: isDark ? '#ffffff' : '#0f172a' }}
                         />
                      </PieChart>
                   </ResponsiveContainer>
                </div>
                <div className="flex-1">
                   <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-2">Desempenho Individual</p>
                   <div className="flex gap-4">
                      <div className="flex items-center gap-1.5">
                         <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                         <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">Aprovadas: <strong className="text-slate-900 dark:text-white">{myStats?.approvedToday || 0}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                         <div className="h-2 w-2 rounded-full bg-rose-500"></div>
                         <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">Reprovadas: <strong className="text-slate-900 dark:text-white">{myStats?.rejectedToday || 0}</strong></span>
                      </div>
                   </div>
                </div>
             </div>
          </div>

          <div className="ovi-card overflow-hidden animate-in">
             <table className="w-full text-left border-collapse">
                <thead>
                   <tr className={`text-white transition-colors duration-500 ${getTabColor(activeTab)}`}>
                      <th className="px-6 py-6 font-black uppercase tracking-[0.2em] text-[10px] text-center w-16 opacity-80">#</th>
                      <th onClick={() => handleSort('protocol')} className="px-6 py-6 font-black uppercase tracking-[0.2em] text-[10px] cursor-pointer hover:bg-white/10 transition-colors">
                          <div className="flex items-center gap-2">Protocolo {getSortIcon('protocol', sortConfig)}</div>
                      </th>
                      <th className="px-6 py-6 font-black uppercase tracking-[0.2em] text-[10px] text-center w-40">Status</th>
                      <th className="px-6 py-6 font-black uppercase tracking-[0.2em] text-[10px]">Analista</th>
                      <th onClick={() => handleSort('cliente')} className="px-6 py-6 font-black uppercase tracking-[0.2em] text-[10px] cursor-pointer hover:bg-white/10 transition-colors">
                          <div className="flex items-center gap-2">Cliente {getSortIcon('cliente', sortConfig)}</div>
                      </th>
                      <th onClick={() => handleSort('placa')} className="px-6 py-6 font-black uppercase tracking-[0.2em] text-[10px] cursor-pointer hover:bg-white/10 transition-colors">
                          <div className="flex items-center gap-2">Placa {getSortIcon('placa', sortConfig)}</div>
                      </th>
                      <th onClick={() => handleSort('updatedAt')} className="px-6 py-6 font-black uppercase tracking-[0.2em] text-[10px] cursor-pointer hover:bg-white/10 transition-colors">
                          <div className="flex items-center gap-2">Atualização {getSortIcon('updatedAt', sortConfig)}</div>
                      </th>
                      <th className="px-6 py-6 font-black uppercase tracking-[0.2em] text-[10px] text-center w-16">Obs.</th>
                      <th className="px-6 py-6 font-black uppercase tracking-[0.2em] text-[10px] text-center">Ações</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                   {isLoading ? (
                      <tr><td colSpan={9} className="py-32 text-center text-slate-300 dark:text-slate-700 font-black uppercase tracking-widest animate-pulse">Sincronizando Fila...</td></tr>
                   ) : paginatedList.map((item: any, idx: number) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group">
                         <td className="px-6 py-5 text-center text-slate-300 dark:text-slate-700 font-black text-[10px] italic">{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                         <td className="px-6 py-5">
                            <span className="text-xs font-black text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">{item.inspection.protocol}</span>
                         </td>
                         <td className="px-6 py-5 text-center">
                            <StatusBadge status={item.inspection?.status || item.status} tab={activeTab} item={item} />
                         </td>
                         <td className="px-6 py-5">
                            {item.assignedTo ? (
                               <div className="flex items-center gap-3">
                                  <div className="h-7 w-7 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center font-black text-[10px] uppercase shadow-sm border border-indigo-200 dark:border-indigo-800">{item.assignedTo.name.charAt(0)}</div>
                                  <span className="font-bold text-xs text-slate-700 dark:text-slate-300">{item.assignedTo.name}</span>
                               </div>
                            ) : (
                               <span className="text-slate-400 dark:text-slate-500 font-black text-center block w-full">-</span>
                            )}
                         </td>
                         <td className="px-6 py-5 font-bold text-xs text-slate-700 dark:text-slate-300 truncate max-w-[150px]">{item.inspection.cliente || 'CONSUMIDOR FINAL'}</td>
                         <td className="px-6 py-5">
                            <div className="flex flex-col">
                               <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">{item.inspection.placa}</span>
                               {item.inspection.modelo && <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 truncate max-w-[120px]">{item.inspection.modelo}</span>}
                            </div>
                         </td>
                         <td className="px-6 py-5">
                            <div className="flex flex-col">
                               <span className="text-[10px] font-black text-slate-900 dark:text-white">
                                 {mounted ? new Date(item.updatedAt || item.inspection.updatedAt).toLocaleDateString('pt-BR') : '...'}
                               </span>
                               <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 mt-0.5">
                                 {mounted ? new Date(item.updatedAt || item.inspection.updatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '...'}
                               </span>
                            </div>
                         </td>
                         <td className="px-6 py-5 text-center">
                           {item.inspection?.observacoes ? (
                             <div className="group relative flex items-center justify-center">
                               <MessageCircle size={18} className="text-orange-400 cursor-help" />
                               <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-64 p-3 bg-slate-900 text-white text-xs rounded-xl shadow-xl z-50 whitespace-normal text-left pointer-events-none">
                                   <p className="font-bold mb-1 text-orange-400">Observação Técnica</p>
                                   <p>{item.inspection.observacoes}</p>
                                   <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900"></div>
                               </div>
                             </div>
                           ) : (
                             <span className="text-slate-300 dark:text-slate-700 font-bold">-</span>
                           )}
                         </td>
                         <td className="px-6 py-5">
                            <div className="flex items-center justify-center gap-3">
                               {activeTab === 'fila' && (
                                  <Link href={`/analise/${item.inspectionId}`} className="bg-indigo-600 text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 hover:scale-105 transition-all shadow-lg shadow-indigo-100 dark:shadow-none">Analisar</Link>
                               )}

                               {activeTab === 'novos' && (
                                  <div className="flex gap-2">
                                     <button 
                                       onClick={() => handleCopyLink(item.inspection.id)}
                                       className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-4 py-2 rounded-full text-[9px] font-black uppercase hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center gap-1"
                                     >
                                       <Copy size={12} /> Copiar
                                     </button>
                                     <button 
                                       onClick={() => handleWhatsAppFollowup(item, 'initial')}
                                       className="bg-blue-600 text-white px-4 py-2 rounded-full text-[9px] font-black uppercase hover:bg-blue-700 transition-all flex items-center gap-1"
                                     >
                                       <MessageCircle size={12} /> WhatsApp
                                     </button>
                                  </div>
                               )}

                               {activeTab === 'pendentes' && (
                                  <div className="flex gap-2">
                                     <button 
                                       onClick={() => handleCopyLink(item.inspection.id)}
                                       className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-4 py-2 rounded-full text-[9px] font-black uppercase hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center gap-1"
                                     >
                                       <Copy size={12} /> Copiar
                                     </button>
                                     <button 
                                       onClick={() => handleWhatsAppFollowup(item, 'correction')}
                                       className="bg-orange-500 text-white px-5 py-2 rounded-full text-[9px] font-black uppercase hover:bg-orange-600 transition-all flex items-center gap-1 shadow-lg shadow-orange-100 dark:shadow-none"
                                     >
                                       <MessageCircle size={12} /> Orientar
                                     </button>
                                  </div>
                               )}


                               {activeTab === 'concluidos' && (
                                  <>
                                     <button 
                                      onClick={() => window.open(`${api.defaults.baseURL}/reports/inspection/${item.inspection?.id || item.inspectionId}`, '_blank')}
                                      className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 px-4 py-2 rounded-lg font-bold text-[10px] uppercase tracking-widest transition-colors"
                                     >
                                    <FileText size={12} className="text-emerald-400" /> Relatório
                                  </button>
                                  </>
                               )}
                               {!['FINALIZADO', 'APROVADO_COM_RESSALVA', 'REPROVADO', 'CANCELADO', 'CANCELADA'].includes(item.inspection?.status || item.status) && (
                                 <Link 
                                   href={`/analise/${item.inspectionId || item.inspection.id}`} 
                                   target="_blank" 
                                   title="Analisar Vistoria"
                                   className="h-8 w-8 flex items-center justify-center rounded-full text-slate-300 dark:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
                                 >
                                    <ExternalLink size={16} />
                                 </Link>
                               )}
                            </div>
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
             {sortedList.length > 0 && (
               <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                 <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Mostrar</span>
                    <select 
                      value={itemsPerPage} 
                      onChange={e => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={15}>15</option>
                      <option value={30}>30</option>
                      <option value={50}>50</option>
                    </select>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">por página</span>
                 </div>
                 
                 <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-all"
                    >
                      {'<'}
                    </button>
                    <span className="text-[11px] font-black tracking-widest text-slate-600 dark:text-slate-400 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-inner">
                      {currentPage} / {totalPages || 1}
                    </span>
                    <button 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages || totalPages === 0}
                      className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-all"
                    >
                      {'>'}
                    </button>
                 </div>
               </div>
             )}
          </div>
        </div>
      </main>
    </div>
  );
}

function TabButton({ active, onClick, color, icon, label, count }: any) {
  const colors: any = {
    indigo: active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 dark:shadow-none' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300',
    blue: active ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 dark:shadow-none' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300',
    orange: active ? 'bg-orange-500 text-white shadow-lg shadow-orange-100 dark:shadow-none' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300',
    emerald: active ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100 dark:shadow-none' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300',
  };


  return (
    <button 
      onClick={onClick} 
      className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${colors[color]}`}
    >
       {icon} {label} {count !== undefined && <span className={`ml-1 px-1.5 py-0.5 rounded-md ${active ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'} text-[8px]`}>{count}</span>}
    </button>
  );
}


function getSortIcon(key: string, config: any) {
  if (!config || config.key !== key) return <ArrowUpDown size={12} className="opacity-30" />;
  return config.direction === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
}

function getTabColor(tab: string) {
  switch(tab) {
    case 'novos': return 'bg-blue-600';
    case 'pendentes': return 'bg-orange-500';
    case 'concluidos': return 'bg-emerald-600';
    default: return 'bg-indigo-600';
  }
}

function StatusBadge({ status, tab, item }: { status: string, tab: string, item?: any }) {
  const styles: any = {
    AGUARDANDO_COLETA: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    COLETA_ACESSADA: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    COLETA_EM_ANDAMENTO: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800',
    NOVA_COLETA: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800',
    FINALIZADO: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    CONCLUIDO: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    REPROVADO: 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800',
    APROVADO_COM_RESSALVA: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800',
    EM_ANDAMENTO: item?.assignedToId ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800' : 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800',
  };


  const labels: any = {
    AGUARDANDO_COLETA: 'ENVIADO',
    COLETA_ACESSADA: 'ACESSADO',
    COLETA_EM_ANDAMENTO: 'EM ANDAMENTO',
    NOVA_COLETA: 'PENDENTE CLIENTE',
    FINALIZADO: 'APROVADO',
    CONCLUIDO: 'APROVADO',
    REPROVADO: 'REPROVADO',
    APROVADO_COM_RESSALVA: 'APROVADO C/ RESS.',
    EM_ANDAMENTO: item?.assignedToId ? 'EM ANÁLISE' : 'AGUARDANDO ANÁLISE',
  };


  const currentStatus = tab === 'fila' ? 'EM_ANDAMENTO' : status;

  return (
    <span className={`inline-block px-4 py-1.5 rounded-full text-[9px] font-black w-32 border text-center shadow-sm uppercase tracking-tighter ${styles[currentStatus] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
       {labels[currentStatus] || currentStatus}
    </span>
  );
}
