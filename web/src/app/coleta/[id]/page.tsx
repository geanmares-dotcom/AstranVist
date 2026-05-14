'use client';

import React, { useState, useEffect } from 'react';
import { 
  Camera, 
  Check, 
  Loader2,
  CheckCircle,
  Car,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import api from '../../../services/api';


const PHOTO_CATEGORIES = [
  { id: 'frontal', label: 'Frontal do Veículo' },
  { id: 'lateral_esq', label: 'Lateral Esquerda' },
  { id: 'lateral_dir', label: 'Lateral Direita' },
  { id: 'traseira', label: 'Traseira' },
  { id: 'painel', label: 'Painel / Hodômetro' },
  { id: 'chassi', label: 'Número do Chassi' }
];

export default function PublicColetaPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [inspection, setInspection] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [photos, setPhotos] = useState<Record<string, string>>({});
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (id) {
      // Busca dados básicos da vistoria (Público)
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      fetch(`${apiUrl}/inspections/${id}`)
        .then(res => res.json())
        .then(data => {
          setInspection(data);
          setLoading(false);
          
          // Preenche fotos já existentes
          if (data.photos && data.photos.length > 0) {
            const existingPhotos: Record<string, string> = {};
            data.photos.forEach((p: any) => {
              const cat = PHOTO_CATEGORIES.find(c => c.label === p.categoria);
              if (cat) {
                existingPhotos[cat.id] = p.url;
              }
            });
            setPhotos(existingPhotos);
          }

          // Marca como acessado
          fetch(`${apiUrl}/inspections/public/${id}/mark-accessed`, { method: 'POST' });
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [id]);

  const handleCapture = (catId: string) => {
    // Se a foto já existe e foi carregada do banco, não deixa tirar de novo (a menos que queira permitir sobrescrever)
    // No caso de NOVA_COLETA, as rejeitadas foram deletadas, então elas estarão vazias aqui.
    
    // Simulação de captura real
    const mockUrls: Record<string, string> = {
      frontal: 'https://images.unsplash.com/photo-1542362567-b05503f3f5f4?q=80&w=800',
      lateral_esq: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=800',
      lateral_dir: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?q=80&w=800',
      traseira: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?q=80&w=800',
      painel: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=800',
      chassi: 'https://images.unsplash.com/photo-1517524206127-48bbd363f3d7?q=80&w=800'
    };
    
    // Se for a primeira foto sendo tirada NESTA SESSÃO
    if (Object.keys(photos).length === (inspection?.photos?.length || 0)) {
       const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
       fetch(`${apiUrl}/inspections/public/${id}/mark-started`, { method: 'POST' });
    }

    setPhotos(prev => ({ ...prev, [catId]: mockUrls[catId] || mockUrls.frontal }));
  };



  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const photoData = Object.entries(photos).map(([catId, url]) => ({
        categoria: PHOTO_CATEGORIES.find(c => c.id === catId)?.label || catId,
        url: url,
        latitude: -23.5505,
        longitude: -46.6333
      }));

      // Endpoint público sem necessidade de token
      await api.post(`/inspections/${id}/photos`, { photos: photoData });
      setFinished(true);
    } catch (err) {
      alert('Erro ao enviar as fotos. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
      <Loader2 className="animate-spin text-blue-600" size={40} />
    </div>
  );

  if (!inspection) return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-8 text-center">
       <AlertCircle size={64} className="text-rose-500 mb-4" />
       <h1 className="text-xl font-bold">Link Inválido</h1>
       <p className="text-slate-500 mt-2">Esta vistoria não foi encontrada ou o link expirou.</p>
    </div>
  );

  if (finished) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center space-y-6">
       <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
          <CheckCircle size={56} />
       </div>
       <div>
          <h1 className="text-2xl font-bold text-slate-900">Coleta Realizada!</h1>
          <p className="text-slate-500 mt-2">Suas fotos foram enviadas com sucesso para análise técnica.</p>
       </div>
       <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 w-full max-w-xs">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocolo</p>
          <p className="text-lg font-mono font-bold text-slate-700">{inspection.protocol}</p>
       </div>
       <p className="text-xs text-slate-400">Você já pode fechar esta janela.</p>
    </div>
  );

  const allPhotosTaken = Object.keys(photos).length >= PHOTO_CATEGORIES.length;

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col max-w-md mx-auto border-x border-slate-100 shadow-2xl">
      <header className="bg-white p-6 border-b border-slate-200 sticky top-0 z-20 flex items-center gap-3">
        <div className="h-10 w-10 bg-black rounded-xl flex items-center justify-center text-white font-black text-xl">A</div>
        <div>
          <h1 className="text-lg font-bold leading-tight tracking-tight">Coleta de Fotos</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{inspection.placa}</p>
        </div>
      </header>

      <main className="flex-1 p-6 space-y-8 pb-32">
        <div className="bg-blue-600 rounded-3xl p-6 text-white shadow-lg shadow-blue-200">
           <h2 className="text-xl font-bold flex items-center gap-2">
             <ShieldCheck size={24} /> Vistoria Segura
           </h2>
           <p className="text-xs opacity-80 mt-2 leading-relaxed">
             Olá, <strong>{inspection.cliente}</strong>. Siga as instruções abaixo para capturar as fotos do seu veículo.
           </p>
        </div>

        <div className="grid grid-cols-1 gap-4">
           {PHOTO_CATEGORIES.map(cat => (
             <button 
              key={cat.id}
              onClick={() => handleCapture(cat.id)}
              className={`ovi-card p-4 flex items-center justify-between group transition-all ${
                photos[cat.id] ? 'border-emerald-500 bg-emerald-50/30' : 'hover:border-blue-500'
              }`}
             >
                <div className="flex items-center gap-4">
                   <div className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-colors ${
                     photos[cat.id] ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600'
                   }`}>
                      {photos[cat.id] ? <Check size={24} /> : <Camera size={24} />}
                   </div>
                    <div className="text-left">
                       <p className={`text-sm font-bold ${photos[cat.id] ? 'text-emerald-700' : 'text-slate-700'}`}>{cat.label}</p>
                       <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">
                         {photos[cat.id] ? (inspection?.photos?.some((p: any) => p.categoria === cat.label) ? 'Foto prévia mantida' : 'Foto capturada') : 'Aguardando captura'}
                       </p>
                    </div>
                </div>
                {photos[cat.id] && (
                  <div className="h-12 w-12 rounded-lg overflow-hidden border border-emerald-200">
                    <img src={photos[cat.id]} className="w-full h-full object-cover" />
                  </div>
                )}
             </button>
           ))}
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-xl border-t border-slate-100 max-w-md mx-auto z-30">
        <button 
          disabled={!allPhotosTaken || submitting}
          onClick={handleSubmit}
          className="btn-ovi-primary w-full py-5 text-sm uppercase tracking-widest shadow-xl shadow-slate-200"
        >
          {submitting ? <Loader2 className="animate-spin" /> : <>Finalizar e Enviar Vistoria <Check size={20} /></>}
        </button>
      </footer>
    </div>
  );
}
