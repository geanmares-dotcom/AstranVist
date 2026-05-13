'use client';

import React from 'react';
import { 
  LayoutDashboard, 
  PlusCircle, 
  ClipboardList, 
  Settings, 
  LogOut,
  Zap,
  User,
  Users as UsersIcon,
  Target,
  Activity,
  CheckCircle2
} from 'lucide-react';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { queueService } from '../services/queueService';
import api from '../services/api';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: PlusCircle, label: 'Nova Vistoria', href: '/vistorias/nova' },
  { icon: ClipboardList, label: 'Mesa de Análise', href: '/analise' },
  { icon: UsersIcon, label: 'Gestão de Integrantes', href: '/usuarios' },
  { icon: Settings, label: 'Configurações', href: '/settings' },
];


export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  // Busca perfil do usuário logado
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
       const res = await api.get('/auth/me');
       return res.data;
    }
  });

  // Busca estatísticas pessoais
  const { data: myStats, isLoading } = useQuery({
    queryKey: ['myStats'],
    queryFn: async () => {
       const res = await api.get('/queue/stats/me');
       return res.data;
    },
    refetchInterval: 30000,
  });

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  const myCount = myStats?.count || 0;
  const myGoal = 50; // Meta sugerida de 50 vistorias/dia
  const progress = Math.min((myCount / myGoal) * 100, 100);

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col shrink-0 h-screen overflow-hidden">
      {/* Brand */}
      <div className="p-8">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Zap className="text-white" size={24} fill="white" />
          </div>
          <div>
            <span className="text-xl font-black tracking-tighter block leading-none">ASTRAN</span>
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mt-1 block">Vist 2.0</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1">
        {menuItems.map((item) => {
          // Bloqueia gestão de usuários para analistas
          if (item.href === '/usuarios' && profile?.role === 'ANALYST') return null;
          
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all group ${
                isActive 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon size={20} className={isActive ? 'text-white' : 'text-slate-500 group-hover:text-indigo-400'} />
              {item.label}
            </Link>
          );
        })}
      </nav>


      {/* Personal Productivity Widget - Only show on Analysis related pages */}
      {pathname.startsWith('/analise') && (
        <div className="px-6 py-6 border-t border-white/5 bg-white/5 animate-in">
           <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/10">
                 <User size={18} className="text-indigo-400" />
              </div>
              <div className="overflow-hidden">
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Analista Técnico</p>
                 <p className="text-sm font-bold text-white truncate mt-1">{profile?.name || 'Carregando...'}</p>
              </div>
           </div>

           <div className="space-y-4">
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2">
                    <Target size={14} className="text-indigo-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Minha Produção</span>
                 </div>
                 <span className="text-[10px] font-black text-indigo-400">{myCount} / {myGoal}</span>
              </div>

              <div className="space-y-2">
                 <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <div 
                       className="h-full bg-indigo-500 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                       style={{ width: `${progress}%` }}
                    ></div>
                 </div>
                 <div className="flex justify-between text-[9px] font-bold text-slate-500">
                    <span>{progress.toFixed(0)}% da meta diária</span>
                    {myCount >= myGoal && <CheckCircle2 size={12} className="text-emerald-500" />}
                 </div>
              </div>
           </div>

           <div className="mt-6 flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/5">
              <div className="h-8 w-8 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                 <Activity size={16} className="text-emerald-500" />
              </div>
              <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Status da Rede</p>
                 <p className="text-[11px] font-bold text-emerald-500">Operacional</p>
              </div>
           </div>
        </div>
      )}


      {/* Logout */}
      <div className="p-4 border-t border-white/5">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-rose-400 hover:bg-rose-500/10 transition-all group"
        >
          <LogOut size={20} className="text-rose-500 group-hover:scale-110 transition-transform" />
          Sair da Conta
        </button>
      </div>
    </aside>
  );
}
