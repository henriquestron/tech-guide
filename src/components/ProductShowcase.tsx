"use client";

import { useState } from "react";
import ProductCard from "@/components/ProductCard";
import ReviewModal from "@/components/ReviewModal";
// import { Product } from "@/types"; // Descomente se tiver o tipo

interface ProductShowcaseProps {
  products: any[];
}

export default function ProductShowcase({ products }: ProductShowcaseProps) {
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenReview = (product: any) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseReview = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  // Proteção Extra: Se products vier nulo/undefined, usa array vazio
  const safeProducts = Array.isArray(products) ? products : [];

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-12">
      
      {/* Hero */}
      <div className="bg-blue-700 py-16 mb-10 shadow-lg shadow-blue-900/20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">
            TechGuide Ofertas
          </h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            As melhores escolhas tech com curadoria humana e IA.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4">
        {/* Contador */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-white border-l-4 border-blue-500 pl-3">
            Destaques
          </h2>
          <span className="bg-zinc-800 text-blue-400 text-sm font-medium px-3 py-1 rounded-full border border-zinc-700">
            Total: {safeProducts.length} produtos
          </span>
        </div>

        {/* GRID DE PRODUTOS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {safeProducts.map((product, index) => {
            // --- BLINDAGEM AQUI ---
            // Se o produto for nulo, ou não tiver ID, pula ele (retorna null)
            if (!product || !product.id) return null;

            return (
              <ProductCard 
                key={`${product.id}-${index}`} 
                product={product} 
                onOpenReview={handleOpenReview} 
              />
            );
          })}
        </div>

        {safeProducts.length === 0 && (
          <div className="text-center py-20 text-zinc-500 border border-dashed border-zinc-800 rounded-xl mt-8">
            <p className="text-lg">Nenhum produto encontrado.</p>
          </div>
        )}
      </div>

      {selectedProduct && (
        <ReviewModal
          isOpen={isModalOpen}
          onClose={handleCloseReview}
          product={selectedProduct}
          allProducts={safeProducts}
          onSwitchProduct={(newProduct) => setSelectedProduct(newProduct)}
        />
      )}
    </div>
  );
}