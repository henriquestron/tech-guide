"use client"; // <--- Isso habilita a interatividade (clicks e estados)

import { useState } from "react";
import ProductCard from "@/components/ProductCard";
// IMPORTANTE: Verifique se o caminho do seu ReviewModal está correto:
import ReviewModal from "@/components/ReviewModal"; 

interface ProductShowcaseProps {
  products: any[];
}

export default function ProductShowcase({ products }: ProductShowcaseProps) {
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Função que o ProductCard está pedindo e que estava faltando
  const handleOpenReview = (product: any) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseReview = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  return (
    <div className="min-h-screen bgblack text-white pb-12"> 
      {/* ^^^ Mudei para bg-gray-900 (Escuro) e text-white */}

      {/* Hero / Cabeçalho */}
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
        {/* Contador de Ofertas */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-white border-l-4 border-blue-500 pl-3">
            Destaques
          </h2>
          <span className="bg-gray-800 text-blue-400 text-sm font-medium px-3 py-1 rounded-full border border-gray-700">
            Total: {products.length} produtos
          </span>
        </div>

        {/* GRID DE PRODUTOS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product, index) => (
            <ProductCard 
              key={`${product.id}-${index}`} 
              product={product} 
              onOpenReview={handleOpenReview} // <--- AQUI ESTÁ A CORREÇÃO DO ERRO
            />
          ))}
        </div>

        {products.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            Nenhum produto encontrado.
          </div>
        )}
      </div>

      {/* MODAL DE REVIEW */}
      {selectedProduct && (
        <ReviewModal
          isOpen={isModalOpen}
          onClose={handleCloseReview}
          product={selectedProduct}
        />
      )}
    </div>
  );
}