'use client';

import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Bell, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ChevronRight,
  TrendingUp,
  Target,
  Zap,
  Activity,
  Calendar,
  Camera,
  FileText,
  User,
  ShieldCheck,
  BarChart3,
  PieChart as PieIcon,
  LayoutDashboard,
  Download
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { inspectionService } from '../../services/inspectionService';
import api from '../../services/api';
import Link from 'next/link';
import Sidebar from '../../components/Sidebar';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export default function DashboardPage() {
  // Busca dados do perfil para saudação
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
       const res = await api.get('/auth/me');
       return res.data;
    }
  });

  // Busca todas as vistorias (Tabela)
  const { data: inspections, isLoading: loadingInspections } = useQuery({
    queryKey: ['inspections'],
    queryFn: () => inspectionService.findAll(),
  });

  // Busca estatísticas analíticas
  const { data: dashboardStats, isLoading: loadingStats } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: () => inspectionService.getDashboardStats(),
    refetchInterval: 60000,
  });

  const [activeTab, setActiveTab] = useState<'ENVIADOS' | 'ANDAMENTO' | 'FINALIZADOS'>('ENVIADOS');

  const filteredInspections = inspections?.filter(i => {
    if (activeTab === 'ENVIADOS') return i.status === 'ENVIADO' || i.status === 'NOVA_COLETA' || i.status === 'AGUARDANDO_COLETA';
    if (activeTab === 'ANDAMENTO') return i.status === 'EM_ANDAMENTO';
    if (activeTab === 'FINALIZADOS') return ['FINALIZADO', 'APROVADO', 'REPROVADO', 'APROVADO_COM_RESSALVA'].includes(i.status);
    return true;
  }).slice(0, 8);

  const stats = {
    pendentes: dashboardStats?.statusDistribution?.find(s => s.status === 'AGUARDANDO_COLETA')?.count || 0,
    emAnalise: dashboardStats?.statusDistribution?.find(s => s.status === 'EM_ANDAMENTO')?.count || 0,
    concluidas: (dashboardStats?.statusDistribution?.filter(s => ['FINALIZADO', 'REPROVADO', 'APROVADO_COM_RESSALVA'].includes(s.status))?.reduce((acc, curr) => acc + curr.count, 0)) || 0,
  };

  const chartData = dashboardStats?.dailyVolume?.map(v => ({
    name: new Date(v.date).toLocaleDateString('pt-BR', { weekday: 'short' }),
    volume: v.count
  })) || [
    { name: 'Seg', volume: 12 },
    { name: 'Ter', volume: 19 },
    { name: 'Qua', volume: 15 },
    { name: 'Qui', volume: 22 },
    { name: 'Sex', volume: 30 },
    { name: 'Sáb', volume: 10 },
    { name: 'Dom', volume: 5 }
  ];

  const pieData = dashboardStats?.statusDistribution?.map(s => ({
    name: s.status,
    value: s.count
  })) || [
    { name: 'Aprovado', value: 400 },
    { name: 'Reprovado', value: 300 },
    { name: 'Pendente', value: 300 },
  ];

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-800 overflow-hidden font-sans">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header Superior */}
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0 z-30">
          <div className="flex items-center gap-3">
             <LayoutDashboard size={20} className="text-indigo-600" />
             <h1 className="text-lg font-bold text-slate-700">Dashboard Executivo</h1>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
               <Calendar size={14} className="text-slate-400" />
               <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
               </span>
            </div>
            <div className="h-8 w-[1px] bg-slate-200"></div>
            <div className="flex items-center gap-3">
               <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-slate-900 leading-none">{profile?.name || 'Carregando...'}</p>
                  <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">{profile?.role || 'Aguardando'}</p>
               </div>
               <div className="h-10 w-10 rounded-2xl bg-slate-900 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-slate-200">
                  {profile?.name?.charAt(0) || 'A'}
               </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 pb-12">
          {/* Welcome Area */}
          <section className="flex flex-col md:flex-row md:items-center justify-between gap-6">
             <div className="space-y-1">
                <h2 className="text-3xl font-black tracking-tight text-slate-900">Olá, {profile?.name?.split(' ')[0] || 'Analista'}! 👋</h2>
                <p className="text-slate-500 text-sm font-medium">Aqui está o que aconteceu na sua operação nos últimos dias.</p>
             </div>
             <div className="flex items-center gap-3">
                <button className="bg-white border border-slate-200 text-slate-700 font-bold py-3 px-6 rounded-2xl transition-all hover:bg-slate-50 flex items-center gap-2 text-xs shadow-sm">
                   <Download size={18} /> Exportar
                </button>
                <Link href="/vistorias/nova" className="bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3.5 px-8 rounded-2xl transition-all shadow-lg shadow-indigo-100 flex items-center gap-2 text-xs uppercase tracking-widest">
                   <Plus size={18} /> Nova Vistoria
                </Link>
             </div>
          </section>

          {/* KPI Cards */}
          <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
             <KpiCard icon={<Clock size={22} />} label="Aguardando Coleta" value={stats.pendentes} color="blue" trend="+5%" />
             <KpiCard icon={<Activity size={22} />} label="Mesa de Análise" value={stats.emAnalise} color="orange" trend="Em Tempo Real" />
             <KpiCard icon={<CheckCircle2 size={22} />} label="Concluídas Hoje" value={stats.concluidas} color="emerald" trend="+12%" />
             <KpiCard icon={<Target size={22} />} label="Meta Alcançada" value="84%" color="indigo" trend="Faltam 16" />
          </section>

          {/* Charts Area */}
          <section className="grid grid-cols-1 xl:grid-cols-3 gap-8">
             <div className="xl:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
                <div className="flex items-center justify-between">
                   <div className="space-y-1">
                      <h3 className="text-lg font-black text-slate-900">Volume de Vistorias</h3>
                      <p className="text-xs text-slate-400 font-medium italic">Fluxo de capturas nos últimos 7 dias</p>
                   </div>
                   <div className="flex items-center gap-2">
                      <div className="h-3 w-3 bg-indigo-500 rounded-full"></div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Capturas</span>
                   </div>
                </div>
                <div className="h-72 w-full">
                   <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                           dataKey="name" 
                           axisLine={false} 
                           tickLine={false} 
                           tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} 
                           dy={10}
                        />
                        <YAxis hide />
                        <Tooltip 
                           contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                           labelStyle={{ fontWeight: 800, color: '#1e293b', marginBottom: '4px' }}
                        />
                        <Area 
                           type="monotone" 
                           dataKey="volume" 
                           stroke="#6366f1" 
                           strokeWidth={4} 
                           fillOpacity={1} 
                           fill="url(#colorVolume)" 
                           animationDuration={2000}
                        />
                      </AreaChart>
                   </ResponsiveContainer>
                </div>
             </div>

             <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-8 flex flex-col items-center justify-center">
                <div className="text-center space-y-1">
                   <h3 className="text-lg font-black text-slate-900">Distribuição</h3>
                   <p className="text-xs text-slate-400 font-medium">Percentual por status</p>
                </div>
                <div className="h-48 w-full">
                   <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                          animationDuration={1500}
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                   </ResponsiveContainer>
                </div>
                <div className="w-full space-y-3">
                   {pieData.slice(0, 3).map((item, i) => (
                      <div key={i} className="flex items-center justify-between">
                         <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i] }}></div>
                            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{item.name}</span>
                         </div>
                         <span className="text-xs font-black text-slate-900">{item.value}</span>
                      </div>
                   ))}
                </div>
             </div>
          </section>

          {/* Bottom Grid */}
          <section className="grid grid-cols-1 xl:grid-cols-3 gap-8">
             <div className="xl:col-span-2 space-y-4">
                <div className="flex items-center justify-between px-2">
                   <h3 className="text-lg font-black text-slate-900">Atividade Recente</h3>
                   <Link href="/analise" className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:opacity-70 transition-all flex items-center gap-1">
                      Ver Mesa de Análise <ChevronRight size={14} />
                   </Link>
                </div>
                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                   <table className="w-full text-left border-collapse text-[11px]">
                      <thead>
                         <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="px-6 py-4 font-black uppercase tracking-widest text-slate-400">Protocolo</th>
                            <th className="px-6 py-4 font-black uppercase tracking-widest text-slate-400">Cliente</th>
                            <th className="px-6 py-4 font-black uppercase tracking-widest text-slate-400 text-center">Status</th>
                            <th className="px-6 py-4 font-black uppercase tracking-widest text-slate-400 text-right">Data</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                         {loadingInspections ? (
                            <tr><td colSpan={4} className="py-20 text-center text-slate-300 font-bold uppercase animate-pulse">Carregando...</td></tr>
                         ) : filteredInspections?.map((item) => (
                            <tr key={item.id} className="hover:bg-indigo-50/20 transition-all group cursor-pointer">
                               <td className="px-6 py-4 font-bold text-indigo-600 group-hover:translate-x-1 transition-transform">{item.protocol}</td>
                               <td className="px-6 py-4 font-bold text-slate-700">{item.cliente || 'CONSUMIDOR FINAL'}</td>
                               <td className="px-6 py-4 text-center">
                                  <StatusBadge status={item.status} />
                               </td>
                               <td className="px-6 py-4 text-right text-slate-400 font-medium">
                                  {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                               </td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>

             <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
                <div className="space-y-1 text-center">
                   <h3 className="text-lg font-black text-slate-900">Top Analistas</h3>
                   <p className="text-xs text-slate-400 font-medium italic">Ranking de hoje</p>
                </div>
                <div className="space-y-4">
                   {dashboardStats?.topAnalysts?.length > 0 ? dashboardStats.topAnalysts.map((analyst, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                         <div className="flex items-center gap-3">
                            <div className="h-8 w-8 bg-white rounded-xl flex items-center justify-center text-[10px] font-black text-indigo-600 shadow-sm border border-slate-200">
                               #{i+1}
                            </div>
                            <span className="text-xs font-bold text-slate-700">{analyst.name}</span>
                         </div>
                         <div className="text-right">
                            <p className="text-xs font-black text-indigo-600">{analyst.count}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Vistorias</p>
                         </div>
                      </div>
                   )) : (
                      <div className="py-12 text-center space-y-2">
                         <Activity size={32} className="mx-auto text-slate-200" />
                         <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">Nenhuma análise hoje</p>
                      </div>
                   )}
                </div>
             </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function KpiCard({ icon, label, value, color, trend }: any) {
  const colors: any = {
    blue: 'text-blue-600 bg-blue-50 border-blue-100',
    orange: 'text-orange-600 bg-orange-50 border-orange-100',
    emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    indigo: 'text-indigo-600 bg-indigo-50 border-indigo-100',
  };
  return (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4 transition-all hover:scale-[1.02] cursor-default group">
       <div className="flex items-center justify-between">
          <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shadow-inner ${colors[color]}`}>
             {icon}
          </div>
          <div className="text-right">
             <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</span>
             <p className="text-2xl font-black text-slate-900 mt-1">{value}</p>
          </div>
       </div>
       <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-50 w-fit px-2 py-0.5 rounded-full">
          <TrendingUp size={12} /> {trend}
       </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: any = {
    FINALIZADO: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    REPROVADO: 'bg-rose-50 text-rose-600 border-rose-100',
    APROVADO_COM_RESSALVA: 'bg-orange-50 text-orange-600 border-orange-100',
    EM_ANDAMENTO: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    ENVIADO: 'bg-blue-50 text-blue-600 border-blue-100',
    AGUARDANDO_COLETA: 'bg-slate-100 text-slate-500 border-slate-200',
  };

  const labels: any = {
    FINALIZADO: 'APROVADO',
    REPROVADO: 'REPROVADO',
    APROVADO_COM_RESSALVA: 'RESSALVA',
    EM_ANDAMENTO: 'ANÁLISE',
    ENVIADO: 'ENVIADO',
    AGUARDANDO_COLETA: 'CLIENTE',
  };

  return (
    <span className={`inline-block px-3 py-1 rounded-lg text-[9px] font-black tracking-widest border mx-auto ${styles[status] || styles.ENVIADO}`}>
       {labels[status] || status}
    </span>
  );
}
