'use client';

import React, { useState } from 'react';
import { 
  UserPlus, 
  Search, 
  MoreVertical, 
  Shield, 
  Mail, 
  Calendar,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Users as UsersIcon
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import Sidebar from '../../components/Sidebar';

export default function UsuariosPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState('');
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'ANALYST'
  });

  // Lista usuários
  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
       const res = await api.get('/auth/users');
       return res.data;
    }
  });

  // Busca perfil para trava de segurança no front
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
       const res = await api.get('/auth/me');
       return res.data;
    }
  });

  // Se for analista, não deveria estar aqui. Redireciona.
  React.useEffect(() => {
    if (profile && profile.role === 'ANALYST') {
       window.location.href = '/dashboard';
    }
  }, [profile]);


  // Mutação para criar usuário
  const createUser = useMutation({
    mutationFn: async (data: typeof formData) => {
       const res = await api.post('/auth/register', data);
       return res.data;
    },
    onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['users'] });
       setIsModalOpen(false);
       setFormData({ name: '', email: '', password: '', role: 'ANALYST' });
       alert('Usuário criado com sucesso!');
    },
    onError: (err: any) => {
       alert(err.response?.data?.message || 'Erro ao criar usuário');
    }
  });

  const filteredUsers = users?.filter(u => 
    u.name.toLowerCase().includes(filter.toLowerCase()) || 
    u.email.toLowerCase().includes(filter.toLowerCase())
  ) || [];

  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-800 overflow-hidden font-sans">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
             <UsersIcon size={20} className="text-indigo-600" />
             <h1 className="text-lg font-bold text-slate-700">Gestão de Equipe</h1>
          </div>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-black py-2.5 px-6 rounded-xl transition-all shadow-lg shadow-indigo-100 flex items-center gap-2 text-[11px] uppercase tracking-widest"
          >
             <UserPlus size={16} /> Novo Integrante
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-6">
           {/* Barra de Filtro */}
           <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
              <Search className="text-slate-400" size={20} />
              <input 
                type="text" 
                placeholder="Buscar por nome ou e-mail..." 
                className="flex-1 bg-transparent border-none outline-none text-sm font-medium"
                value={filter}
                onChange={e => setFilter(e.target.value)}
              />
           </div>

           {/* Tabela de Usuários */}
           <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
              <table className="w-full text-left border-collapse">
                 <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                       <th className="px-8 py-5 font-black uppercase tracking-widest text-[10px] text-slate-400">Membro</th>
                       <th className="px-8 py-5 font-black uppercase tracking-widest text-[10px] text-slate-400">Cargo / Permissão</th>
                       <th className="px-8 py-5 font-black uppercase tracking-widest text-[10px] text-slate-400">Data de Cadastro</th>
                       <th className="px-8 py-5 font-black uppercase tracking-widest text-[10px] text-slate-400 text-right">Ações</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {isLoading ? (
                       <tr><td colSpan={4} className="py-20 text-center animate-pulse font-bold text-slate-300 uppercase text-xs tracking-widest">Carregando equipe...</td></tr>
                    ) : filteredUsers.map((user: any) => (
                       <tr key={user.id} className="hover:bg-slate-50/50 transition-all group">
                          <td className="px-8 py-5">
                             <div className="flex items-center gap-4">
                                <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-black text-sm border border-indigo-100">
                                   {user.name.charAt(0)}
                                </div>
                                <div>
                                   <p className="font-bold text-slate-900 leading-none">{user.name}</p>
                                   <p className="text-xs text-slate-400 mt-1">{user.email}</p>
                                </div>
                             </div>
                          </td>
                          <td className="px-8 py-5">
                             <RoleBadge role={user.role} />
                          </td>
                          <td className="px-8 py-5 text-slate-500 text-xs font-medium">
                             {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="px-8 py-5 text-right">
                             <button className="p-2 text-slate-300 hover:text-slate-600 transition-colors">
                                <MoreVertical size={20} />
                             </button>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>

        {/* Modal de Cadastro */}
        {isModalOpen && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 space-y-6 relative border border-white/20">
                 <button 
                   onClick={() => setIsModalOpen(false)}
                   className="absolute top-6 right-6 p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-all"
                 >
                    <X size={20} />
                 </button>

                 <div className="space-y-1">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Novo Integrante</h2>
                    <p className="text-xs text-slate-400 font-medium">Cadastre um novo membro para sua equipe de análise.</p>
                 </div>

                 <div className="space-y-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Nome Completo</label>
                       <input 
                         type="text" 
                         className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-medium outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                         placeholder="Ex: Carlos Oliveira"
                         value={formData.name}
                         onChange={e => setFormData({...formData, name: e.target.value})}
                       />
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">E-mail de Acesso</label>
                       <input 
                         type="email" 
                         className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-medium outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                         placeholder="analista@astranvist.com"
                         value={formData.email}
                         onChange={e => setFormData({...formData, email: e.target.value})}
                       />
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Senha Provisória</label>
                       <input 
                         type="password" 
                         className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-medium outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                         placeholder="••••••••"
                         value={formData.password}
                         onChange={e => setFormData({...formData, password: e.target.value})}
                       />
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Cargo / Nível</label>
                       <select 
                         className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-medium outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                         value={formData.role}
                         onChange={e => setFormData({...formData, role: e.target.value})}
                       >
                          <option value="ANALYST">Analista Técnico</option>
                          <option value="SUPERVISOR">Supervisor de Mesa</option>
                          <option value="ADMIN">Administrador</option>
                       </select>
                    </div>
                 </div>

                 <button 
                   disabled={createUser.isPending}
                   onClick={() => createUser.mutate(formData)}
                   className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 text-xs uppercase tracking-widest disabled:opacity-50"
                 >
                    {createUser.isPending ? <Loader2 className="animate-spin" /> : <>Cadastrar Integrante <CheckCircle2 size={18} /></>}
                 </button>
              </div>
           </div>
        )}
      </main>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const styles: any = {
    ADMIN: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    SUPERVISOR: 'bg-blue-50 text-blue-700 border-blue-100',
    ANALYST: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    SUPER_ADMIN: 'bg-slate-900 text-white border-slate-900',
  };

  const labels: any = {
    ADMIN: 'Administrador',
    SUPERVISOR: 'Supervisor',
    ANALYST: 'Analista Técnico',
    SUPER_ADMIN: 'Super Admin',
  };

  return (
    <span className={`inline-block px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${styles[role] || 'bg-slate-100'}`}>
       {labels[role] || role}
    </span>
  );
}
