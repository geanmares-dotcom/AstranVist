'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Car, 
  Mail, 
  Lock, 
  ArrowRight, 
  Loader2, 
  ShieldCheck,
  CheckCircle2,
  Globe
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const router = useRouter();

  React.useEffect(() => {
    const savedEmail = localStorage.getItem('strsat_remembered_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (forgotPasswordMode) {
        // Simulação de envio de recuperação de senha
        await new Promise(resolve => setTimeout(resolve, 1500));
        toast.success(`Um link de recuperação foi enviado para: ${email}`);
        setForgotPasswordMode(false);
      } else {
        const response = await api.post('/auth/login', { email, password });
        localStorage.setItem('token', response.data.access_token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        if (rememberMe) {
          localStorage.setItem('strsat_remembered_email', email);
        } else {
          localStorage.removeItem('strsat_remembered_email');
        }
        
        router.push('/');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || (forgotPasswordMode ? 'Erro ao enviar recuperação' : 'Erro ao realizar login'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-mesh flex items-center justify-center p-6 overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full"></div>

      <div className="w-full max-w-[1100px] grid grid-cols-1 lg:grid-cols-2 bg-slate-900 rounded-[32px] overflow-hidden shadow-2xl border border-white/5 animate-in">
        
        {/* Branding Side */}
        <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
          
          <div className="relative z-10 flex items-start group">
            <img src="/logo-dark.png" alt="STRSAT Gestão de Risco" className="h-20 object-contain drop-shadow-2xl" />
          </div>

          <div className="relative z-10">
            <h2 className="text-4xl font-extrabold text-white mb-6 leading-tight italic">
              Gestão de Risco <br /> 
              <span className="text-[var(--accent)]">inteligente.</span>
            </h2>
            <div className="space-y-4">
              <FeatureItem icon={<CheckCircle2 size={18} />} text="Análise automática por IA" />
              <FeatureItem icon={<ShieldCheck size={18} />} text="Segurança e conformidade total" />
              <FeatureItem icon={<Globe size={18} />} text="Gestão multi-tenant em tempo real" />
            </div>
          </div>

          <div className="relative z-10 text-blue-200/60 text-xs font-medium">
            © 2026 STRSAT. Todos os direitos reservados.
          </div>
        </div>

        {/* Login Form Side */}
        <div className="p-8 lg:p-16 flex flex-col justify-center bg-slate-950/50">
          <div className="mb-10 text-center lg:text-left">
            <h3 className="text-3xl font-extrabold text-white mb-2 tracking-tight">
              {forgotPasswordMode ? 'Recuperar Senha' : 'Login Portal'}
            </h3>
            <p className="text-slate-400 font-medium">
              {forgotPasswordMode 
                ? 'Informe seu e-mail para receber as instruções de recuperação.' 
                : 'Insira suas credenciais para acessar a plataforma.'}
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Endereço de E-mail</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors" size={20} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field !pl-12"
                  placeholder="exemplo@empresa.com.br"
                  required
                />
              </div>
            </div>

            {!forgotPasswordMode && (
              <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Senha de Acesso</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors" size={20} />
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field !pl-12"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
            )}

            {!forgotPasswordMode && (
              <div className="flex items-center justify-between text-xs pt-2 animate-in fade-in">
                <label className="flex items-center gap-2 text-slate-400 cursor-pointer hover:text-white transition-colors">
                  <input 
                    type="checkbox" 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0 focus:ring-offset-0" 
                  />
                  Lembrar de mim
                </label>
                <button type="button" onClick={() => setForgotPasswordMode(true)} className="font-bold text-blue-500 hover:text-blue-400 transition-colors">Esqueceu a senha?</button>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="btn-ovi-primary w-full py-4 text-sm uppercase tracking-widest mt-4"
            >
              {loading ? <Loader2 className="animate-spin mx-auto" /> : (
                forgotPasswordMode ? <>Enviar Link de Recuperação <ArrowRight size={18} /></> : <>Entrar no Sistema <ArrowRight size={18} /></>
              )}
            </button>

            {forgotPasswordMode && (
              <button 
                type="button"
                onClick={() => setForgotPasswordMode(false)}
                className="w-full text-center text-xs font-bold text-slate-400 hover:text-white transition-colors mt-4"
              >
                Voltar para o Login
              </button>
            )}
          </form>

          <div className="mt-10 text-center lg:text-left">
            <p className="text-sm text-slate-500">
              Precisa de ajuda? <a href="tel:08000276130" className="font-bold text-blue-500 hover:text-blue-400 transition-colors">Fale com o suporte (0800 027 6130)</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ icon, text }: { icon: React.ReactNode, text: string }) {
  return (
    <div className="flex items-center gap-3 text-white/80 font-semibold text-sm bg-white/5 backdrop-blur-sm p-3 rounded-xl border border-white/5">
      <span className="text-blue-300">{icon}</span>
      {text}
    </div>
  );
}
