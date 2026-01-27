"use client";

import { Star, Eye, Heart, ShoppingBag, Share2 } from "lucide-react";
import { useFavorites } from "@/context/FavoritesContext";
import Link from "next/link";
import OneSignal from 'react-onesignal'; // <--- 1. IMPORTAMOS AQUI

interface ProductCardProps {
  product: any;
  onOpenReview: (product: any) => void;
}

export default function ProductCard({ product, onOpenReview }: ProductCardProps) {
  
  if (!product) return null;

  const { isFavorite, toggleFavorite } = useFavorites();
  const productId = product.id;

  // --- TRATAMENTO DE DADOS ---
  const price = Number(product.price) || 0;
  const originalPrice = Number(product.original_price || product.originalPrice) || 0;
  const description = product.short_description || product.shortDescription || product.fullReview?.content || "Sem descrição.";
  
  // Link e Categoria
  const link = product.link || product.affiliateLink || "#";
  const category = product.category || "Geral";
  const rating = Number(product.rating) || 4.5;

  // Cálculo do Desconto
  const hasDiscount = originalPrice > price;
  const discountPercent = hasDiscount 
    ? Math.round(((originalPrice - price) / originalPrice) * 100) 
    : 0;

  const favorite = isFavorite(productId);

  // --- CONFIGURAÇÃO DO BOTÃO (SÓ MERCADO LIVRE) ---
  const isAvailable = link !== "#";

  const btnStyle = isAvailable 
    ? "bg-[#FFE600] hover:bg-[#F2DB00] text-[#2D3277] shadow-yellow-900/20" 
    : "bg-zinc-800 cursor-not-allowed text-zinc-600";

  const btnText = isAvailable ? "Mercado Livre" : "Indisponível";

  // --- FUNÇÃO: RASTREAR INTERESSE (TAGGING) ---
  const handleBuyClick = () => {
      try {
          // Se o usuário clicar, marcamos que ele gosta dessa categoria
          const tagInterest = category.toLowerCase().split(' ')[0]; // Pega 'celulares' de 'Celulares Samsung'
          console.log(`🏷️ OneSignal: Marcando interesse em '${tagInterest}'`);
          OneSignal.User.addTag("interest", tagInterest);
      } catch (e) {
          // Falha silenciosa para não atrapalhar o clique
      }
  };

  // --- FUNÇÃO DE COMPARTILHAR ---
  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault(); 
    e.stopPropagation();

    // Gera o link interno do seu site
    const internalUrl = `${window.location.origin}/produto/${productId}`;

    if (navigator.share) {
        navigator.share({
            title: product.title,
            text: `Olha essa oferta que achei no Tech Guide: ${product.title} por R$ ${price}`,
            url: internalUrl
        }).catch(console.error);
    } else {
        navigator.clipboard.writeText(internalUrl);
        alert("Link do produto copiado! Pode colar no WhatsApp.");
    }
  };

  return (
    <div className="group bg-zinc-900 rounded-xl border border-zinc-800 hover:border-[#FFE600]/50 transition-all duration-300 hover:shadow-xl hover:shadow-yellow-900/10 flex flex-col overflow-hidden h-full relative">
      
      {/* --- BOTÕES FLUTUANTES (SHARE + FAVORITO) --- */}
      <div className="absolute top-3 right-3 z-20 flex gap-2">
          
          {/* Botão Compartilhar */}
          <button 
            onClick={handleShare}
            className="p-2 rounded-full bg-black/50 backdrop-blur-md shadow-sm hover:scale-110 transition-transform hover:bg-blue-600 text-zinc-300 hover:text-white"
            title="Compartilhar oferta"
          >
            <Share2 size={18} />
          </button>

          {/* Botão Favoritar */}
          <button 
            onClick={(e) => {
              e.stopPropagation(); 
              toggleFavorite(product);
            }}
            className="p-2 rounded-full bg-black/50 backdrop-blur-md shadow-sm hover:scale-110 transition-transform hover:bg-black"
          >
            <Heart 
              size={18} 
              className={`transition-colors duration-300 ${favorite ? 'fill-red-500 text-red-500' : 'text-zinc-400 hover:text-red-400'}`} 
            />
          </button>
      </div>

      {/* ÁREA DA IMAGEM */}
      <Link href={`/produto/${productId}`} className="relative aspect-[4/3] p-4 bg-white flex items-center justify-center overflow-hidden cursor-pointer">
        
        {/* Etiqueta de Desconto */}
        {hasDiscount && discountPercent > 0 && (
          <div className="absolute top-3 left-3 z-20 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-md animate-in fade-in zoom-in">
            {discountPercent}% OFF
          </div>
        )}

        <div className="relative w-full h-full transition-transform duration-500 group-hover:scale-105">
            {product.image ? (
                <img 
                  src={product.image} 
                  alt={product.title || "Produto"}
                  className="w-full h-full object-contain p-2"
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl">📦</div>
            )}
        </div>
        
        {/* Nota flutuante */}
        <div className="absolute bottom-2 right-2 bg-zinc-900/90 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 z-10 shadow-sm border border-zinc-700">
          <Star size={12} className="fill-yellow-400 text-yellow-400" />
          {rating.toFixed(1)}
        </div>
      </Link>

      {/* CONTEÚDO DO CARD */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Categoria */}
        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1 truncate">
          {category}
        </span>
        
        {/* Título */}
        <Link href={`/produto/${productId}`} className="font-bold text-sm leading-tight mb-2 text-zinc-100 group-hover:text-[#FFE600] transition-colors line-clamp-2 min-h-[2.5rem]" title={product.title}>
          {product.title}
        </Link>
        
        {/* DESCRIÇÃO */}
        <p className="text-xs text-zinc-400 line-clamp-2 mb-4 min-h-[2rem] leading-relaxed">
          {description}
        </p>

        {/* ÁREA DE PREÇO */}
        <div className="mt-auto mb-4 border-t border-zinc-800/50 pt-3">
          {hasDiscount && (
            <span className="text-xs text-zinc-500 line-through block mb-0.5">
              De: R$ {originalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          )}
          
          <div className="flex items-end gap-2 flex-wrap justify-between">
            <div className="flex flex-col">
                <span className="text-lg font-bold text-white">
                R$ {price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] text-green-400 font-medium">
                à vista no Pix
                </span>
            </div>
          </div>
        </div>

        {/* BOTÕES */}
        <div className="grid grid-cols-2 gap-2 mt-auto">
          <button 
            onClick={() => onOpenReview(product)}
            className="flex items-center justify-center gap-2 px-3 py-2 border border-zinc-700 rounded-lg text-xs font-bold text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            <Eye size={14} /> Análise
          </button>
          
          {/* BOTÃO ÚNICO MERCADO LIVRE + CLICK TRACKING */}
          <a 
            href={link}
            target={isAvailable ? "_blank" : "_self"} 
            rel="noopener noreferrer nofollow"
            onClick={handleBuyClick} // <--- 2. ADICIONAMOS O EVENTO AQUI
            className={`flex items-center justify-center gap-2 px-3 py-2 font-bold rounded-lg transition-colors shadow-sm hover:shadow-md text-xs ${btnStyle}`}
          >
            <ShoppingBag size={14} />
            {btnText}
          </a>
        </div>
      </div>
    </div>
  );
}