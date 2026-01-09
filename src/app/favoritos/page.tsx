"use client";
import { useFavorites } from "@/context/FavoritesContext";
import { products } from "@/data/products";
import ProductCard from "@/components/ProductCard";
import ReviewModal from "@/components/ReviewModal";
import { useState } from "react";
import { Product } from "@/types";
import { Heart, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function FavoritesPage() {
  const { favorites } = useFavorites();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filtra apenas os produtos que estão na lista de favoritos
  const favoriteProducts = products.filter(p => favorites.includes(p.id));

  const handleOpenReview = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black pt-8 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="mb-8 border-b border-zinc-200 dark:border-zinc-800 pb-4 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <Heart className="fill-red-500 text-red-500" />
            Meus Favoritos
          </h1>
          <Link href="/" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
            <ArrowLeft size={16}/> Voltar às compras
          </Link>
        </div>

        {favoriteProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {favoriteProducts.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onOpenReview={handleOpenReview} 
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-zinc-900 rounded-xl shadow-sm">
            <div className="bg-zinc-100 dark:bg-zinc-800 p-6 rounded-full mb-4">
              <Heart size={48} className="text-zinc-300 dark:text-zinc-600" />
            </div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">
              Sua lista está vazia
            </h2>
            <p className="text-zinc-500 mb-6 max-w-sm">
              Você ainda não favoritou nenhum item. Navegue pelas categorias e clique no coração para salvar o que gostar!
            </p>
            <Link 
              href="/" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Explorar Produtos
            </Link>
          </div>
        )}

        <ReviewModal 
          product={selectedProduct} 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
        />
      </div>
    </div>
  );
}