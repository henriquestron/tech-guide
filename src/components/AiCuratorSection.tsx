"use client";

import { useEffect, useState } from "react";
import ProductCard from "@/components/ProductCard";
import ReviewModal from "@/components/ReviewModal";
import { Loader2, Zap } from "lucide-react";

export default function AiCuratorSection({ allProducts }: { allProducts: any[] }) {
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    async function fetchCuradoria() {
      try {
        const res = await fetch('/api/ai-curator', { method: 'POST' });
        const data = await res.json();
        if (data.collections) setCollections(data.collections);
      } catch (e) {
        console.error("Falha ao carregar curadoria", e);
      } finally {
        setLoading(false);
      }
    }
    fetchCuradoria();
  }, []);

  const handleOpenReview = (product: any) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  if (loading) return (
    <div className="py-12 text-center text-zinc-500 flex flex-col items-center gap-2">
        <Loader2 className="animate-spin text-blue-500" />
        <p className="text-sm animate-pulse">A IA está escolhendo as melhores ofertas do dia...</p>
    </div>
  );

  if (collections.length === 0) return null;

  return (
    <div className="space-y-16 py-8">
        {collections.map((collection, idx) => {
            // Filtra os produtos reais baseados nos IDs que a IA escolheu
            const collectionProducts = allProducts.filter(p => collection.productIds.includes(p.id));
            
            if (collectionProducts.length === 0) return null;

            // Verifica se é coleção de oferta relâmpago pelo título ou emoji
            const isFlashCollection = collection.title.toLowerCase().includes('corra') || collection.emoji === '🔥';

            return (
                <section key={idx} className="animate-in fade-in duration-1000">
                    <div className="mb-6 px-4 text-center md:text-left">
                        <span className={`text-xs font-bold uppercase tracking-widest mb-1 block ${isFlashCollection ? 'text-orange-500' : 'text-blue-400'}`}>
                            {isFlashCollection ? '⚡ OPORTUNIDADE ÚNICA' : 'RECOMENDAÇÃO DO DIA'}
                        </span>
                        <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center justify-center md:justify-start gap-2">
                            <span>{collection.emoji}</span> {collection.title}
                        </h2>
                        <p className="text-zinc-400 mt-1 max-w-2xl text-sm md:text-base mx-auto md:mx-0">
                            {collection.description}
                        </p>
                    </div>

                    {/* Grid de Produtos */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-4">
                        {collectionProducts.map(product => (
                            <div key={product.id} className={isFlashCollection ? "relative ring-2 ring-orange-500/20 rounded-xl" : ""}>
                                {isFlashCollection && (
                                    <div className="absolute -top-3 -right-3 z-10 bg-orange-600 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg flex items-center gap-1 animate-bounce">
                                        <Zap size={10} fill="currentColor"/> 24H
                                    </div>
                                )}
                                <ProductCard 
                                    product={product} 
                                    onOpenReview={handleOpenReview} 
                                />
                            </div>
                        ))}
                    </div>
                </section>
            );
        })}

        {selectedProduct && (
            <ReviewModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            product={selectedProduct}
            allProducts={allProducts}
            onSwitchProduct={setSelectedProduct}
            />
        )}
    </div>
  );
}