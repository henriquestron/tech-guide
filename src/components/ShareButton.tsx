'use client';

import { Share2 } from "lucide-react";

export default function ShareButton({ title }: { title: string }) {
  const handleShare = () => {
    // Pega a URL atual do navegador
    const url = window.location.href;
    
    if (navigator.share) {
      // Compartilhamento nativo (Celular)
      navigator.share({ title: "Oferta Tech Guide", text: title, url: url }).catch(console.error);
    } else {
      // Copiar link (PC)
      navigator.clipboard.writeText(url);
      alert("Link copiado para a área de transferência!");
    }
  };

  return (
    <button 
      onClick={handleShare}
      className="px-6 py-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2"
    >
      <Share2 size={20}/> Compartilhar
    </button>
  );
}