"use client";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { products } from "@/data/products";
import ProductCard from "@/components/ProductCard";
import ReviewModal from "@/components/ReviewModal";
import { Product } from "@/types";

export default function CategoryPage() {
  const params = useParams();
  
  // Garante que seja string
  const categorySlug = typeof params?.category === 'string' ? params.category : '';

  // Filtra os produtos
  const filteredProducts = products.filter(p => p.category === categorySlug);

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
          <h1 className="text-3xl font-bold capitalize text-zinc-900 dark:text-white">
            {categorySlug === 'pecas' ? 'Peças de PC' : categorySlug}
          </h1>
          <p className="text-zinc-500 mt-1">
            {filteredProducts.length > 0 
              ? `${filteredProducts.length} produtos encontrados` 
              : "Nenhum produto encontrado nesta categoria"}
          </p>
        </div>

        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onOpenReview={handleOpenReview} 
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-zinc-900 rounded-xl border border-dashed border-zinc-300">
            <h2 className="text-xl font-bold text-zinc-600 mb-2">Ops! Categoria Vazia.</h2>
            <p className="text-zinc-500 mb-4 text-center max-w-md">
              Não encontramos produtos marcados como <strong>"{categorySlug}"</strong> no arquivo products.ts.
            </p>
          </div>
        )}
      </div>

      {/* --- A CORREÇÃO ESTÁ AQUI EMBAIXO --- */}
      <ReviewModal 
        product={selectedProduct} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        // Adicionamos esta linha: quando o modal pedir para trocar, atualizamos o estado
        onSwitchProduct={(newProduct) => setSelectedProduct(newProduct)} 
      />
    </div>
  );
}