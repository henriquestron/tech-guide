"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { products } from "@/data/products";
import ProductCard from "@/components/ProductCard";
import ReviewModal from "@/components/ReviewModal";
import { Product } from "@/types";
import { SearchX, Search } from "lucide-react";

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (query) {
      const lowerQuery = query.toLowerCase();
      const results = products.filter((product) => {
        return (
          product.title.toLowerCase().includes(lowerQuery) ||
          product.category.toLowerCase().includes(lowerQuery) ||
          product.shortDescription.toLowerCase().includes(lowerQuery) ||
          product.brand?.toLowerCase().includes(lowerQuery)
        );
      });
      setFilteredProducts(results);
    } else {
      setFilteredProducts([]);
    }
  }, [query]);

  const handleOpenReview = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="mb-8 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
          <Search className="text-blue-600" />
          Resultados para "{query}"
        </h1>
        <p className="text-zinc-500 mt-1">
          {filteredProducts.length} produtos encontrados
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
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="bg-zinc-100 dark:bg-zinc-900 p-6 rounded-full mb-4">
            <SearchX size={48} className="text-zinc-400" />
          </div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
            Nenhum produto encontrado.
          </h2>
          <p className="text-zinc-500 max-w-md">
            Tente buscar por termos mais genéricos como "Samsung", "Gamer" ou "4K".
          </p>
        </div>
      )}

      {/* --- A CORREÇÃO ESTÁ AQUI EMBAIXO --- */}
      <ReviewModal 
        product={selectedProduct} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSwitchProduct={(newProduct) => setSelectedProduct(newProduct)} 
      />
    </>
  );
}

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black pt-8 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Suspense fallback={<div className="text-center py-20">Carregando busca...</div>}>
          <SearchResults />
        </Suspense>
      </div>
    </div>
  );
}