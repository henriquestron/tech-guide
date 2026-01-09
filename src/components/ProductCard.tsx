"use client";
import { Product } from "@/types";
import { Star, Eye, ShoppingCart, Heart } from "lucide-react";
import Image from "next/image";
import { useFavorites } from "@/context/FavoritesContext";

interface ProductCardProps {
  product: Product;
  onOpenReview: (product: Product) => void;
}

export default function ProductCard({ product, onOpenReview }: ProductCardProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorite = isFavorite(product.id);

  // Lógica de cálculo de desconto
  // Só calcula se existir originalPrice e se ele for maior que o preço atual
  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  const discountPercent = hasDiscount && product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <div className="group bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 dark:hover:border-blue-500 transition-all duration-300 hover:shadow-lg flex flex-col overflow-hidden h-full relative">
      
      {/* Botão de Favoritar */}
      <button 
        onClick={(e) => {
          e.stopPropagation(); 
          toggleFavorite(product.id);
        }}
        className="absolute top-3 right-3 z-20 p-2 rounded-full bg-white/80 dark:bg-black/50 backdrop-blur-sm shadow-sm hover:scale-110 transition-transform group-hover:bg-white group-hover:dark:bg-black"
        title={favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
      >
        <Heart 
          size={20} 
          className={`transition-colors ${favorite ? 'fill-red-500 text-red-500' : 'text-zinc-400'}`} 
        />
      </button>

      {/* Container da Imagem */}
      <div className="relative aspect-[4/3] p-4 bg-white flex items-center justify-center overflow-hidden">
        
        {/* ETIQUETA DE DESCONTO (NOVA) */}
        {hasDiscount && (
          <div className="absolute top-3 left-3 z-20 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-md">
            {discountPercent}% OFF
          </div>
        )}

        <Image 
          src={product.image} 
          alt={product.title}
          fill 
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-contain p-4 transition-transform duration-500 group-hover:scale-110"
        />
        
        {/* Nota (Ajustei a posição para não ficar em cima do desconto se a tela for pequena) */}
        <div className="absolute bottom-2 right-2 bg-zinc-900/90 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 z-10">
          <Star size={12} className="fill-yellow-400 text-yellow-400" />
          {product.rating}
        </div>
      </div>

      {/* Conteúdo */}
      <div className="p-5 flex-1 flex flex-col">
        <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
          {product.category}
        </span>
        
        <h3 className="font-bold text-lg leading-tight mb-2 text-zinc-800 dark:text-zinc-100 group-hover:text-blue-600 transition-colors line-clamp-2">
          {product.title}
        </h3>
        
        <p className="text-sm text-zinc-500 line-clamp-2 mb-4">
          {product.shortDescription}
        </p>

        {/* PREÇO (NOVO) */}
        <div className="mt-auto mb-4">
          {hasDiscount && (
            <span className="text-xs text-zinc-400 line-through block">
              De: R$ {product.originalPrice?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          )}
          <div className="flex items-end gap-2">
            <span className="text-xl font-bold text-zinc-900 dark:text-white">
              R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            {hasDiscount && (
              <span className="text-xs text-green-600 font-medium mb-1">
                à vista
              </span>
            )}
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex gap-2">
          <button 
            onClick={() => onOpenReview(product)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <Eye size={16} /> <span className="hidden sm:inline">Review</span>
          </button>
          
          <a 
            href={product.affiliateLink}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-zinc-900 font-bold rounded-lg transition-colors shadow-sm hover:shadow-md"
            title="Comprar Agora no Mercado Livre"
          >
            <ShoppingCart size={18} />
            <span>Comprar</span>
          </a>
        </div>
      </div>
    </div>
  );
}