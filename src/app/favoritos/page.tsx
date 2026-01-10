"use client";

import { useFavorites } from "@/context/FavoritesContext";
import ProductCard from "@/components/ProductCard";
import ReviewModal from "@/components/ReviewModal";
import { useState } from "react";
import { Product } from "@/types";
import { HeartOff } from "lucide-react";

export default function FavoritesPage() {
  const { favorites } = useFavorites(); // Usa a lista do contexto (que já trata string/number)
  
  // Estados para o Modal
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenReview = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black pt-8 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="mb-8 border-b border-zinc-200 dark:border-zinc-800 pb-4">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            Meus Favoritos
            <span className="text-sm font-normal text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-full">
              {favorites.length}
            </span>
          </h1>
        </div>

        {favorites.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((product, index) => (
              <ProductCard 
                // Usamos index no key como fallback para evitar erros de duplicidade
                key={`${product.id}-${index}`} 
                product={product} 
                onOpenReview={handleOpenReview} 
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-zinc-400">
            <HeartOff size={64} className="mb-4 opacity-50" />
            <h2 className="text-xl font-semibold">Sua lista está vazia</h2>
            <p className="mt-2">Salve produtos clicando no coração para vê-los aqui.</p>
          </div>
        )}
      </div>

      {/* Modal também precisa estar aqui para funcionar nos favoritos */}
      {selectedProduct && (
        <ReviewModal 
          product={selectedProduct} 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)}
          // Nos favoritos, a recomendação pode ser baseada na lista de favoritos mesmo
          allProducts={favorites} 
          onSwitchProduct={(p) => setSelectedProduct(p)} 
        />
      )}
    </div>
  );
}