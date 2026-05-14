'use client';

import React from 'react';
import { 
  LayoutDashboard, 
  ClipboardList, 
  Settings, 
  LogOut,
  Car,
  Users,
  ShieldCheck,
  PlusCircle,
  Menu,
  X,
  Moon,
  Sun
} from 'lucide-react';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { authService } from '../services/authService';
import { useTheme } from '../contexts/ThemeContext';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard', color: 'indigo' },
  { icon: PlusCircle, label: 'Vistorias', href: '/vistorias/nova', color: 'blue' },
  { icon: ClipboardList, label: 'Mesa de Análise', href: '/analise', color: 'violet' },
  { icon: Users, label: 'Gestão de Equipe', href: '/usuarios', color: 'emerald', adminOnly: true },
  { icon: Settings, label: 'Ajustes', href: '/settings', color: 'slate' },
];


export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [user, setUser] = React.useState<any>(null);

  React.useEffect(() => {
    setMounted(true);
    setUser(authService.getUser());
  }, []);

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERVISOR';

  const handleLogout = () => {
    authService.logout();
    router.push('/login');
  };

  const filteredItems = menuItems.filter(item => !item.adminOnly || (mounted && isAdmin));


  return (
    <aside className="w-72 bg-white dark:bg-slate-900 h-screen flex flex-col p-6 border-r border-slate-100 dark:border-slate-800 shrink-0 z-50">
      {/* Logo Capsule */}
      <div className="flex items-center justify-center px-4 mb-12">
        <img src="/logo-light.png" alt="STRSAT Gestão de Risco" className="h-14 w-auto object-contain dark:hidden" />
        <img src="/logo-dark.png" alt="STRSAT Gestão de Risco" className="h-14 w-auto object-contain hidden dark:block" />
      </div>

      {/* Menu Items */}
      <nav className="flex-1 space-y-2">
        {filteredItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex items-center gap-4 px-6 py-4 rounded-full transition-all duration-300 group relative ${
                isActive 
                ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100 dark:shadow-none translate-x-2' 
                : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <div className={`transition-colors ${isActive ? 'text-white' : 'group-hover:text-indigo-500'}`}>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`text-sm font-extrabold tracking-tight ${isActive ? 'opacity-100' : 'opacity-80'}`}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute right-4 w-1.5 h-1.5 bg-white rounded-full"></div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User & Logout Capsule */}
      <div className="mt-auto space-y-4">
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 flex items-center gap-3 border border-slate-100 dark:border-slate-800 relative group">
           <div className="h-10 w-10 bg-white dark:bg-slate-700 rounded-full flex items-center justify-center shadow-sm text-indigo-600 dark:text-indigo-400 font-black border border-slate-100 dark:border-slate-700">
              {user?.name?.charAt(0) || 'U'}
           </div>
           <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-slate-900 dark:text-white truncate uppercase">{user?.name || 'Usuário'}</p>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest truncate">{user?.role || 'Acess'}</p>
           </div>
           
           <button 
             onClick={toggleTheme}
             className="h-8 w-8 bg-white dark:bg-slate-700 rounded-full flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-600 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all active:scale-90"
             title={theme === 'light' ? 'Ativar Modo Escuro' : 'Ativar Modo Claro'}
           >
              {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
           </button>
        </div>

        
        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-3 py-4 rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-all font-black text-[10px] uppercase tracking-[0.2em]"
        >
          <LogOut size={16} /> Sair do Sistema
        </button>
      </div>
    </aside>
  );
}

