"use client";

import { useEffect, useState } from "react";
import ProductCard from "@/components/ProductCard";
import ReviewModal from "@/components/ReviewModal";
import { Sparkles, Loader2 } from "lucide-react";

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
        <p className="text-sm animate-pulse">A IA está analisando as melhores ofertas para você...</p>
    </div>
  );

  if (collections.length === 0) return null;

  return (
    <div className="space-y-16 py-8">
        {collections.map((collection, idx) => {
            // Filtra os produtos reais baseados nos IDs que a IA escolheu
            const collectionProducts = allProducts.filter(p => collection.productIds.includes(p.id));
            
            if (collectionProducts.length === 0) return null;

            return (
                <section key={idx} className="animate-in fade-in duration-1000">
                    <div className="mb-6 px-4 text-center md:text-left">
                        <span className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1 block">
                            Recomendação do Dia
                        </span>
                        <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center justify-center md:justify-start gap-2">
                            <span>{collection.emoji}</span> {collection.title}
                        </h2>
                        <p className="text-zinc-400 mt-1 max-w-2xl text-sm md:text-base">
                            {collection.description}
                        </p>
                    </div>

                    {/* Grid de Produtos da Coleção */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-4">
                        {collectionProducts.map(product => (
                            <ProductCard 
                                key={product.id} 
                                product={product} 
                                onOpenReview={handleOpenReview} 
                            />
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