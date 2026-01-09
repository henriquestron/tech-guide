"use client";
import { Product } from "@/types";
import { X, Check, AlertTriangle, ShoppingCart, Star, ArrowRight } from "lucide-react";
import { useEffect } from "react";
import Image from "next/image";
import { products } from "@/data/products"; // Importamos para buscar os relacionados

interface ReviewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  // Opcional: Se quiser que ao clicar no relacionado ele abra direto no modal
  onSwitchProduct?: (product: Product) => void; 
}

export default function ReviewModal({ product, isOpen, onClose, onSwitchProduct }: ReviewModalProps) {
  
  // Bloquear scroll do body quando modal abre
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "auto";
    return () => { document.body.style.overflow = "auto"; };
  }, [isOpen]);

  if (!isOpen || !product) return null;

  // Lógica dos Produtos Relacionados
  // Filtra produtos da mesma categoria, excluindo o atual, e pega os 2 primeiros
  const relatedProducts = products
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 2);

  // Lógica de Desconto para o Modal
  const hasDiscount = product.originalPrice && product.originalPrice > product.price;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 transition-opacity duration-300"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-zinc-900 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col relative animate-in fade-in zoom-in duration-300"
        onClick={(e) => e.stopPropagation()} // Impede fechar ao clicar dentro
      >
        {/* Header do Modal */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-950">
          <h2 className="text-xl font-bold text-zinc-800 dark:text-white truncate pr-4">
            Análise: {product.title}
          </h2>
          <button 
            id="modal-close-btn"
            onClick={onClose} 
            className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition"
          >
            <X size={24} className="text-zinc-500" />
          </button>
        </div>

        {/* Conteúdo com Scroll */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-zinc-400">
          <div className="grid md:grid-cols-2 gap-8">
            
            {/* --- Coluna Visual (Esquerda) --- */}
            <div>
              <div className="aspect-video relative rounded-xl overflow-hidden bg-white mb-6 border border-zinc-100 flex items-center justify-center">
                <Image 
                  src={product.image} 
                  alt={`Review de ${product.title}`} 
                  fill
                  className="object-contain p-4"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority // Carrega com prioridade pois é a imagem principal do modal
                />
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800/50">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="text-yellow-500 fill-yellow-500" />
                  <span className="font-bold text-2xl text-zinc-900 dark:text-white">{product.rating.toFixed(1)}</span>
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">Veredito TechGuide</span>
                </div>
                <p className="text-zinc-700 dark:text-zinc-300 text-sm italic">"{product.fullReview.verdict}"</p>
              </div>
            </div>

            {/* --- Coluna Texto (Direita) --- */}
            <div className="space-y-6">
              {/* Prós e Contras */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="font-semibold text-green-600 flex items-center gap-2 text-sm uppercase tracking-wide">
                    <Check size={16}/> Prós
                  </h3>
                  <ul className="text-sm space-y-1 text-zinc-600 dark:text-zinc-400">
                    {product.fullReview.pros.map((p, i) => <li key={i}>• {p}</li>)}
                  </ul>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-red-500 flex items-center gap-2 text-sm uppercase tracking-wide">
                    <AlertTriangle size={16}/> Contras
                  </h3>
                  <ul className="text-sm space-y-1 text-zinc-600 dark:text-zinc-400">
                    {product.fullReview.cons.map((c, i) => <li key={i}>• {c}</li>)}
                  </ul>
                </div>
              </div>

              {/* Especificações Técnicas */}
              <div>
                <h3 className="font-bold text-lg mb-3 text-zinc-900 dark:text-white">Especificações</h3>
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  {Object.entries(product.fullReview.specs).map(([key, val]) => (
                    <div key={key} className="border-b border-zinc-100 dark:border-zinc-800 pb-1">
                      <span className="font-medium text-zinc-500 block">{key}</span>
                      <span className="text-zinc-800 dark:text-zinc-200">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Texto Completo da Review */}
              <div className="prose prose-sm dark:prose-invert text-zinc-600 dark:text-zinc-400 leading-relaxed">
                <p>{product.fullReview.content}</p>
              </div>
            </div>
          </div>

          {/* --- Seção Veja Também (Produtos Relacionados) --- */}
          {relatedProducts.length > 0 && (
            <div className="mt-8 pt-8 border-t border-zinc-200 dark:border-zinc-800">
              <h3 className="text-lg font-bold mb-4 text-zinc-900 dark:text-white flex items-center gap-2">
                Veja também na categoria <span className="text-blue-600 capitalize">{product.category}</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {relatedProducts.map(rel => (
                  <div 
                    key={rel.id} 
                    className="flex gap-4 p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors cursor-pointer group bg-zinc-50 dark:bg-zinc-800/50" 
                    onClick={() => {
                      if (onSwitchProduct) {
                        onSwitchProduct(rel);
                      } else {
                        // Comportamento padrão: Fechar atual para o usuário poder clicar no outro
                        onClose();
                        // O ideal aqui é passar a prop onSwitchProduct nas páginas pais
                      }
                    }}
                  >
                    <div className="w-16 h-16 relative bg-white rounded-md overflow-hidden flex-shrink-0 border border-zinc-100">
                        <Image 
                          src={rel.image} 
                          alt={rel.title} 
                          fill 
                          className="object-contain p-1"
                          sizes="64px"
                        />
                    </div>
                    <div className="flex flex-col justify-center">
                      <h4 className="font-medium text-sm text-zinc-800 dark:text-white line-clamp-1 group-hover:text-blue-600 transition-colors">
                        {rel.title}
                      </h4>
                      <div className="flex items-center gap-2 text-xs mt-1">
                         <span className="font-bold text-zinc-900 dark:text-zinc-200">
                           R$ {rel.price.toLocaleString('pt-BR')}
                         </span>
                         <span className="text-yellow-500 flex items-center gap-0.5">
                            <Star size={10} className="fill-yellow-500"/> {rel.rating}
                         </span>
                      </div>
                    </div>
                    <div className="ml-auto flex items-center text-zinc-400 group-hover:text-blue-600">
                        <ArrowRight size={16} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Fixo (Call to Action) */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            {hasDiscount && (
                <span className="text-xs text-zinc-500 line-through block">
                    De: R$ {product.originalPrice?.toLocaleString('pt-BR')}
                </span>
            )}
            <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-zinc-900 dark:text-white">
                R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-xs text-green-600 font-medium bg-green-100 dark:bg-green-900 px-2 py-0.5 rounded">
                    Melhor preço hoje
                </span>
            </div>
          </div>
          
          <a 
            href={product.affiliateLink} 
            target="_blank" 
            rel="noopener noreferrer nofollow"
            className="w-full sm:w-auto flex-1 max-w-md bg-yellow-400 hover:bg-yellow-500 text-zinc-900 font-bold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 transform active:scale-95"
          >
            <ShoppingCart size={20} />
            Comprar Agora
          </a>
        </div>
      </div>
    </div>
  );
}