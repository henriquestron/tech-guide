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
  
  // 🛑 1. CLÁUSULA DE GUARDA (PRIMEIRA LINHA)
  // Se o produto não existir ou for nulo, cancela o desenho do card.
  if (!product) return null;

  const { isFavorite, toggleFavorite } = useFavorites();
  
  // --- EXTRAÇÃO E TRATAMENTO DE DADOS ---

  // ID Seguro
  const productId = product.id;
  
  // Preços Seguros (Number ou 0)
  const price = typeof product.price === 'number' ? product.price : Number(product.price) || 0;
  const originalPrice = typeof product.originalPrice === 'number' ? product.originalPrice : Number(product.originalPrice) || 0;
  
  // 🔗 2. BLINDAGEM DO LINK (A CORREÇÃO DO ERRO VERMELHO)
  // Tenta pegar o affiliateLink ou link.
  // @ts-ignore (Ignora erro de tipo caso sua interface não tenha todos os campos)
  const rawLink = product.affiliateLink || product.link;
  
  // Verifica se é uma string válida e não vazia. Se não for, coloca "#" para o HTML não quebrar.
  const finalLink = (typeof rawLink === 'string' && rawLink.trim() !== '') 
    ? rawLink 
    : "#";

  // Favorito
  const favorite = isFavorite(productId);

  // Cálculo de Desconto
  const hasDiscount = originalPrice > price;
  const discountPercent = hasDiscount && originalPrice > 0
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  return (
    <div className="group bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 dark:hover:border-blue-500 transition-all duration-300 hover:shadow-lg flex flex-col overflow-hidden h-full relative">
      
      {/* Botão Favoritar */}
      <button 
        onClick={(e) => {
          e.stopPropagation(); 
          toggleFavorite(product);
        }}
        className="absolute top-3 right-3 z-20 p-2 rounded-full bg-white/80 dark:bg-black/50 backdrop-blur-sm shadow-sm hover:scale-110 transition-transform group-hover:bg-white group-hover:dark:bg-black"
        title={favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
      >
        <Heart 
          size={20} 
          className={`transition-colors duration-300 ${favorite ? 'fill-red-500 text-red-500' : 'text-zinc-400 hover:text-red-400'}`} 
        />
      </button>

      {/* Container da Imagem */}
      <div className="relative aspect-[4/3] p-4 bg-white flex items-center justify-center overflow-hidden">
        {hasDiscount && (
          <div className="absolute top-3 left-3 z-20 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-md">
            {discountPercent}% OFF
          </div>
        )}

        <div className="relative w-full h-full transition-transform duration-500 group-hover:scale-105">
            <Image 
              src={product.image || "/placeholder.png"} 
              alt={product.title || "Produto"}
              fill 
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-contain p-2"
            />
        </div>
        
        <div className="absolute bottom-2 right-2 bg-zinc-900/90 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 z-10 shadow-sm">
          <Star size={12} className="fill-yellow-400 text-yellow-400" />
          {product.rating?.toFixed(1) || 4.5}
        </div>
      </div>

      {/* Conteúdo */}
      <div className="p-5 flex-1 flex flex-col">
        <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1 truncate">
          {product.category || "Geral"}
        </span>
        
        <h3 className="font-bold text-lg leading-tight mb-2 text-zinc-800 dark:text-zinc-100 group-hover:text-blue-600 transition-colors line-clamp-2" title={product.title}>
          {product.title || "Produto sem título"}
        </h3>
        
        <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-4 h-10">
          {product.shortDescription || "Sem descrição disponível."}
        </p>

        {/* Preço */}
        <div className="mt-auto mb-4">
          {hasDiscount && (
            <span className="text-xs text-zinc-400 line-through block">
              De: R$ {originalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          )}
          <div className="flex items-end gap-2 flex-wrap">
            <span className="text-xl font-bold text-zinc-900 dark:text-white">
              R$ {price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-xs text-green-600 font-medium mb-1 bg-green-100 dark:bg-green-900/30 px-1 rounded">
              à vista
            </span>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex gap-2 mt-auto">
          <button 
            onClick={() => onOpenReview(product)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <Eye size={16} /> <span className="hidden sm:inline">Ver</span>
            <span className="sm:inline md:hidden">Ver</span>
          </button>
          
          <a 
            href={finalLink}
            target={finalLink !== "#" ? "_blank" : "_self"} // Só abre nova aba se tiver link real
            rel="noopener noreferrer nofollow"
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 font-bold rounded-lg transition-colors shadow-sm hover:shadow-md 
              ${finalLink === "#" 
                ? "bg-gray-300 cursor-not-allowed text-gray-600" // Estilo desabilitado se não tiver link
                : "bg-yellow-400 hover:bg-yellow-500 text-zinc-900 active:scale-95 transform duration-100"
              }`}
          >
            <ShoppingCart size={18} />
            <span>Comprar</span>
          </a>
        </div>
      </div>
    </div>
  );
}