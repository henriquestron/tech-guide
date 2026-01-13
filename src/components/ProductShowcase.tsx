"use client";

import { useState, useMemo } from "react";
import ProductCard from "@/components/ProductCard";
import ReviewModal from "@/components/ReviewModal";
import { Sparkles, Zap, Gamepad2, Smartphone, Grid, ArrowRight } from "lucide-react";

interface ProductShowcaseProps {
  products: any[];
}

export default function ProductShowcase({ products }: ProductShowcaseProps) {
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // --- ALGORTIMOS DE CURADORIA (IA Lógica) ---
  // Usamos useMemo para não recalcular toda vez que abrir um modal
  const { bestDeals, topRated, gamerSetup, appleStore, safeProducts } = useMemo(() => {
    const safe = Array.isArray(products) ? products : [];

    // 1. Melhores Ofertas (Maior % de desconto)
    const deals = [...safe]
      .filter(p => p.original_price > p.price)
      .sort((a, b) => {
        const discountA = ((a.original_price - a.price) / a.original_price);
        const discountB = ((b.original_price - b.price) / b.original_price);
        return discountB - discountA; // Maior desconto primeiro
      })
      .slice(0, 5); // Top 5

    // 2. Escolhas da IA (Nota alta)
    const rated = [...safe]
      .filter(p => p.rating >= 4.7)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 5);

    // 3. Setup Gamer (Categorias específicas)
    const gamer = safe.filter(p => 
      ['games', 'pecas'].includes(p.category) || 
      p.subcategory === 'gamer' || 
      p.subcategory === 'placa-video' ||
      p.subcategory === 'mouse'
    ).slice(0, 6);

    // 4. Apple Store (Busca por marca ou nome)
    const apple = safe.filter(p => 
      p.title.toLowerCase().includes('iphone') || 
      p.title.toLowerCase().includes('macbook') ||
      p.title.toLowerCase().includes('apple')
    ).slice(0, 6);

    return { 
      bestDeals: deals, 
      topRated: rated, 
      gamerSetup: gamer, 
      appleStore: apple,
      safeProducts: safe 
    };
  }, [products]);

  const handleOpenReview = (product: any) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseReview = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  // Componente interno para Seções (Carrossel Horizontal)
  const ProductSection = ({ title, icon: Icon, items, colorClass }: any) => {
    if (!items || items.length === 0) return null;
    
    return (
      <section className="mb-12 animate-in slide-in-from-bottom-4 duration-700">
        <div className="flex items-center justify-between mb-4 px-2">
          <h2 className={`text-xl md:text-2xl font-bold flex items-center gap-2 ${colorClass}`}>
            <Icon size={24} /> {title}
          </h2>
          <span className="text-xs font-medium text-zinc-500 bg-zinc-900/50 px-3 py-1 rounded-full border border-zinc-800">
            {items.length} itens
          </span>
        </div>
        
        {/* Container de Scroll Horizontal */}
        <div className="flex overflow-x-auto pb-6 gap-4 snap-x snap-mandatory custom-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
          {items.map((product: any, idx: number) => (
            <div key={`${title}-${product.id}-${idx}`} className="snap-center shrink-0 w-[280px] md:w-[320px]">
              <ProductCard product={product} onOpenReview={handleOpenReview} />
            </div>
          ))}
          
          {/* Card de "Ver Mais" no final do carrossel */}
          <div className="snap-center shrink-0 w-[100px] flex flex-col items-center justify-center text-zinc-500 hover:text-white transition-colors cursor-pointer group">
            <div className="w-12 h-12 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center mb-2 group-hover:bg-blue-600 group-hover:border-blue-500 transition-colors">
              <ArrowRight />
            </div>
            <span className="text-sm font-medium">Ver tudo</span>
          </div>
        </div>
      </section>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-20">
      
      {/* Hero Section Renovado */}
      <div className="relative bg-gradient-to-b from-blue-900 via-blue-900/20 to-zinc-950 py-20 mb-8 border-b border-white/5">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <span className="inline-block py-1 px-3 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold tracking-wider mb-4 uppercase">
            Curadoria por IA 🤖
          </span>
          <h1 className="text-4xl md:text-6xl font-black mb-4 text-white tracking-tight">
            TechGuide <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Store</span>
          </h1>
          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Nossa Inteligência Artificial analisa milhares de produtos para encontrar o melhor custo-benefício para você.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4">
        
        {/* SEÇÃO 1: Melhores Ofertas (Vermelho/Laranja) */}
        <ProductSection 
          title="Ofertas Imperdíveis" 
          icon={Zap} 
          items={bestDeals} 
          colorClass="text-orange-500"
        />

        {/* SEÇÃO 2: Escolhas da IA (Roxo/Azul) */}
        <ProductSection 
          title="Top Rated by IA" 
          icon={Sparkles} 
          items={topRated} 
          colorClass="text-purple-400"
        />

        {/* SEÇÃO 3: Gamer (Verde) */}
        <ProductSection 
          title="Setup Gamer Pro" 
          icon={Gamepad2} 
          items={gamerSetup} 
          colorClass="text-emerald-400"
        />

         {/* SEÇÃO 4: Apple (Cinza/Branco) */}
         <ProductSection 
          title="Ecossistema Apple" 
          icon={Smartphone} 
          items={appleStore} 
          colorClass="text-zinc-100"
        />

        {/* DIVISOR */}
        <div className="my-16 flex items-center gap-4">
          <div className="h-px bg-zinc-800 flex-1"></div>
          <span className="text-zinc-500 font-medium flex items-center gap-2">
            <Grid size={18} /> Catálogo Completo
          </span>
          <div className="h-px bg-zinc-800 flex-1"></div>
        </div>

        {/* GRID GERAL (Todos os produtos) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {safeProducts.map((product, index) => {
            if (!product || !product.id) return null;
            return (
              <ProductCard 
                key={`grid-${product.id}-${index}`} 
                product={product} 
                onOpenReview={handleOpenReview} 
              />
            );
          })}
        </div>

        {safeProducts.length === 0 && (
          <div className="text-center py-20 text-zinc-500 border border-dashed border-zinc-800 rounded-xl mt-8 bg-zinc-900/50">
            <p className="text-lg">Carregando estoque ou nenhum produto encontrado...</p>
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