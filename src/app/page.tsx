"use client";
import { useState } from 'react';
import { products } from '@/data/products';
import ProductCard from '@/components/ProductCard';
import ReviewModal from '@/components/ReviewModal';
import { Product } from '@/types';
import { Sparkles } from 'lucide-react';

export default function Home() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenReview = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black pb-20">
      
      {/* --- HERO SECTION --- */}
      <section className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 py-16 px-4 mb-10 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-sm font-medium mb-4">
            <Sparkles size={16} />
            <span>Guia Atualizado 2026</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-zinc-900 dark:text-white mb-4">
            Tecnologia com <span className="text-blue-600">Preço Justo.</span>
          </h1>
          <p className="text-lg text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto">
            Nós analisamos centenas de produtos para que você compre apenas o que vale a pena. 
            Reviews imparciais e links seguros.
          </p>
        </div>
      </section>

      {/* --- LISTA DE PRODUTOS --- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            🔥 Últimas Análises
          </h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onOpenReview={handleOpenReview} 
            />
          ))}
        </div>
      </div>

      {/* --- MODAL COM A CORREÇÃO --- */}
      <ReviewModal 
        product={selectedProduct} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        // 👇 A MÁGICA ESTÁ AQUI:
        onSwitchProduct={(newProduct) => setSelectedProduct(newProduct)} 
      />
    </div>
  );
}