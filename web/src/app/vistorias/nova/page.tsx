'use client';

import React, { useState } from 'react';
import { 
  ChevronLeft, 
  Send, 
  Copy, 
  Check, 
  Car, 
  User, 
  Clipboard,
  Loader2,
  MessageCircle,
  Link as LinkIcon,
  ExternalLink,
  PlusCircle,
  Search,

  Filter,
  X,
  Calendar,
  Truck,
  Hash,
  ChevronDown,
  ChevronUp,
  RefreshCcw
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '../../../services/api';
import { inspectionService } from '../../../services/inspectionService';
import Sidebar from '../../../components/Sidebar';

export default function NovaVistoriaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [createdData, setCreatedData] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Form State

  const [formData, setFormData] = useState({
    placa: '',
    cliente: '',
    modelo: '',
    chassi: '',
    tipoVeiculo: 'CAMINHAO'
  });

  // Filters State
  const [filters, setFilters] = useState({
    searchType: 'placa',
    searchValue: '',
    status: '',
    tipoVeiculo: '',
    startDate: '',
    endDate: ''
  });

  const [appliedFilters, setAppliedFilters] = useState<any>({});

  // Sorting State
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>({
    key: 'createdAt',
    direction: 'desc'
  });

  // Query de busca
  const { data: results, isLoading: loadingResults, refetch } = useQuery({
    queryKey: ['inspections', appliedFilters],
    queryFn: () => inspectionService.getAll(appliedFilters),
    enabled: true
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post('/inspections', formData);
      setCreatedData(response.data);
      refetch();
    } catch (err: any) {
      alert('Erro ao criar vistoria: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilter = () => {
    setAppliedFilters({ ...filters });
  };

  const handleClearFilter = () => {
    const empty = {
      searchType: 'placa',
      searchValue: '',
      status: '',
      tipoVeiculo: '',
      startDate: '',
      endDate: ''
    };
    setFilters(empty);
    setAppliedFilters({});
    setSortConfig({ key: 'createdAt', direction: 'desc' });
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedResults = React.useMemo(() => {
    if (!results) return [];
    let sortableItems = [...results];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Se for status, a gente pode querer ordenar pelo label ou peso, mas vamos usar a string bruta por ora
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [results, sortConfig]);

  const copyToClipboard = () => {
    if (createdData?.shareLink) {
      navigator.clipboard.writeText(createdData.shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const shareWhatsApp = () => {
    const message = `Olá! Somos da STRSAT. Segue o link para realizar a coleta de fotos da sua vistoria: ${createdData.shareLink}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`, '_blank');
  };
  return (
    <div className="flex h-screen bg-[var(--bg-main)] text-slate-800 dark:text-slate-200 overflow-hidden font-sans">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800 px-8 flex items-center justify-between shrink-0 z-30">
          <div className="flex items-center gap-3">
             <PlusCircle className="text-indigo-600" size={20} />
             <h1 className="text-lg font-bold text-slate-700 dark:text-slate-300">Central do Corretor</h1>
          </div>
          
          <div className="flex items-center gap-2">
             <span className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse"></span>
             <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Sistema Online</span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-10 pb-20">
          
          {/* SEÇÃO 1: CRIAR VISTORIA */}
          <section className="max-w-5xl mx-auto space-y-6">
             <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100 dark:shadow-none">
                   <Send size={16} className="text-white" />
                </div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Gerar Vistoria</h2>
             </div>


             {createdData ? (
                <div className="bg-emerald-500 rounded-[2.5rem] p-8 text-white shadow-xl shadow-emerald-100 dark:shadow-none flex flex-col md:flex-row items-center gap-8 animate-in zoom-in-95">
                   <div className="h-20 w-20 bg-white/20 rounded-[2rem] flex items-center justify-center shrink-0">
                      <Check size={40} />
                   </div>
                   <div className="flex-1 text-center md:text-left space-y-1">
                      <h3 className="text-2xl font-black">Vistoria Iniciada!</h3>
                      <p className="text-white/80 font-medium">Protocolo: <span className="font-bold underline">{createdData.protocol}</span></p>
                      <p className="text-[10px] uppercase font-black tracking-widest mt-2 bg-black/10 inline-block px-3 py-1 rounded-full">Link gerado com sucesso</p>
                   </div>
                   <div className="flex flex-col sm:flex-row gap-3">
                      <button onClick={copyToClipboard} className="bg-white text-emerald-600 font-black px-6 py-4 rounded-2xl flex items-center gap-2 text-xs uppercase tracking-widest hover:scale-105 transition-all">
                         {copied ? <Check size={18} /> : <Copy size={18} />} {copied ? 'Copiado!' : 'Copiar Link'}
                      </button>
                      <button onClick={shareWhatsApp} className="bg-slate-900 text-white font-black px-6 py-4 rounded-2xl flex items-center gap-2 text-xs uppercase tracking-widest hover:scale-105 transition-all">
                         <MessageCircle size={18} /> WhatsApp
                      </button>
                      <button onClick={() => setCreatedData(null)} className="bg-white/20 text-white font-black px-4 py-4 rounded-2xl flex items-center justify-center hover:bg-white/30 transition-all">
                         <X size={20} />
                      </button>
                   </div>
                </div>
             ) : (
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 shadow-sm border border-slate-100 dark:border-slate-800">
                   <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Placa</label>
                         <input required type="text" placeholder="ABC-1234" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all uppercase font-mono tracking-widest text-slate-900 dark:text-white" value={formData.placa} onChange={e => setFormData({...formData, placa: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Modelo / Versão</label>
                         <input required type="text" placeholder="Ex: Scania R450" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-slate-900 dark:text-white" value={formData.modelo} onChange={e => setFormData({...formData, modelo: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Proprietário / Cliente</label>
                         <input required type="text" placeholder="Nome Completo" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-slate-900 dark:text-white" value={formData.cliente} onChange={e => setFormData({...formData, cliente: e.target.value})} />
                      </div>
                      <div className="flex flex-col justify-end">
                         <button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white font-black h-14 rounded-2xl transition-all shadow-lg shadow-indigo-100 dark:shadow-none flex items-center justify-center gap-3 text-xs uppercase tracking-widest disabled:opacity-50">
                            {loading ? <Loader2 className="animate-spin" /> : <>Gerar Link <Send size={16} /></>}
                         </button>
                      </div>
                   </form>
                </div>
             )}
          </section>

          <hr className="max-w-5xl mx-auto border-slate-200/60 dark:border-slate-800" />

          {/* SEÇÃO 2: CONSULTA / PESQUISA */}
          <section className="max-w-5xl mx-auto space-y-8">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="h-8 w-8 bg-slate-900 dark:bg-black rounded-xl flex items-center justify-center shadow-lg shadow-slate-100 dark:shadow-none border dark:border-slate-800">
                      <Search size={16} className="text-white" />
                   </div>
                   <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Pesquisa Avançada</h2>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                   <RefreshCcw size={12} /> Atualizado em tempo real
                </div>
             </div>

             {/* Painel de Filtros */}
             <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-sm border border-slate-100 dark:border-slate-800 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                   {/* Busca por Texto */}
                   <div className="md:col-span-5 flex h-14">
                      <select 
                        className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 border-r-0 rounded-l-2xl px-4 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 outline-none focus:bg-white dark:focus:bg-slate-800 transition-all cursor-pointer"
                        value={filters.searchType}
                        onChange={e => setFilters({...filters, searchType: e.target.value})}
                      >
                         <option value="placa">Placa</option>
                         <option value="cliente">Cliente</option>
                         <option value="chassi">Chassi</option>
                         <option value="protocolo">Protocolo</option>
                      </select>
                      <input 
                        type="text" 
                        placeholder={`Digite ${filters.searchType}...`}
                        className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-r-2xl px-5 text-sm font-bold outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 transition-all text-slate-900 dark:text-white"
                        value={filters.searchValue}
                        onChange={e => setFilters({...filters, searchValue: e.target.value})}
                      />
                   </div>

                   {/* Filtro de Status */}
                   <div className="md:col-span-3">
                      <div className="relative h-14">
                         <select 
                           className="w-full h-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-10 text-xs font-bold text-slate-600 dark:text-slate-300 outline-none appearance-none focus:bg-white dark:focus:bg-slate-800 transition-all cursor-pointer"
                           value={filters.status}
                           onChange={e => setFilters({...filters, status: e.target.value})}
                         >
                            <option value="">Todos os Status</option>
                            <option value="ENVIADO">Enviado</option>
                            <option value="EM_ANDAMENTO">Em Análise</option>
                            <option value="NOVA_COLETA">Pendente Cliente</option>
                            <option value="FINALIZADO">Concluído</option>
                            <option value="REPROVADO">Reprovado</option>
                         </select>
                         <Filter size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                         <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
                      </div>
                   </div>

                   {/* Tipo de Veículo */}
                   <div className="md:col-span-2">
                      <div className="relative h-14">
                         <select 
                           className="w-full h-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-10 text-xs font-bold text-slate-600 dark:text-slate-300 outline-none appearance-none focus:bg-white dark:focus:bg-slate-800 transition-all cursor-pointer"
                           value={filters.tipoVeiculo}
                           onChange={e => setFilters({...filters, tipoVeiculo: e.target.value})}
                         >
                            <option value="">Todos Tipos</option>
                            <option value="CAMINHAO">Caminhão</option>
                            <option value="CARRETA">Carreta</option>
                            <option value="UTILITARIO">Utilitário</option>
                            <option value="PASSEIO">Passeio</option>
                         </select>
                         <Truck size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                         <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
                      </div>
                   </div>

                   {/* Botões de Ação */}
                   <div className="md:col-span-2 flex gap-2">
                      <button onClick={handleApplyFilter} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl flex items-center justify-center transition-all shadow-lg shadow-indigo-100 dark:shadow-none">
                         <Check size={20} />
                      </button>
                      <button onClick={handleClearFilter} className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-2xl flex items-center justify-center transition-all">
                         <X size={20} />
                      </button>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">De (Data Inicial)</label>
                      <div className="relative">
                         <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
                         <input 
                           type="date" 
                           className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-12 py-3.5 text-xs font-bold outline-none focus:bg-white dark:focus:bg-slate-800 transition-all text-slate-900 dark:text-white"
                           value={filters.startDate}
                           onChange={e => setFilters({...filters, startDate: e.target.value})}
                         />
                      </div>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Até (Data Final)</label>
                      <div className="relative">
                         <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
                         <input 
                           type="date" 
                           className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-12 py-3.5 text-xs font-bold outline-none focus:bg-white dark:focus:bg-slate-800 transition-all text-slate-900 dark:text-white"
                           value={filters.endDate}
                           onChange={e => setFilters({...filters, endDate: e.target.value})}
                         />
                      </div>
                   </div>
                </div>
             </div>

             {/* Tabela de Resultados */}
             <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                <table className="w-full text-left border-collapse">
                   <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                         <th onClick={() => handleSort('createdAt')} className="px-8 py-5 font-black uppercase tracking-widest text-[10px] text-slate-400 dark:text-slate-500 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group">
                            <div className="flex items-center gap-2">
                                Vistoria / Data {getSortIcon('createdAt', sortConfig)}
                            </div>
                         </th>
                         <th onClick={() => handleSort('cliente')} className="px-8 py-5 font-black uppercase tracking-widest text-[10px] text-slate-400 dark:text-slate-500 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group">
                            <div className="flex items-center gap-2">
                                Cliente {getSortIcon('cliente', sortConfig)}
                            </div>
                         </th>
                         <th onClick={() => handleSort('placa')} className="px-8 py-5 font-black uppercase tracking-widest text-[10px] text-slate-400 dark:text-slate-500 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group">
                            <div className="flex items-center gap-2">
                                Veículo {getSortIcon('placa', sortConfig)}
                            </div>
                         </th>
                         <th onClick={() => handleSort('status')} className="px-8 py-5 font-black uppercase tracking-widest text-[10px] text-slate-400 dark:text-slate-500 text-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group">
                            <div className="flex items-center gap-2 justify-center">
                                Status {getSortIcon('status', sortConfig)}
                            </div>
                         </th>
                         <th className="px-8 py-5 font-black uppercase tracking-widest text-[10px] text-slate-400 dark:text-slate-500 text-right">Ações</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                      {loadingResults ? (
                         <tr><td colSpan={5} className="py-20 text-center text-slate-300 dark:text-slate-700 font-bold uppercase animate-pulse">Pesquisando na base...</td></tr>
                      ) : sortedResults?.length === 0 ? (
                         <tr><td colSpan={5} className="py-20 text-center text-slate-300 dark:text-slate-700 font-bold uppercase">Nenhuma vistoria encontrada.</td></tr>
                      ) : sortedResults?.map((item: any) => (
                         <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group">
                            <td className="px-8 py-5">
                               <div className="flex flex-col">
                                  <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">{item.protocol}</span>
                                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-0.5">
                                    {mounted ? new Date(item.createdAt).toLocaleDateString('pt-BR') : '...'}
                                  </span>
                               </div>
                            </td>
                            <td className="px-8 py-5">
                               <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{item.cliente}</span>
                            </td>
                            <td className="px-8 py-5">
                               <div className="flex flex-col">
                                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{item.placa}</span>
                                  <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 truncate max-w-[120px]">{item.modelo}</span>
                               </div>
                            </td>
                            <td className="px-8 py-5 text-center">
                               <StatusBadge status={item.status} />
                            </td>
                            <td className="px-8 py-5 text-right flex items-center justify-end gap-2">
                               <button 
                                 onClick={() => {
                                    const baseUrl = window.location.origin;
                                    navigator.clipboard.writeText(`${baseUrl}/coleta/${item.id}`);
                                    alert('Link de coleta copiado!');
                                 }}
                                 className="p-2 text-slate-300 dark:text-slate-600 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                 title="Copiar Link de Coleta"
                               >
                                  <Copy size={16} />
                               </button>
                               <button 
                                 onClick={() => router.push(`/analise/${item.id}`)}
                                 className="p-2 text-slate-300 dark:text-slate-600 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                 title="Ver Detalhes"
                               >
                                  <ExternalLink size={18} />
                               </button>
                            </td>

                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function getSortIcon(key: string, config: any) {
  if (!config || config.key !== key) return <ChevronDown size={12} className="opacity-20 group-hover:opacity-50" />;
  return config.direction === 'asc' ? <ChevronUp size={12} className="text-indigo-600 dark:text-indigo-400" /> : <ChevronDown size={12} className="text-indigo-600 dark:text-indigo-400" />;
}

function StatusBadge({ status }: { status: string }) {

  const styles: any = {
    FINALIZADO: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800',
    REPROVADO: 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-800',
    APROVADO_COM_RESSALVA: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800',
    EM_ANDAMENTO: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800',
    ENVIADO: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800',
    AGUARDANDO_COLETA: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700',
    NOVA_COLETA: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800',
  };

  const labels: any = {
    FINALIZADO: 'CONCLUÍDO',
    REPROVADO: 'REPROVADO',
    APROVADO_COM_RESSALVA: 'CONCLUÍDO',
    EM_ANDAMENTO: 'ANÁLISE',
    ENVIADO: 'ENVIADO',
    AGUARDANDO_COLETA: 'LINK CRIADO',
    NOVA_COLETA: 'PENDENTE CLIENTE',
  };

  return (
    <span className={`inline-block px-3 py-1 rounded-lg text-[9px] font-black tracking-widest border ${styles[status] || styles.ENVIADO}`}>
       {labels[status] || status}
    </span>
  );
}
