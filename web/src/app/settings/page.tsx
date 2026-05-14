'use client';

import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  User, 
  Building2, 
  Shield, 
  Bell, 
  Save, 
  Camera, 
  Lock,
  Mail,
  Smartphone,
  Globe,
  Zap,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import { authService } from '../../services/authService';
import { tenantService } from '../../services/tenantService';
import { useTheme } from '../../contexts/ThemeContext';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'profile' | 'organization' | 'security' | 'notifications'>('profile');

  const [user, setUser] = useState<any>(null);
  const [tenant, setTenant] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form States
  const [profileForm, setProfileForm] = useState({ name: '', email: '', phone: '' });
  const [securityForm, setSecurityForm] = useState({ oldPass: '', newPass: '', confirmPass: '' });
  const [orgForm, setOrgForm] = useState({ name: '' });

  useEffect(() => {
    setMounted(true);
    const currentUser = authService.getUser();
    setUser(currentUser);
    
    if (currentUser) {
      setProfileForm({
        name: currentUser.name || '',
        email: currentUser.email || '',
        phone: ''
      });

      if (currentUser.tenantId) {
        setLoading(true);
        tenantService.getById(currentUser.tenantId)
          .then(data => {
            setTenant(data);
            setOrgForm({ name: data.name });
          })
          .finally(() => setLoading(false));
      }
    }
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    try {
      if (activeTab === 'profile') {
        await authService.updateProfile({ name: profileForm.name, email: profileForm.email });
        // Atualiza estado local do usuário
        const updatedUser = authService.getUser();
        setUser(updatedUser);
      } else if (activeTab === 'security') {
        if (securityForm.newPass !== securityForm.confirmPass) {
          alert('As senhas não coincidem');
          return;
        }
        await authService.changePassword(securityForm.oldPass, securityForm.newPass);
        setSecurityForm({ oldPass: '', newPass: '', confirmPass: '' });
      } else if (activeTab === 'organization' && user.tenantId) {
        await tenantService.update(user.tenantId, { name: orgForm.name });
      }
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao salvar alterações');
    } finally {
      setSaving(false);
    }
  };

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERVISOR';

  if (!mounted) return null;

  return (
    <div className="flex h-screen bg-[var(--bg-main)] text-slate-800 dark:text-slate-200 overflow-hidden font-sans">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header Moderno */}
        <header className="h-20 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800 px-10 flex items-center justify-between shrink-0 z-30">
          <div className="flex items-center gap-4">
             <div className="h-10 w-10 bg-slate-900 dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-200 dark:shadow-none">
                <Settings className="text-white" size={20} />
             </div>
             <div>
                <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Ajustes do Sistema</h1>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">Configure sua experiência</p>
             </div>
          </div>
          
          <div className="flex items-center gap-4">
            {success && (
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs animate-in">
                <CheckCircle2 size={16} /> Alterações salvas!
              </div>
            )}
            <button 
              onClick={handleSave}
              disabled={saving}
              className="btn-ovi-primary disabled:opacity-50 min-w-[200px]"
            >
              {saving ? <Loader2 className="animate-spin" size={18} /> : <><Save size={18} /> Salvar Alterações</>}
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-10">
          <div className="flex gap-12 items-start">
            
            {/* Navegação de Ajustes (Menu Lateral Interno) */}
            <aside className="w-80 shrink-0 space-y-4">


               <NavButton 
                 active={activeTab === 'profile'} 
                 onClick={() => setActiveTab('profile')} 
                 icon={<User size={18} />} 
                 label="Meu Perfil" 
                 desc="Dados pessoais e contato"
               />
               {isAdmin && (
                 <NavButton 
                   active={activeTab === 'organization'} 
                   onClick={() => setActiveTab('organization')} 
                   icon={<Building2 size={18} />} 
                   label="Organização" 
                   desc="Sua empresa e marca"
                 />
               )}
               <NavButton 
                 active={activeTab === 'security'} 
                 onClick={() => setActiveTab('security')} 
                 icon={<Shield size={18} />} 
                 label="Segurança" 
                 desc="Senha e acessos"
               />
               <NavButton 
                 active={activeTab === 'notifications'} 
                 onClick={() => setActiveTab('notifications')} 
                 icon={<Bell size={18} />} 
                 label="Preferências" 
                 desc="Tema e alertas"
               />
            </aside>

            {/* Conteúdo Dinâmico */}
            <div className="flex-1 space-y-8 pb-20">
               
               {activeTab === 'profile' && (
                 <div className="space-y-8 animate-in">
                    <section className="ovi-card p-10">
                       <div className="flex items-center gap-8 mb-10">
                          <div className="relative group">
                             <div className="h-24 w-24 bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-[2.5rem] flex items-center justify-center text-3xl font-black border-4 border-white dark:border-slate-800 shadow-xl">
                                {user?.name?.charAt(0) || 'U'}
                             </div>
                             <button className="absolute -bottom-2 -right-2 h-10 w-10 bg-white dark:bg-slate-700 rounded-full shadow-lg border border-slate-100 dark:border-slate-600 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all active:scale-90">
                                <Camera size={18} />
                             </button>
                          </div>
                          <div>
                             <h3 className="text-xl font-black text-slate-900 dark:text-white">{user?.name}</h3>
                             <p className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{user?.role} na {tenant?.name || 'STRSAT'}</p>
                          </div>
                       </div>

                       <div className="grid grid-cols-2 gap-6">
                          <InputField 
                            label="Nome Completo" 
                            value={profileForm.name} 
                            onChange={(e: any) => setProfileForm({...profileForm, name: e.target.value})}
                            icon={<User size={16} />} 
                          />
                          <InputField 
                            label="E-mail Corporativo" 
                            value={profileForm.email} 
                            onChange={(e: any) => setProfileForm({...profileForm, email: e.target.value})}
                            icon={<Mail size={16} />} 
                          />
                          <InputField 
                            label="Telefone / WhatsApp" 
                            value={profileForm.phone}
                            onChange={(e: any) => setProfileForm({...profileForm, phone: e.target.value})}
                            placeholder="(00) 00000-0000" 
                            icon={<Smartphone size={16} />} 
                          />
                          <InputField label="Idioma" value="Português (Brasil)" icon={<Globe size={16} />} readOnly />
                       </div>
                    </section>
                 </div>
               )}

               {activeTab === 'organization' && (
                 <div className="space-y-8 animate-in">
                    <section className="ovi-card p-10">
                       <h3 className="text-lg font-black text-slate-900 dark:text-white mb-8 flex items-center gap-3">
                          <Building2 className="text-indigo-600" size={20} /> Dados da Empresa
                       </h3>
                       <div className="grid grid-cols-2 gap-6">
                          <div className="col-span-2">
                             <InputField 
                               label="Nome da Organização" 
                               value={orgForm.name} 
                               onChange={(e: any) => setOrgForm({...orgForm, name: e.target.value})}
                               icon={<Building2 size={16} />} 
                             />
                          </div>
                          <InputField label="Domínio / Slug" value={tenant?.slug} icon={<Zap size={16} />} disabled />
                          <div className="flex flex-col gap-2">
                             <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-4">Status da Conta</label>
                             <div className="bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 dark:text-emerald-400 font-bold px-6 py-3.5 rounded-full border border-emerald-100 dark:border-emerald-900/20 inline-flex items-center gap-2 self-start text-xs">
                                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div> Ativa e Regularizada
                             </div>
                          </div>
                       </div>
                    </section>

                    <section className="ovi-card p-10">
                       <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">Identidade Visual</h3>
                       <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-8">Personalize o logo e cores do seu portal</p>
                       
                       <div className="p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 hover:border-indigo-400 transition-colors group cursor-pointer">
                          <div className="h-16 w-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20 group-hover:text-indigo-600 transition-all">
                             <Camera size={32} />
                          </div>
                          <div className="text-center">
                             <p className="text-sm font-black text-slate-700 dark:text-slate-300">Clique para subir seu Logo</p>
                             <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">PNG ou SVG (Recomendado 512x512)</p>
                          </div>
                       </div>
                    </section>
                 </div>
               )}

               {activeTab === 'security' && (
                 <div className="space-y-8 animate-in">
                    <section className="ovi-card p-10">
                       <h3 className="text-lg font-black text-slate-900 dark:text-white mb-8 flex items-center gap-3">
                          <Lock className="text-indigo-600" size={20} /> Alterar Senha
                       </h3>
                       <div className="space-y-6 max-md max-w-md">
                          <InputField 
                            label="Senha Atual" 
                            type="password" 
                            value={securityForm.oldPass}
                            onChange={(e: any) => setSecurityForm({...securityForm, oldPass: e.target.value})}
                            icon={<Lock size={16} />} 
                          />
                          <InputField 
                            label="Nova Senha" 
                            type="password" 
                            value={securityForm.newPass}
                            onChange={(e: any) => setSecurityForm({...securityForm, newPass: e.target.value})}
                            icon={<Lock size={16} />} 
                          />
                          <InputField 
                            label="Confirmar Nova Senha" 
                            type="password" 
                            value={securityForm.confirmPass}
                            onChange={(e: any) => setSecurityForm({...securityForm, confirmPass: e.target.value})}
                            icon={<Lock size={16} />} 
                          />
                       </div>
                    </section>
                 </div>
               )}

               {activeTab === 'notifications' && (
                 <div className="space-y-8 animate-in">
                    <section className="ovi-card p-10">
                       <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">Tema do Sistema</h3>
                       <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-8">Personalize as cores da sua plataforma</p>
                       
                       <div className="grid grid-cols-2 gap-6">
                          <ThemeCard 
                            active={theme === 'light'} 
                            onClick={() => setTheme('light')}
                            label="Tema Claro" 
                            desc="Padrão para ambientes claros"
                            icon={<Zap size={24} className="text-orange-500" />}
                            previewClass="bg-slate-100 border-slate-200"
                          />
                          <ThemeCard 
                            active={theme === 'dark'} 
                            onClick={() => setTheme('dark')}
                            label="Tema Escuro" 
                            desc="Conforto para uso noturno"
                            icon={<Zap size={24} className="text-indigo-400" />}
                            previewClass="bg-slate-900 border-slate-800"
                          />
                       </div>
                    </section>

                    <div className="text-center py-10 opacity-50">
                       <div className="h-16 w-16 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-[2.5rem] flex items-center justify-center mx-auto mb-4">
                          <Bell size={32} />
                       </div>
                       <h3 className="text-lg font-black text-slate-900 dark:text-white">Central de Avisos</h3>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Configurações de alerta em breve</p>
                    </div>
                 </div>
               )}


            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

function ThemeCard({ active, onClick, label, desc, icon, previewClass }: any) {
  return (
    <button 
      onClick={onClick}
      className={`p-6 rounded-[2rem] border-2 transition-all text-left group ${
        active ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/10 shadow-lg shadow-indigo-100 dark:shadow-none' : 'border-slate-100 hover:border-slate-300 dark:border-slate-800'
      }`}
    >
       <div className={`h-24 w-full rounded-2xl mb-6 border ${previewClass} flex items-center justify-center`}>
          {icon}
       </div>
       <div>
          <p className="text-sm font-black text-slate-900 dark:text-white">{label}</p>
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">{desc}</p>
       </div>
    </button>
  );
}

function NavButton({ active, onClick, icon, label, desc }: any) {

  return (
    <button 
      onClick={onClick}
      className={`w-full text-left p-5 rounded-[2rem] transition-all duration-300 flex items-center gap-4 group relative ${
        active 
        ? 'bg-white dark:bg-slate-800 shadow-xl shadow-slate-200 dark:shadow-none border border-slate-100 dark:border-slate-700' 
        : 'hover:bg-white/50 dark:hover:bg-slate-800/50 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
      }`}
    >
       <div className={`h-11 w-11 rounded-2xl flex items-center justify-center transition-all ${
         active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 dark:shadow-none' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20 group-hover:text-indigo-500'
       }`}>
          {icon}
       </div>
       <div className="flex-1">
          <p className={`text-sm font-black tracking-tight ${active ? 'text-slate-900 dark:text-white' : 'text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'}`}>{label}</p>
          <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">{desc}</p>
       </div>
       {active && (
         <div className="absolute right-6 w-1.5 h-1.5 bg-indigo-600 rounded-full"></div>
       )}
    </button>
  );
}


function InputField({ label, icon, ...props }: any) {
  return (
    <div className="flex flex-col gap-2">
       <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-4">{label}</label>
       <div className="relative">
          <div className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-400/80 pointer-events-none">
             {icon}
          </div>
          <input 
            {...props}
            className="input-field !rounded-full !pl-16 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-800 disabled:opacity-50 font-bold text-slate-700 dark:text-slate-200 placeholder:text-slate-300 dark:placeholder:text-slate-600"
          />


       </div>
    </div>
  );
}

