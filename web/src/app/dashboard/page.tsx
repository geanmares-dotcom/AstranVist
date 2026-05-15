'use client';

import React from 'react';
import { 
  BarChart3, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  ArrowUpRight,
  Zap,
  LayoutDashboard,
  Calendar,
  Send,
  Plus
} from 'lucide-react';
import Link from 'next/link';


import { useQuery } from '@tanstack/react-query';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { inspectionService } from '../../services/inspectionService';
import Sidebar from '../../components/Sidebar';
import { useTheme } from '../../contexts/ThemeContext';
import { authService } from '../../services/authService';

const COLORS = ['#6366f1', '#f59e0b', '#3b82f6', '#ef4444', '#10b981', '#ec4899', '#8b5cf6', '#06b6d4'];

const formatStatus = (status: string) => {
  const map: any = {
    AGUARDANDO_COLETA: 'ENVIADO',
    COLETA_ACESSADA: 'ACESSADO',
    COLETA_EM_ANDAMENTO: 'EM ANDAMENTO',
    NOVA_COLETA: 'PENDENTE CLIENTE',
    FINALIZADO: 'APROVADO',
    REPROVADO: 'REPROVADO',
    APROVADO_COM_RESSALVAS: 'APROVADO C/ RESS.',
    EM_ANDAMENTO: 'EM ANÁLISE'
  };
  return map[status] || status;
};

export default function DashboardPage() {
  const [mounted, setMounted] = React.useState(false);
  const [user, setUser] = React.useState<any>(null);
  const { theme } = useTheme();
  
  React.useEffect(() => {
    setMounted(true);
    setUser(authService.getUser());
  }, []);


  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => inspectionService.getDashboardStats(),
    refetchInterval: 60000,
  });

  const isDark = theme === 'dark';

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--bg-main)]">
        <div className="flex flex-col items-center gap-4">
           <Zap className="text-indigo-600 animate-pulse" size={48} />
           <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">Iniciando Painel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[var(--bg-main)] text-slate-800 dark:text-slate-200 overflow-hidden font-sans">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header Superior */}
        <header className="h-20 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800 px-10 flex items-center justify-between shrink-0 z-30">
          <div className="flex items-center gap-4">
             <div className="h-10 w-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center">
                <LayoutDashboard className="text-indigo-600 dark:text-indigo-400" size={20} />
             </div>
             <div>
                <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Painel Executivo</h1>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">Indicadores de Performance</p>
             </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Link 
              href="/vistorias/nova" 
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-full font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-indigo-100 dark:shadow-none active:scale-95"
            >
               <Plus size={16} strokeWidth={3} />
               Nova Vistoria
            </Link>
          </div>


        </header>


        <div className="flex-1 overflow-y-auto p-10 space-y-10">
          
          <div className="animate-in">
             <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Olá, <span className="text-indigo-600 dark:text-indigo-400">{user?.name?.split(' ')[0] || 'Gestor'}</span>! 👋
             </h2>
             <div className="flex items-center gap-2 mt-1">
                <Calendar className="text-indigo-500" size={14} />
                <span className="text-sm font-bold text-slate-500 dark:text-slate-400 capitalize">
                  {mounted ? new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : '...'}
                </span>
             </div>
          </div>


          {/* Cards de KPIs em Estilo Cápsula */}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <StatCard 
              label="Vistorias Criadas" 
              value={stats?.summary.criadas} 
              icon={<Send size={24} />} 
              color="indigo" 
              trend="+12% que ontem"
            />
            <StatCard 
              label="Mesa de Análise" 
              value={stats?.summary.mesa} 
              icon={<Zap size={24} />} 
              color="orange" 
              trend="Fila Prioritária"
            />
            <StatCard 
              label="Concluídas" 
              value={stats?.summary.concluidas} 
              icon={<CheckCircle2 size={24} />} 
              color="emerald" 
              trend="Saldo do Mês"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Gráfico de Volume Mensal */}
            <div className="lg:col-span-8 ovi-card p-10 flex flex-col h-full min-h-[480px]">
              <div className="flex items-center justify-between mb-10">
                <div>
                   <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Volume Mensal</h3>
                   <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Captação por dia</p>
                </div>
                <div className="h-10 w-10 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex items-center justify-center text-slate-400">
                   <TrendingUp size={18} />
                </div>
              </div>
              
              <div className="flex-1 w-full overflow-hidden">
                <ResponsiveContainer width="99%" height="100%">
                  <AreaChart data={stats?.dailyVolume} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#e2e8f0'} opacity={0.5} />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: isDark ? '#64748b' : '#94a3b8', fontSize: 10, fontWeight: 700}}
                      tickFormatter={(val) => val.split('-')[2]}
                    />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: isDark ? '#64748b' : '#94a3b8', fontSize: 10, fontWeight: 700}} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: isDark ? '#0f172a' : '#ffffff', 
                        borderRadius: '20px', 
                        border: isDark ? '1px solid #1e293b' : 'none', 
                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', 
                        padding: '15px' 
                      }}
                      labelStyle={{ fontWeight: 800, color: isDark ? '#f1f5f9' : '#0f172a', marginBottom: '5px' }}
                      itemStyle={{ color: '#6366f1' }}
                    />
                    <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorCount)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Distribuição por Status */}
            <div className="lg:col-span-4 ovi-card p-10 flex flex-col h-full min-h-[480px]">
              <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight mb-2 text-center">Distribuição</h3>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-8 text-center">Status das vistorias</p>
              
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats?.statusDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}

                      paddingAngle={8}
                      dataKey="count"
                    >
                      {stats?.statusDistribution.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: isDark ? '#0f172a' : '#ffffff', 
                        borderRadius: '20px', 
                        border: isDark ? '1px solid #1e293b' : 'none', 
                        padding: '10px' 
                      }}
                      itemStyle={{ color: isDark ? '#f1f5f9' : '#0f172a', fontSize: '10px', fontWeight: 'bold' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-6">
                  {stats?.statusDistribution.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 backdrop-blur-sm p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                       <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                       <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 truncate uppercase tracking-tight">{formatStatus(item.status)}</span>
                    </div>
                  ))}

              </div>
            </div>
          </div>
          
          {/* Top Analistas */}
          <section className="ovi-card p-10 overflow-hidden">
             <div className="flex items-center gap-4 mb-8">
                <div className="h-10 w-10 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                   <ArrowUpRight size={20} />
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Performance dos Analistas (Hoje)</h3>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                {stats?.topAnalysts.map((analyst: any, idx: number) => (
                   <div key={idx} className="bg-slate-50/50 dark:bg-slate-800/30 rounded-[2rem] p-6 border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center space-y-3 transition-transform hover:-translate-y-2">
                      <div className="h-14 w-14 bg-white dark:bg-slate-700 rounded-full shadow-lg shadow-slate-100 dark:shadow-none flex items-center justify-center font-black text-indigo-600 dark:text-indigo-400 text-lg border border-slate-100 dark:border-slate-700">
                         {analyst.name.charAt(0)}
                      </div>
                      <div>
                         <p className="text-xs font-black text-slate-900 dark:text-white uppercase truncate max-w-[120px]">{analyst.name}</p>
                         <div className="flex items-center justify-center gap-1.5 mt-1">
                            <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">{analyst.count}</span>
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Feitos</span>
                         </div>
                      </div>
                   </div>
                ))}
             </div>
          </section>
        </div>
      </main>
    </div>
  );
}


function StatCard({ label, value, icon, color, trend }: any) {

  const colorVariants: any = {
    indigo: 'bg-indigo-600 shadow-indigo-100 text-white',
    orange: 'bg-orange-500 shadow-orange-100 text-white',
    emerald: 'bg-emerald-500 shadow-emerald-100 text-white',
  };

  return (
    <div className={`ovi-card p-8 flex items-center gap-6 group hover:scale-[1.02] transition-all duration-300`}>
      <div className={`h-16 w-16 ${colorVariants[color]} rounded-[1.8rem] flex items-center justify-center shadow-2xl`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{label}</p>
        <div className="flex items-baseline gap-2">
           <h4 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{value || 0}</h4>
        </div>
        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
           <TrendingUp size={10} className="text-emerald-500" /> {trend}
        </p>

      </div>
    </div>
  );
}
