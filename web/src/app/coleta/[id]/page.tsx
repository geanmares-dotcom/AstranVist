'use client';

import React, { useState, useEffect } from 'react';
import { 
  Camera, 
  Check, 
  Loader2,
  CheckCircle,
  Car,
  Truck,
  Bike,
  Lightbulb,
  FileText,
  MapPin,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import api from '../../../services/api';


const PHOTO_CATEGORIES = [
  { id: 'frontal', label: 'Frontal do Veículo', desc: 'Durante a foto assegure-se que a placa, o para-choque e toda a frente do veículo estejam visíveis.', exampleImg: 'https://images.unsplash.com/photo-1542362567-b05503f3f5f4?q=80&w=800' },
  { id: 'lateral_esq', label: 'Lateral Esquerda', desc: 'Durante a foto assegure-se que toda a lateral esquerda do motorista esteja visível e enquadrada.', exampleImg: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=800' },
  { id: 'lateral_dir', label: 'Lateral Direita', desc: 'Durante a foto assegure-se que toda a lateral direita do passageiro esteja visível e enquadrada.', exampleImg: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?q=80&w=800' },
  { id: 'traseira', label: 'Traseira', desc: 'Durante a foto assegure-se que a placa traseira e as lanternas estejam nítidas e visíveis.', exampleImg: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?q=80&w=800' },
  { id: 'painel', label: 'Painel / Hodômetro', desc: 'Com o veículo ligado, tire uma foto clara do painel mostrando a quilometragem.', exampleImg: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=800' },
  { id: 'chassi', label: 'Número do Chassi', desc: 'Limpe o local e tire uma foto nítida e legível da numeração do chassi.', exampleImg: 'https://images.unsplash.com/photo-1517524206127-48bbd363f3d7?q=80&w=800' }
];

export default function PublicColetaPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [inspection, setInspection] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [photos, setPhotos] = useState<Record<string, string>>({});
  const [finished, setFinished] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

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
        latitude: userLocation?.lat || -23.5505,
        longitude: userLocation?.lng || -46.6333
      }));

      // Endpoint público sem necessidade de token
      await api.post(`/inspections/${id}/photos`, { photos: photoData });
      setFinished(true);
    } catch (err) {
      toast.error('Erro ao enviar as fotos. Tente novamente.');
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

  if (!onboardingComplete) {
    const isMoto = inspection.tipoVeiculo === 'MOTO';
    const isCaminhao = inspection.tipoVeiculo === 'CAMINHAO';
    
    if (onboardingStep === 0) {
      return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col max-w-md mx-auto items-center p-8 text-center relative overflow-hidden shadow-2xl border-x border-slate-100">
          {/* Decorative Blob */}
          <div className="absolute top-[-10%] left-[-20%] w-96 h-96 bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70"></div>
          <div className="absolute top-[20%] right-[-20%] w-72 h-72 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70"></div>
          
          <div className="relative z-10 flex flex-col items-center w-full h-full min-h-[90vh] justify-between">
            <div className="space-y-6 flex flex-col items-center mt-10">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-black rounded-lg flex items-center justify-center text-white font-black text-sm">A</div>
                <span className="text-xs font-black tracking-widest uppercase">STRSAT</span>
              </div>
              
              <div className="space-y-2">
                <h1 className="text-2xl font-black text-slate-900">Olá, {inspection.cliente?.split(' ')[0]}!</h1>
                <h2 className="text-xl font-bold text-slate-700">Que bom ter você aqui!</h2>
              </div>
              
              <p className="text-sm font-medium text-slate-500 leading-relaxed max-w-[280px]">
                Nossa missão é ajudar você a fazer esta vistoria de forma segura, simples e eficiente. Confira os dados do veículo e clique em "Iniciar vistoria".
              </p>
            </div>

            <div className="my-10 w-full flex flex-col items-center relative">
              <div className="w-64 h-40 flex items-center justify-center relative mb-8">
                {/* Abstract Shape Background */}
                <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 w-full h-full text-slate-200/60 drop-shadow-sm">
                  <path fill="currentColor" d="M44.7,-76.4C58.8,-69.2,71.8,-59.1,81.1,-46.3C90.4,-33.5,96,-18.1,96.6,-2.4C97.1,13.2,92.5,29.1,82.8,42.1C73.2,55.1,58.4,65.3,42.8,71.7C27.2,78.1,10.7,80.7,-4.8,80.2C-20.4,79.7,-35.1,76.2,-48.1,68.8C-61.1,61.4,-72.5,50.1,-80.1,36.4C-87.7,22.7,-91.6,6.6,-88.9,-8.5C-86.2,-23.5,-76.8,-37.6,-64.8,-48.1C-52.8,-58.5,-38.1,-65.4,-23.9,-70.7C-9.7,-76,5,-79.8,19.3,-78.9C33.6,-77.9,44.7,-76.4,44.7,-76.4Z" transform="translate(100 100)" />
                </svg>
                {isMoto ? <Bike size={80} className="text-slate-800 relative z-10" strokeWidth={1.5} /> : (isCaminhao ? <Truck size={80} className="text-slate-800 relative z-10" strokeWidth={1.5} /> : <Car size={80} className="text-slate-800 relative z-10" strokeWidth={1.5} />)}
              </div>
              
              <div className="space-y-1">
                <p className="text-base font-black text-slate-800 uppercase tracking-wide">{inspection.modelo || 'VEÍCULO'}</p>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">{inspection.placa} {inspection.chassi ? `/ ${inspection.chassi}` : ''}</p>
              </div>
            </div>

            <div className="w-full space-y-6 mt-auto">
              <p className="text-[10px] text-slate-400 font-medium px-4">
                Ao clicar em "Iniciar vistoria", você concorda com nossa <a href="#" className="underline hover:text-slate-600">Política de privacidade</a> e <a href="#" className="underline hover:text-slate-600">Termos de uso</a>.
              </p>
              
              <button 
                onClick={() => setOnboardingStep(1)}
                className="w-full bg-slate-900 hover:bg-black text-white py-5 rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl shadow-slate-900/20 transition-all active:scale-95"
              >
                Iniciar Vistoria
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (onboardingStep === 4) {
      const handleLocationRequest = () => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
              toast.success('Localização capturada com sucesso!');
              setOnboardingComplete(true);
            },
            (error) => {
              toast.error('Acesso à localização negado. Prossiga sem localização.');
            }
          );
        } else {
          toast.error('Seu dispositivo não suporta GPS.');
        }
      };

      return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col max-w-md mx-auto relative overflow-hidden shadow-2xl border-x border-slate-100">
          <div className="bg-[#111827] text-white p-5 font-bold tracking-wide">
            Localização
          </div>
          
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center pt-12 pb-10">
            <h2 className="text-xl font-bold text-slate-800 px-4 leading-snug">
              Precisamos da sua localização
            </h2>
            <p className="text-sm text-slate-500 font-medium px-4 mt-3 leading-relaxed">
              Utilizamos esse recurso para prevenir eventuais fraudes e trazer mais segurança ao processo de vistoria digital
            </p>

            <div className="relative w-64 h-64 flex items-center justify-center my-10">
               <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 w-full h-full text-slate-400 opacity-60 drop-shadow-sm scale-110">
                  <path fill="currentColor" d="M37.5,-59.6C48,-50.2,55.5,-38,62.8,-24.5C70.1,-11.1,77.3,3.7,75.4,17.4C73.5,31,62.5,43.5,50.1,51.8C37.6,60.1,23.8,64.2,9.6,66.9C-4.5,69.5,-17.1,70.7,-30.2,66.5C-43.2,62.2,-56.8,52.5,-64.1,40C-71.3,27.5,-72.3,12.2,-68.9,-1.8C-65.5,-15.8,-57.8,-28.5,-48.1,-38.7C-38.3,-48.8,-26.6,-56.5,-13.8,-60.9C-1.1,-65.3,12.7,-66.4,25.6,-64.2C38.6,-62.1,50.6,-57.6,37.5,-59.6Z" transform="translate(100 100)" />
               </svg>
               <MapPin size={100} className="text-[#111827] relative z-10" fill="#111827" stroke="#f8fafc" strokeWidth={1} />
            </div>

            <div className="w-full space-y-4 mt-auto">
              <button 
                onClick={handleLocationRequest}
                className="w-full bg-[#111827] hover:bg-black text-white py-4 rounded-2xl text-sm font-bold shadow-xl transition-all active:scale-95"
              >
                Compartilhar minha localização
              </button>

              <button 
                onClick={() => setOnboardingComplete(true)}
                className="w-full bg-transparent border-2 border-[#111827] text-[#111827] hover:bg-slate-100 py-4 rounded-2xl text-sm font-bold transition-all active:scale-95"
              >
                Continuar sem compartilhar
              </button>
            </div>

            <button className="mt-8 text-blue-600 flex items-center gap-2 text-xs font-medium hover:underline">
              <AlertCircle size={14} />
              Por que preciso ativar minha localização?
            </button>
          </div>
        </div>
      );
    }

    const tips = [
      {
        icon: <Lightbulb size={80} className="text-amber-500 relative z-10" strokeWidth={1.5} />,
        bg: "bg-amber-100",
        text: `Primeiro, estacione ${isMoto ? 'a moto' : (isCaminhao ? 'o caminhão' : 'o veículo')} em um local com boa iluminação.`
      },
      {
        icon: <FileText size={80} className="text-blue-600 relative z-10" strokeWidth={1.5} />,
        bg: "bg-blue-100",
        text: "Esteja com o documento CRLV (impresso ou digital) de fácil acesso."
      },
      {
        icon: <MapPin size={80} className="text-emerald-600 relative z-10" strokeWidth={1.5} />,
        bg: "bg-emerald-100",
        text: "Para poder fazer a vistoria de forma completa, é necessário ativar a localização do seu celular."
      }
    ];

    const currentTip = tips[onboardingStep - 1];

    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col max-w-md mx-auto relative overflow-hidden shadow-2xl border-x border-slate-100">
        {/* Header Escuro (Dicas) */}
        <div className="bg-[#111827] text-white p-5 font-bold tracking-wide">
          Dicas
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-between p-8 text-center pt-12 pb-10">
          <h2 className="text-xl font-medium text-slate-800 px-4 leading-snug">
            Antes de iniciar a vistoria, atente-se às instruções
          </h2>

          <div className="relative w-64 h-64 flex items-center justify-center my-10">
             {/* Dynamic background shape for the tip */}
             <div className={`absolute inset-0 ${currentTip.bg} rounded-full mix-blend-multiply filter blur-3xl opacity-50`}></div>
             {currentTip.icon}
          </div>

          <p className="text-base text-slate-600 font-medium px-4 mb-12">
            {currentTip.text}
          </p>

          <div className="w-full space-y-8 mt-auto">
            {/* Dots */}
            <div className="flex justify-center gap-3">
              {[1, 2, 3].map((stepIndex) => (
                <div 
                  key={stepIndex} 
                  className={`h-2.5 w-2.5 rounded-full transition-colors duration-300 ${onboardingStep === stepIndex ? 'bg-[#111827]' : 'bg-slate-300'}`}
                />
              ))}
            </div>
            
            <button 
              onClick={() => {
                if (onboardingStep === 3) {
                  setOnboardingStep(4);
                } else {
                  setOnboardingStep(prev => prev + 1);
                }
              }}
              className="w-full bg-[#111827] hover:bg-black text-white py-5 rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl transition-all active:scale-95"
            >
              Próximo
            </button>
          </div>
        </div>
      </div>
    );
  }

  const photosTakenCount = Object.keys(photos).length;
  const totalPhotos = PHOTO_CATEGORIES.length;
  const progressPercent = Math.round((photosTakenCount / totalPhotos) * 100);
  const allPhotosTaken = photosTakenCount >= totalPhotos;

  const currentCat = PHOTO_CATEGORIES[currentPhotoIndex];
  const hasPhoto = !!photos[currentCat.id];

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col max-w-md mx-auto shadow-2xl relative overflow-hidden">
      {/* Top Dark Bar */}
      <div className="bg-[#111827] w-full h-12 flex items-center px-4">
         {currentPhotoIndex > 0 && (
           <button onClick={() => setCurrentPhotoIndex(p => p - 1)} className="text-white hover:text-slate-300">
             {'< Voltar'}
           </button>
         )}
      </div>

      <main className="flex-1 flex flex-col items-center p-6 space-y-6 pb-48">
        <h1 className="text-xl font-medium text-slate-800 text-center tracking-wide mt-2">
           {currentCat.label}
        </h1>

        <div className="w-full aspect-square bg-white rounded-3xl p-2 shadow-sm border border-slate-100 flex items-center justify-center overflow-hidden">
           <img 
             src={hasPhoto ? photos[currentCat.id] : currentCat.exampleImg} 
             alt="Exemplo de Vistoria" 
             className={`w-full h-full object-cover rounded-2xl transition-all ${hasPhoto ? 'opacity-100' : 'opacity-80 mix-blend-multiply'}`}
           />
        </div>

        <p className="text-sm font-medium text-slate-600 text-center leading-relaxed px-2">
           {currentCat.desc}
        </p>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 p-6 bg-[#f8fafc]/90 backdrop-blur-md max-w-md mx-auto z-30 space-y-3 pb-safe">
        {!hasPhoto ? (
          <>
            <button 
              onClick={() => handleCapture(currentCat.id)}
              className="w-full bg-[#111827] hover:bg-black text-white py-4 rounded-full text-sm font-bold shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Camera size={18} /> Tirar foto
            </button>
            <button 
              className="w-full bg-transparent border-2 border-[#111827] text-[#111827] hover:bg-slate-100 py-4 rounded-full text-sm font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='%23111827' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'%3E%3C/rect%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'%3E%3C/circle%3E%3Cpolyline points='21 15 16 10 5 21'%3E%3C/polyline%3E%3C/svg%3E" alt="Imagem" /> 
              Ver exemplo
            </button>
          </>
        ) : (
          <>
            {currentPhotoIndex < totalPhotos - 1 ? (
              <button 
                onClick={() => setCurrentPhotoIndex(p => p + 1)}
                className="w-full bg-[#111827] hover:bg-black text-white py-4 rounded-full text-sm font-bold shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                Próxima Foto <Check size={18} />
              </button>
            ) : (
              <button 
                disabled={submitting}
                onClick={handleSubmit}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-4 rounded-full text-sm font-bold shadow-xl shadow-emerald-200 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="animate-spin" /> : <>Enviar Vistoria Segura <CheckCircle size={18} /></>}
              </button>
            )}
            <button 
              onClick={() => handleCapture(currentCat.id)}
              className="w-full bg-transparent border-2 border-[#111827] text-[#111827] hover:bg-slate-100 py-4 rounded-full text-sm font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Camera size={18} /> Refazer foto
            </button>
          </>
        )}
      </footer>
    </div>
  );
}
