"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X, Sparkles, Loader2, ArrowRight, ShoppingBag, ChevronRight, Bot } from "lucide-react";

interface AiSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface RecommendedProduct {
  id: string;
  name: string;
  price: number;
  reason: string;
}

export default function AiSearchModal({ isOpen, onClose }: AiSearchModalProps) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<RecommendedProduct[]>([]);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  if (!isOpen) return null;

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setRecommendations([]);
    setShowResult(false);

    try {
      const response = await fetch("/api/ai-filter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: query }),
      });

      const data = await response.json();

      if (data.recommendations && data.recommendations.length > 0) {
        setRecommendations(data.recommendations);
        setShowResult(true);
      } else {
        alert("Não encontrei produtos exatos para essa descrição no estoque. Tente termos mais gerais.");
      }

    } catch (error) {
      console.error("Erro:", error);
      alert("Ocorreu um erro ao buscar recomendações.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setQuery("");
    setRecommendations([]);
    setShowResult(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-300">
      
      <div 
        className="relative w-full max-w-2xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-zinc-700/50 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()} 
      >
        
        {/* Cabeçalho */}
        <div className="flex justify-between items-center p-6 border-b border-zinc-200/50 dark:border-zinc-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-xl shadow-lg shadow-blue-500/20 text-white">
              <Bot size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-800 dark:text-white tracking-tight">
                Tech Guide AI
              </h2>
              <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">
                Personal Shopper
              </p>
            </div>
          </div>
          
          <button 
            onClick={handleClose} 
            className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-all"
          >
            <X size={24} />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          
          {!showResult && !loading && (
            <div className="mb-6 text-center space-y-2 animate-in fade-in duration-500">
              <Sparkles className="w-12 h-12 text-yellow-500 mx-auto opacity-80 mb-4" />
              <h3 className="text-lg font-semibold text-zinc-700 dark:text-zinc-200">
                Como posso te ajudar hoje?
              </h3>
              <p className="text-sm text-zinc-500 max-w-sm mx-auto">
                Descreva o que procura (ex: "PC gamer barato", "Mouse leve") e eu analiso nosso estoque para você.
              </p>
            </div>
          )}

          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl opacity-20 group-focus-within:opacity-100 transition duration-500 blur"></div>
            <div className="relative bg-white dark:bg-zinc-950 rounded-xl p-1">
              <textarea
                className="w-full h-24 p-4 rounded-lg bg-transparent border-none outline-none resize-none text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 text-lg leading-relaxed"
                placeholder="Ex: Quero um notebook gamer que rode GTA V e custe até 4000 reais..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSearch();
                  }
                }}
              />
              
              <div className="flex justify-between items-center px-2 pb-2 mt-2 border-t border-zinc-100 dark:border-zinc-800/50 pt-2">
                <span className="text-xs text-zinc-400 font-medium hidden sm:block">
                  Pressione <kbd className="font-sans px-1 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700">Enter</kbd> para enviar
                </span>
                
                <button
                  onClick={handleSearch}
                  disabled={loading || !query.trim()}
                  className="w-full sm:w-auto px-6 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg font-bold flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      Pesquisar <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Resultados */}
          {showResult && (
            <div className="mt-8 space-y-4 animate-in slide-in-from-bottom-10 duration-500">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800"></div>
                <span className="text-xs font-bold uppercase text-zinc-400 tracking-widest">
                  Recomendações
                </span>
                <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800"></div>
              </div>
              
              <div className="grid gap-4">
                {recommendations.map((item, index) => (
                  <Link 
                    key={item.id} 
                    href={`/busca?q=${encodeURIComponent(item.name)}`} 
                    onClick={handleClose}
                    className="group relative flex flex-col sm:flex-row items-start sm:items-center gap-5 p-5 rounded-2xl bg-white dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-700 hover:border-blue-500/50 dark:hover:border-blue-500/50 transition-all hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1 overflow-hidden"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-blue-500 to-purple-600 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>

                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-300">
                      <ShoppingBag size={24} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start flex-wrap gap-2">
                        <h4 className="font-bold text-lg text-zinc-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate w-full sm:w-auto">
                          {item.name}
                        </h4>
                        <span className="font-bold text-sm text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-full border border-emerald-100 dark:border-emerald-800">
                          R$ {item.price.toFixed(2)}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
                        <span className="text-blue-500 font-medium">Por que escolhi: </span> 
                        {item.reason}
                      </p>
                    </div>
                    
                    <div className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full bg-zinc-50 dark:bg-zinc-800 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <ChevronRight size={18} />
                    </div>
                  </Link>
                ))}
              </div>

              <div className="text-center mt-6 flex justify-center gap-4">
                 <button 
                  onClick={() => {
                    setQuery("");
                    setShowResult(false);
                  }}
                  className="text-sm text-zinc-400 hover:text-blue-500 transition-colors underline decoration-dotted"
                >
                  Nova pergunta
                </button>
              </div>
            </div>
          )}

          {/* Botão de Fechar Extra no final (Mobile Friendly) */}
          <div className="mt-8 border-t border-zinc-100 dark:border-zinc-800/50 pt-4 flex justify-center">
            <button 
              onClick={handleClose}
              className="text-sm font-medium text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 px-4 py-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Fechar Janela
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}