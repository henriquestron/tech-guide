"use client";

import { X, Check, AlertTriangle, ShoppingCart, Star, Sparkles } from "lucide-react";
import { useEffect } from "react";
import Image from "next/image";

interface ReviewModalProps {
  product: any;
  isOpen: boolean;
  onClose: () => void;
  allProducts?: any[]; 
  onSwitchProduct?: (product: any) => void; 
}

export default function ReviewModal({ 
  product, 
  isOpen, 
  onClose, 
  onSwitchProduct,
  allProducts = [] 
}: ReviewModalProps) {
  
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "auto";
    return () => { document.body.style.overflow = "auto"; };
  }, [isOpen]);

  if (!isOpen || !product) return null;

  // Lógica de Recomendação (Mantida a sua)
  const relatedProducts = allProducts
    .filter(p => {
      const catA = String(p.category || "").trim().toLowerCase();
      const catB = String(product.category || "").trim().toLowerCase();
      const idA = String(p.id);
      const idB = String(product.id);
      return catA === catB && idA !== idB;
    })
    .slice(0, 3);

  // Normalização dos dados da IA
  // O Supabase retorna full_review, mas seu código antigo esperava fullReview.
  // Aqui normalizamos para funcionar com ambos.
  const rawReview = product.full_review || product.fullReview || {};
  
  const review = {
    verdict: rawReview.verdict || "Excelente custo-benefício.",
    pros: rawReview.pros || ["Ótimo desempenho"],
    cons: rawReview.cons || ["Estoque varia"],
    content: rawReview.content || product.short_description || product.shortDescription || "Sem análise detalhada."
  };

  const rating = product.rating || 4.5;
  const link = product.link || product.affiliateLink || "#";

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-zinc-900 border border-zinc-800 w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()} 
      >
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
          <h2 className="text-lg font-bold text-white truncate pr-4 flex items-center gap-2">
            <Sparkles size={18} className="text-purple-400" />
            Análise Inteligente
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full transition text-zinc-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <div className="grid md:grid-cols-2 gap-8">
            
            {/* Esquerda: Foto e Nota */}
            <div>
              <div className="aspect-video relative rounded-2xl overflow-hidden bg-white mb-6 border border-zinc-800 flex items-center justify-center">
                {product.image ? (
                    <img 
                    src={product.image} 
                    alt={product.title} 
                    className="w-full h-full object-contain p-4"
                    />
                ) : (
                    <span className="text-4xl">📦</span>
                )}
              </div>
              
              <div className="bg-zinc-950 p-5 rounded-2xl border border-zinc-800">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex text-yellow-500">
                     {[1,2,3,4,5].map(s => <Star key={s} size={18} fill={s <= rating ? "currentColor" : "none"} className={s > rating ? "text-zinc-700" : ""} />)}
                  </div>
                  <span className="font-bold text-2xl text-white ml-auto">{rating.toFixed(1)}</span>
                </div>
                <p className="text-zinc-300 text-sm italic border-l-2 border-purple-500 pl-3">
                  "{review.verdict}"
                </p>
              </div>
            </div>

            {/* Direita: Detalhes */}
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-white leading-tight">{product.title}</h1>
                
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <h3 className="font-bold text-green-400 flex items-center gap-2 text-xs uppercase tracking-wider"><Check size={14}/> Prós</h3>
                        <ul className="space-y-2">
                            {review.pros.map((p: string, i: number) => (
                                <li key={i} className="text-sm text-zinc-300 flex items-start gap-2">
                                    <span className="w-1 h-1 bg-green-500 rounded-full mt-2 shrink-0"></span>{p}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="space-y-2">
                        <h3 className="font-bold text-red-400 flex items-center gap-2 text-xs uppercase tracking-wider"><AlertTriangle size={14}/> Contras</h3>
                        <ul className="space-y-2">
                            {review.cons.map((c: string, i: number) => (
                                <li key={i} className="text-sm text-zinc-300 flex items-start gap-2">
                                    <span className="w-1 h-1 bg-red-500 rounded-full mt-2 shrink-0"></span>{c}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="bg-zinc-800/50 p-4 rounded-xl border border-zinc-700/50">
                    <p className="text-sm text-zinc-300 leading-relaxed">{review.content}</p>
                </div>

                <a 
                    href={link} 
                    target="_blank" 
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/20"
                >
                    <ShoppingCart size={20} /> Ver Oferta Atual
                </a>
            </div>
          </div>

          {/* Recomendados */}
          {relatedProducts.length > 0 && (
            <div className="mt-10 pt-8 border-t border-zinc-800">
              <h3 className="text-sm font-bold uppercase text-zinc-500 mb-4 tracking-wider">Similares</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {relatedProducts.map(rel => (
                  <div 
                    key={rel.id} 
                    className="flex gap-3 p-3 rounded-xl border border-zinc-800 hover:border-blue-600 transition-colors cursor-pointer bg-zinc-950" 
                    onClick={() => onSwitchProduct ? onSwitchProduct(rel) : onClose()}
                  >
                    <div className="w-14 h-14 bg-white rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                        {rel.image && <img src={rel.image} className="max-w-full max-h-full p-1" />}
                    </div>
                    <div className="flex flex-col justify-center min-w-0">
                      <h4 className="font-medium text-xs text-zinc-200 line-clamp-2">{rel.title}</h4>
                      <span className="font-bold text-xs text-blue-400 mt-1">R$ {Number(rel.price).toLocaleString('pt-BR')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}