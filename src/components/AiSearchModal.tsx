"use client";

import { useState } from "react";
import Link from "next/link";
import { X, Sparkles, Loader2, ArrowRight, ShoppingBag, ChevronRight } from "lucide-react";

interface AiSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface RecommendedProduct {
  id: string; // Ajustado para string conforme seu types/index.ts
  name: string;
  price: number;
  reason: string;
}

export default function AiSearchModal({ isOpen, onClose }: AiSearchModalProps) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<RecommendedProduct[]>([]);

  if (!isOpen) return null;

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setRecommendations([]);

    try {
      const response = await fetch("/api/ai-filter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: query }),
      });

      const data = await response.json();

      if (data.recommendations && data.recommendations.length > 0) {
        setRecommendations(data.recommendations);
      } else {
        // Se não encontrar nada, exibe mensagem (ou você pode redirecionar para busca genérica)
        alert("Não encontrei produtos específicos para essa descrição no nosso estoque atual.");
      }

    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao buscar recomendações.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setQuery("");
    setRecommendations([]);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Cabeçalho */}
        <div className="flex justify-between items-center p-4 border-b border-zinc-100 dark:border-zinc-800 bg-gradient-to-r from-blue-600/10 to-purple-600/10 shrink-0">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold">
            <Sparkles size={20} />
            <span>Personal Shopper IA</span>
          </div>
          <button onClick={handleClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
            <X size={20} />
          </button>
        </div>

        {/* Corpo com Scroll */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          
          {recommendations.length === 0 ? (
            <div className="space-y-4">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Diga o que você precisa e eu analiso nosso estoque em tempo real para indicar as melhores opções.
              </p>
              
              <textarea
                className="w-full h-24 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none resize-none text-zinc-800 dark:text-zinc-200"
                placeholder="Ex: Preciso de um notebook para trabalho que seja rápido e custe até 3000 reais..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSearch();
                  }
                }}
              />

              <button
                onClick={handleSearch}
                disabled={loading || !query.trim()}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Consultando Estoque...
                  </>
                ) : (
                  <>
                    Encontrar Melhores Opções <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>
          ) : (
            // Lista de Resultados
            <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-300">
              <h3 className="font-bold text-lg text-zinc-800 dark:text-white">
                Recomendações baseadas no seu pedido:
              </h3>
              
              <div className="grid gap-3">
                {recommendations.map((item) => (
                  <Link 
                    key={item.id} 
                    // IMPORTANTE: Aqui estou mandando para a página da categoria, mas se tiver página de produto use /produto/${item.id}
                    href={`/busca?q=${encodeURIComponent(item.name)}`} 
                    onClick={handleClose}
                    className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 dark:hover:border-blue-500 transition-colors group"
                  >
                    <div className="p-3 bg-white dark:bg-zinc-900 rounded-lg text-blue-600">
                      <ShoppingBag size={24} />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-zinc-900 dark:text-white group-hover:text-blue-600 transition-colors">
                          {item.name}
                        </h4>
                        <span className="font-bold text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded text-xs">
                          R$ {item.price.toFixed(2)}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 italic">
                        "{item.reason}"
                      </p>
                    </div>
                    
                    <div className="hidden sm:block text-zinc-300 group-hover:text-blue-600">
                      <ChevronRight size={20} />
                    </div>
                  </Link>
                ))}
              </div>

              <button 
                onClick={() => setRecommendations([])}
                className="w-full mt-4 py-2 text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-white underline"
              >
                Fazer nova pesquisa
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}