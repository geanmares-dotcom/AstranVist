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
  ExternalLink
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import api from '../../../services/api';
import Sidebar from '../../../components/Sidebar';

export default function NovaVistoriaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [createdData, setCreatedData] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  
  const [formData, setFormData] = useState({
    placa: '',
    cliente: '',
    modelo: '',
    chassi: '',
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post('/inspections', formData);
      setCreatedData(response.data);
    } catch (err: any) {
      alert('Erro ao criar vistoria: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (createdData?.shareLink) {
      navigator.clipboard.writeText(createdData.shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const shareWhatsApp = () => {
    const message = `Olá! Sou da AstranVist. Segue o link para realizar a coleta de fotos da sua vistoria: ${createdData.shareLink}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`, '_blank');
  };

  // Se a vistoria foi criada, mostra a tela de sucesso
  if (createdData) {
    return (
      <div className="flex h-screen bg-[#f8fafc] text-slate-800 overflow-hidden">
        <Sidebar />
        <main className="flex-1 flex flex-col items-center justify-center p-6 overflow-y-auto">
          <div className="ovi-card max-w-lg w-full overflow-hidden animate-in">
             <div className="bg-emerald-500 p-8 text-white text-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                   <Check size={32} />
                </div>
                <h2 className="text-2xl font-bold">Vistoria Criada com Sucesso!</h2>
                <p className="opacity-90 text-sm mt-1">Protocolo: {createdData.protocol}</p>
             </div>
             
             <div className="p-8 space-y-6">
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 space-y-4">
                   <p className="text-xs font-black text-slate-400 uppercase tracking-widest text-center">Link de Coleta para o Cliente</p>
                   <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-3 overflow-hidden">
                      <LinkIcon size={18} className="text-blue-500 shrink-0" />
                      <span className="text-xs text-slate-600 truncate font-medium flex-1">{createdData.shareLink}</span>
                   </div>

                   <div className="grid grid-cols-1 gap-3">
                      <button 
                        onClick={copyToClipboard}
                        className={`flex items-center justify-center gap-2 font-bold py-4 rounded-xl transition-all ${
                          copied ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {copied ? <><Check size={20} /> Link Copiado!</> : <><Copy size={20} /> Copiar Link de Coleta</>}
                      </button>
                      <button onClick={shareWhatsApp} className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 rounded-xl transition-all">
                        <MessageCircle size={20} /> Enviar via WhatsApp
                      </button>
                   </div>
                </div>

                <div className="pt-4 flex items-center justify-between">
                   <button onClick={() => setCreatedData(null)} className="text-sm font-bold text-slate-400 hover:text-slate-600">Criar outra</button>
                   <button onClick={() => router.push('/')} className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-sm">
                      Voltar ao Início <ExternalLink size={16} />
                   </button>
                </div>
             </div>
          </div>
        </main>
      </div>
    );
  }

  // Se não foi criada, mostra o formulário
  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-800 overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center gap-4 shrink-0">
          <button onClick={() => router.back()} className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400">
            <ChevronLeft />
          </button>
          <h1 className="text-xl font-bold">Nova Vistoria</h1>
        </header>

        <div className="flex-1 overflow-y-auto p-8 lg:p-12">
          <div className="max-w-2xl mx-auto ovi-card p-10 animate-in">
            <form onSubmit={handleCreate} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Placa</label>
                  <div className="relative">
                    <Car className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input required type="text" placeholder="ABC-1234" className="input-field pl-12 uppercase font-mono tracking-widest" value={formData.placa} onChange={e => setFormData({...formData, placa: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Modelo</label>
                  <div className="relative">
                    <Clipboard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input required type="text" placeholder="Ex: Volvo FH 540" className="input-field pl-12" value={formData.modelo} onChange={e => setFormData({...formData, modelo: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cliente</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input required type="text" placeholder="Nome completo" className="input-field pl-12" value={formData.cliente} onChange={e => setFormData({...formData, cliente: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Chassi</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xs">#</div>
                    <input type="text" placeholder="Opcional" className="input-field pl-12" value={formData.chassi} onChange={e => setFormData({...formData, chassi: e.target.value})} />
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100">
                <button type="submit" disabled={loading} className="btn-ovi-primary w-full py-5 text-sm uppercase tracking-widest">
                  {loading ? <Loader2 className="animate-spin" /> : <>Criar Vistoria e Gerar Link <Send size={18} /></>}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
