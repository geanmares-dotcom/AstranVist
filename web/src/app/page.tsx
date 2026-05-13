'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    // Redireciona para o dashboard ao carregar a raiz
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="h-screen w-full bg-[#f8fafc] flex items-center justify-center font-sans">
       <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Iniciando AstranVist...</p>
       </div>
    </div>
  );
}
