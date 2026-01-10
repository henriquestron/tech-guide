"use client";
import { Product } from "@/types";
import { X, Check, AlertTriangle, ShoppingCart, Star, ArrowRight } from "lucide-react";
import { useEffect } from "react";
import Image from "next/image";

interface ReviewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  allProducts?: Product[]; // Lista completa (IA + Estáticos)
  onSwitchProduct?: (product: Product) => void; 
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

  // --- CORREÇÃO REAL DA LÓGICA DE RECOMENDAÇÃO ---
  const relatedProducts = allProducts
    .filter(p => {
      // 1. Normaliza as categorias (remove espaços e deixa minúsculo)
      const catA = String(p.category || "").trim().toLowerCase();
      const catB = String(product.category || "").trim().toLowerCase();
      
      // 2. Normaliza os IDs para String para garantir a comparação
      const idA = String(p.id);
      const idB = String(product.id);

      // Retorna apenas se for mesma categoria E não for o mesmo produto
      return catA === catB && idA !== idB;
    })
    .slice(0, 3); // Pega 3 sugestões

  const hasDiscount = product.originalPrice && product.originalPrice > product.price;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 transition-opacity duration-300"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-zinc-900 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col relative animate-in fade-in zoom-in duration-300"
        onClick={(e) => e.stopPropagation()} 
      >
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-950">
          <h2 className="text-xl font-bold text-zinc-800 dark:text-white truncate pr-4">
            Análise: {product.title}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition">
            <X size={24} className="text-zinc-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-zinc-400">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Esquerda: Imagem e Nota */}
            <div>
              <div className="aspect-video relative rounded-xl overflow-hidden bg-white mb-6 border border-zinc-100 flex items-center justify-center">
                <Image 
                  src={product.image} 
                  alt={product.title} 
                  fill
                  className="object-contain p-4"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800/50">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="text-yellow-500 fill-yellow-500" />
                  <span className="font-bold text-2xl text-zinc-900 dark:text-white">{product.rating?.toFixed(1) || 4.5}</span>
                </div>
                <p className="text-zinc-700 dark:text-zinc-300 text-sm italic">"{product.fullReview?.verdict || "Excelente custo-benefício."}"</p>
              </div>
            </div>

            {/* Direita: Texto */}
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="font-semibold text-green-600 flex items-center gap-2 text-sm uppercase"><Check size={16}/> Prós</h3>
                  <ul className="text-sm space-y-1 text-zinc-600 dark:text-zinc-400">
                    {product.fullReview?.pros?.map((p, i) => <li key={i}>• {p}</li>) || <li>• Ótimo desempenho</li>}
                  </ul>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-red-500 flex items-center gap-2 text-sm uppercase"><AlertTriangle size={16}/> Contras</h3>
                  <ul className="text-sm space-y-1 text-zinc-600 dark:text-zinc-400">
                    {product.fullReview?.cons?.map((c, i) => <li key={i}>• {c}</li>) || <li>• Estoque varia</li>}
                  </ul>
                </div>
              </div>
              <div className="prose prose-sm dark:prose-invert text-zinc-600 dark:text-zinc-400 leading-relaxed">
                <p>{product.fullReview?.content || product.shortDescription}</p>
              </div>
            </div>
          </div>

          {/* --- RECOMENDADOS CORRIGIDOS --- */}
          {relatedProducts.length > 0 && (
            <div className="mt-8 pt-8 border-t border-zinc-200 dark:border-zinc-800">
              <h3 className="text-lg font-bold mb-4 text-zinc-900 dark:text-white">Veja também em {product.category}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {relatedProducts.map(rel => (
                  <div 
                    key={rel.id} 
                    className="flex gap-4 p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-blue-500 transition-colors cursor-pointer bg-zinc-50 dark:bg-zinc-800/50" 
                    onClick={() => onSwitchProduct ? onSwitchProduct(rel) : onClose()}
                  >
                    <div className="w-16 h-16 relative bg-white rounded-md overflow-hidden flex-shrink-0 border border-zinc-100">
                        <Image src={rel.image} alt={rel.title} fill className="object-contain p-1" sizes="64px"/>
                    </div>
                    <div className="flex flex-col justify-center flex-1">
                      <h4 className="font-medium text-xs text-zinc-800 dark:text-white line-clamp-2">{rel.title}</h4>
                      <span className="font-bold text-xs text-zinc-900 dark:text-zinc-200 mt-1">R$ {rel.price.toLocaleString('pt-BR')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-zinc-900 dark:text-white">R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
          <a href={product.affiliateLink || product.link} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto flex-1 max-w-md bg-yellow-400 hover:bg-yellow-500 text-zinc-900 font-bold py-3 px-6 rounded-lg shadow-lg flex items-center justify-center gap-2">
            <ShoppingCart size={20} /> Comprar Agora
          </a>
        </div>
      </div>
    </div>
  );
}