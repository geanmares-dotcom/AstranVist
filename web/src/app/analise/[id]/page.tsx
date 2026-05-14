'use client';

import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  Download, 
  CheckCircle, 
  XCircle, 
  ArrowLeftRight,
  ShieldAlert,
  Camera,
  Check,
  Info,
  FileText
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { inspectionService } from '../../../services/inspectionService';
import { queueService } from '../../../services/queueService';
import api from '../../../services/api';
import Sidebar from '../../../components/Sidebar';

export default function DetalheAnalisePage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [loadingAction, setLoadingAction] = useState(false);

  // Assume a vistoria ao carregar a página
  useEffect(() => {
    if (id) {
      queueService.assign(id).catch(err => {
         const message = err.response?.data?.message || 'Esta vistoria já está sendo analisada.';
         alert(message);
         router.push('/analise');
      });
    }
  }, [id, router]);


  const { data: inspection, isLoading } = useQuery({
    queryKey: ['inspection', id],
    queryFn: () => inspectionService.getById(id),
  });

  const handleFinish = async (status: string) => {
    setLoadingAction(true);
    try {
      await queueService.finish(id, status, comment, status === 'NOVA_COLETA' ? selectedPhotos : []);
      router.push('/analise');
    } catch (err) {
      alert('Erro ao finalizar análise');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleRelease = async () => {
    setLoadingAction(true);
    try {
      await queueService.release(id);
      router.push('/analise');
    } catch (err) {
      alert('Erro ao devolver vistoria para a mesa');
    } finally {
      setLoadingAction(false);
    }
  };




  const togglePhotoSelection = (photoId: string) => {
    setSelectedPhotos(prev => 
      prev.includes(photoId) 
        ? prev.filter(p => p !== photoId) 
        : [...prev, photoId]
    );
  };

  if (isLoading) return (
    <div className="flex h-screen items-center justify-center bg-[var(--bg-main)]">
       <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 dark:text-slate-500 font-bold animate-pulse uppercase tracking-widest text-[10px]">Carregando Evidências...</p>
       </div>
    </div>
  );

  if (!inspection) return <div>Vistoria não encontrada</div>;

  return (
    <div className="flex h-screen bg-[var(--bg-main)] text-slate-800 dark:text-slate-200 overflow-hidden font-sans">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header de Ações */}
        <header className="h-20 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800 px-8 flex items-center justify-between shrink-0 relative z-30">
          <div className="flex items-center gap-4">
             <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
                <ChevronLeft size={24} />
             </button>
             <div>
                <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Galeria de Evidências</h1>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1">Protocolo: {inspection.protocol}</p>
             </div>
          </div>

          <div className="flex items-center gap-3">
             <div className="hidden lg:flex flex-col items-end mr-4">
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Status Atual</span>
                <span className="text-sm font-bold text-orange-600">Em Análise Técnica</span>
             </div>
             <button 
               onClick={handleRelease}
               disabled={loadingAction}
               className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 px-5 py-2.5 rounded-xl font-bold text-xs transition-all uppercase tracking-widest disabled:opacity-50"
             >
                <ArrowLeftRight size={16} /> Devolver
             </button>
             <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs transition-all uppercase tracking-widest shadow-lg shadow-indigo-100 dark:shadow-none">
                <Download size={16} /> Fotos
             </button>
             <button 
               onClick={() => window.open(`${api.defaults.baseURL}/reports/inspection/${id}`, '_blank')}
               className="flex items-center gap-2 bg-slate-900 dark:bg-black hover:bg-slate-800 dark:hover:bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold text-xs transition-all uppercase tracking-widest shadow-lg shadow-slate-200 dark:shadow-none"
             >
                <FileText size={16} className="text-emerald-400" /> Laudo PDF
             </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-transparent">
          
          {/* Seção de Dados Técnicos (Estilo OVI) */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 max-w-[1400px] mx-auto">
             {/* Card 1: Dados do Veículo */}
             <div className="bg-[var(--bg-card)] rounded-2xl shadow-sm border border-[var(--border-color)] overflow-hidden">
                <div className="bg-slate-900 dark:bg-black px-6 py-4 flex items-center justify-between">
                   <h3 className="text-white font-bold text-sm uppercase tracking-widest">Dados do veículo</h3>
                   <Info size={16} className="text-white/40" />
                </div>
                <div className="p-6 grid grid-cols-2 gap-y-6 gap-x-8">
                   <DataField label="Placa" value={inspection.placa} verified />
                   <DataField label="Chassi" value={inspection.chassi} verified />
                   <DataField label="Município" value={inspection.municipio || 'NÃO CONSTAM DADOS'} />
                   <DataField label="UF" value={inspection.uf || 'SP'} />
                   <DataField label="Emplacado em" value="NÃO CONSTAM DADOS" />
                   <DataField label="Combustível" value={inspection.combustivel || 'Álcool / Gasolina'} />
                   <DataField label="Marca/ Modelo" value={`${inspection.marca || ''} ${inspection.modelo || ''}`} />
                   <DataField label="Cor" value={inspection.cor || 'NÃO CONSTAM DADOS'} />
                   <DataField label="Ano do Modelo" value={inspection.ano || 'NÃO CONSTAM DADOS'} />
                   <DataField label="Ano de Fabricação" value={inspection.anoFabricacao || 'NÃO CONSTAM DADOS'} />
                   <DataField label="Tipo do Veículo" value={inspection.tipoVeiculo || 'NÃO CONSTAM DADOS'} />
                   <DataField label="Renavam" value={inspection.renavam || '0'} />
                </div>
                <div className="px-6 pb-6 pt-2">
                   <p className="text-[10px] text-slate-400 dark:text-slate-500 italic">
                      *Os dados da <span className="font-bold">placa</span> e do <span className="font-bold">chassi</span> foram validados com base nas informações do CRLV enviado pelo cliente.
                   </p>
                </div>
             </div>

             {/* Card 2: Informações Adicionais */}
             <div className="bg-[var(--bg-card)] rounded-2xl shadow-sm border border-[var(--border-color)] overflow-hidden">
                <div className="bg-slate-900 dark:bg-black px-6 py-4">
                   <h3 className="text-white font-bold text-sm uppercase tracking-widest">Informações Adicionais</h3>
                </div>
                <div className="p-6 grid grid-cols-2 gap-y-6 gap-x-8">
                   <DataField label="Motor" value={inspection.motor || 'MUJAG8585338'} />
                   <DataField label="Caixa de Câmbio" value={inspection.caixaCambio || 'NÃO CONSTAM DADOS'} />
                   <DataField label="Capacidade Passageiros" value={inspection.passagCap || '5'} />
                   <DataField label="Potência" value={inspection.potencia || '131'} />
                   <DataField label="Quantidade de Eixos" value={inspection.qtdEixos || '2'} />
                   <DataField label="Capacidade de Carga" value={inspection.cargaCap || 'NÃO CONSTAM DADOS'} />
                   <DataField label="CMT" value={inspection.cmt || '209'} />
                   <DataField label="PBT" value={inspection.pbt || '169'} />
                   <DataField label="Carroceria" value={inspection.carroceria || 'NÃO CONSTAM DADOS'} />
                   <DataField label="Número Traseiro Dif" value={inspection.numTrasDif || 'NÃO CONSTAM DADOS'} />
                </div>
             </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8 max-w-[1400px] mx-auto">
             {/* Galeria de Fotos */}
             <div className="flex-1 space-y-6">
                <div className="flex items-center justify-between">
                   <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                      <Camera className="text-indigo-600" /> Capturas de Evidências
                   </h2>
                   <span className="bg-[var(--bg-card)] px-4 py-1.5 rounded-full border border-[var(--border-color)] text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                      {inspection.photos.length} Fotos Registradas
                   </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {inspection.photos.map((photo: any) => {
                    const isSelected = selectedPhotos.includes(photo.id);
                    return (
                      <div 
                        key={photo.id}
                        onClick={() => togglePhotoSelection(photo.id)}
                        className={`ovi-card cursor-pointer group relative overflow-hidden transition-all duration-300 border-2 ${
                          isSelected ? 'border-indigo-600 ring-4 ring-indigo-600/10' : 'border-transparent'
                        }`}
                      >
                        <div className="aspect-[4/3] relative">
                           <img src={photo.url} alt={photo.categoria} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                           
                           {/* Checkbox Overlay */}
                           <div className={`absolute top-4 left-4 h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all ${
                             isSelected ? 'bg-indigo-600 border-indigo-600 shadow-lg scale-110' : 'bg-black/20 border-white/40 backdrop-blur-sm'
                           }`}>
                              {isSelected && <Check size={14} className="text-white stroke-[4px]" />}
                           </div>

                           {/* Selection Overlay */}
                           {isSelected && <div className="absolute inset-0 bg-indigo-600/5 backdrop-brightness-110" />}

                           <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-60" />
                           
                           <div className="absolute bottom-4 left-4 right-4">
                              <span className="text-[10px] font-black text-white/70 uppercase tracking-widest">Categoria</span>
                              <h4 className="text-white font-bold text-sm">{photo.categoria}</h4>
                           </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

             </div>

             {/* Sidebar de Conclusão */}
             <div className="w-full lg:w-96 shrink-0">
                <div className="bg-[var(--bg-card)] p-8 rounded-2xl shadow-xl border-2 border-[var(--border-color)] sticky top-8 space-y-8">
                   <div className="space-y-2">
                      <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Parecer Técnico</h3>
                      <p className="text-xs text-slate-400 dark:text-slate-500 font-medium italic">Insira observações relevantes para o laudo final.</p>
                   </div>

                   <textarea 
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full rounded-[1.5rem] min-h-[180px] resize-none text-sm p-5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600"

                    placeholder="Descreva aqui os detalhes da análise..."
                   />


                   <div className="space-y-2">
                      <button 
                        disabled={loadingAction}
                        onClick={() => handleFinish('FINALIZADO')}
                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black py-3.5 rounded-xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-emerald-100 dark:shadow-none uppercase text-[11px] tracking-widest disabled:opacity-50"
                      >
                         <CheckCircle size={18} /> Aprovar Vistoria
                      </button>

                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          disabled={loadingAction}
                          onClick={() => handleFinish('APROVADO_COM_RESSALVA')}
                          className="bg-slate-900 dark:bg-black hover:bg-slate-800 dark:hover:bg-slate-950 text-white font-black py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 uppercase text-[9px] tracking-widest disabled:opacity-50"
                        >
                           <ShieldAlert size={14} className="text-orange-400" /> Ressalva
                        </button>

                        <button 
                          disabled={loadingAction}
                          onClick={() => handleFinish('REPROVADO')}
                          className="bg-[var(--bg-card)] border border-rose-200 dark:border-rose-900/30 hover:border-rose-500 text-rose-500 font-black py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 uppercase text-[9px] tracking-widest disabled:opacity-50"
                        >
                           <XCircle size={14} /> Reprovar
                        </button>
                      </div>
                   </div>

                   {selectedPhotos.length > 0 && (
                      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-bottom-2">
                         <button 
                          disabled={loadingAction}
                          onClick={() => handleFinish('NOVA_COLETA')}
                          className="w-full bg-indigo-600 text-white font-black py-3.5 rounded-xl flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all uppercase text-[10px] tracking-widest shadow-lg shadow-indigo-100 dark:shadow-none"
                         >
                            Solicitar Nova Coleta ({selectedPhotos.length})
                         </button>
                      </div>
                   )}


                </div>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function DataField({ label, value, verified = false }: { label: string, value: any, verified?: boolean }) {
  return (
    <div className="space-y-1">
       <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-slate-900 dark:text-white tracking-tight">{label}</span>
          {verified && <Check size={12} className="text-emerald-500 stroke-[4px]" />}
       </div>
       <div className="text-[12px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-tight">
          {value || 'NÃO CONSTAM DADOS'}
       </div>
    </div>
  );
}

