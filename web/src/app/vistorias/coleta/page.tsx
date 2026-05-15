'use client';

import React, { useState } from 'react';
import { 
  Camera, 
  ChevronLeft, 
  Check, 
  X, 
  MapPin, 
  Car, 
  User, 
  Clipboard,
  Loader2,
  CheckCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { inspectionService } from '../../../services/inspectionService';
import api from '../../../services/api';


const STEPS = [
  { id: 'data', label: 'Dados' },
  { id: 'photos', label: 'Fotos' },
  { id: 'finish', label: 'Conclusão' }
];

const PHOTO_CATEGORIES = [
  { id: 'frontal', label: 'Frontal' },
  { id: 'lateral_esq', label: 'Lateral Esquerda' },
  { id: 'lateral_dir', label: 'Lateral Direita' },
  { id: 'traseira', label: 'Traseira' },
  { id: 'painel', label: 'Painel / Hodômetro' },
  { id: 'chassi', label: 'Chassi' }
];

export default function MobileColetaSimulation() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [inspectionId, setInspectionId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    placa: '',
    cliente: '',
    seguradora: '',
    modelo: '',
  });

  const [photos, setPhotos] = useState<Record<string, string>>({});

  const handleNext = async () => {
    if (step === 0) {
      // Simulação de criação de vistoria
      setLoading(true);
      try {
        // Bypass auth para simulação se necessário ou usa token existente
        const response = await api.post('/inspections', formData);
        setInspectionId(response.data.id);
        setStep(1);
      } catch (err) {
        toast.error('Erro ao iniciar vistoria. Verifique o console.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    } else if (step === 1) {
      // Simulação de envio de fotos
      setLoading(true);
      try {
        const photoData = Object.entries(photos).map(([catId, url]) => ({
          categoria: PHOTO_CATEGORIES.find(c => c.id === catId)?.label || catId,
          url: url,
          latitude: -23.5505, // Mock GPS
          longitude: -46.6333
        }));

        await api.post(`/inspections/${inspectionId}/photos`, { photos: photoData });
        setStep(2);
      } catch (err) {
        toast.error('Erro ao enviar fotos.');
      } finally {
        setLoading(false);
      }
    } else {
      router.push('/');
    }
  };

  const simulatePhoto = (catId: string) => {
    // Usa uma imagem do Unsplash para simular a captura
    const mockUrls: Record<string, string> = {
      frontal: 'https://images.unsplash.com/photo-1542362567-b05503f3f5f4?q=80&w=800',
      lateral_esq: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=800',
      lateral_dir: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?q=80&w=800',
      traseira: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?q=80&w=800',
      painel: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=800',
      chassi: 'https://images.unsplash.com/photo-1517524206127-48bbd363f3d7?q=80&w=800'
    };
    
    setPhotos(prev => ({ ...prev, [catId]: mockUrls[catId] || mockUrls.frontal }));
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans max-w-md mx-auto flex flex-col">
      {/* Mobile Header */}
      <header className="p-6 border-b border-white/10 flex items-center justify-between bg-slate-900 sticky top-0 z-10">
        <button onClick={() => router.back()} className="p-2 -ml-2">
          <ChevronLeft />
        </button>
        <h1 className="text-lg font-bold">Nova Coleta</h1>
        <div className="w-10"></div>
      </header>

      {/* Progress Steps */}
      <div className="flex px-6 py-4 gap-2">
        {STEPS.map((s, idx) => (
          <div 
            key={s.id} 
            className={`h-1.5 flex-1 rounded-full transition-all ${idx <= step ? 'bg-blue-500' : 'bg-white/10'}`} 
          />
        ))}
      </div>

      <main className="flex-1 p-6 flex flex-col">
        {step === 0 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold">Início da Vistoria</h2>
              <p className="text-slate-400 text-sm">Identifique o veículo para começar.</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Placa do Veículo</label>
                <div className="relative">
                  <Car className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input 
                    type="text" 
                    placeholder="ABC-1234"
                    className="w-full bg-slate-800 border-none rounded-xl py-4 pl-10 focus:ring-2 focus:ring-blue-500 outline-none text-lg font-mono tracking-widest uppercase"
                    value={formData.placa}
                    onChange={e => setFormData({...formData, placa: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Nome do Cliente</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input 
                    type="text" 
                    placeholder="Ex: João da Silva"
                    className="w-full bg-slate-800 border-none rounded-xl py-4 pl-10 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.cliente}
                    onChange={e => setFormData({...formData, cliente: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Modelo / Marca</label>
                <div className="relative">
                  <Clipboard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input 
                    type="text" 
                    placeholder="Ex: Volvo FH 540"
                    className="w-full bg-slate-800 border-none rounded-xl py-4 pl-10 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.modelo}
                    onChange={e => setFormData({...formData, modelo: e.target.value})}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold">Captura de Fotos</h2>
              <p className="text-slate-400 text-sm">Capture todas as fotos obrigatórias.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {PHOTO_CATEGORIES.map(cat => (
                <button 
                  key={cat.id}
                  onClick={() => simulatePhoto(cat.id)}
                  className={`aspect-square rounded-2xl border-2 flex flex-col items-center justify-center gap-2 p-4 transition-all relative overflow-hidden ${
                    photos[cat.id] ? 'border-blue-500 bg-blue-500/10' : 'border-white/10 bg-slate-800 hover:bg-slate-700'
                  }`}
                >
                  {photos[cat.id] ? (
                    <>
                      <img src={photos[cat.id]} className="absolute inset-0 w-full h-full object-cover opacity-60" />
                      <div className="relative z-10 bg-blue-600 p-1.5 rounded-full">
                        <Check size={18} />
                      </div>
                    </>
                  ) : (
                    <Camera className="text-slate-500" size={32} />
                  )}
                  <span className="text-[10px] font-bold uppercase tracking-wider relative z-10">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 animate-in zoom-in-95">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(34,197,94,0.4)]">
              <CheckCircle size={48} />
            </div>
            <h2 className="text-2xl font-bold">Vistoria Finalizada!</h2>
            <p className="text-slate-400">Os dados foram enviados com sucesso para a mesa de análise.</p>
            <div className="bg-slate-800 p-4 rounded-xl w-full text-left">
              <p className="text-xs text-slate-500 uppercase font-bold mb-1">Protocolo Gerado</p>
              <p className="text-xl font-mono text-blue-400">VIST-2026-XQ92L</p>
            </div>
          </div>
        )}

        <div className="mt-auto pt-8">
          <button 
            disabled={loading || (step === 1 && Object.keys(photos).length < PHOTO_CATEGORIES.length)}
            onClick={handleNext}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 py-5 rounded-2xl font-bold text-lg shadow-xl shadow-blue-900/20 active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            {loading ? <Loader2 className="animate-spin" /> : (
              step === 2 ? 'Voltar ao Início' : 'Continuar'
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
