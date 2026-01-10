"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Product } from "@/types";

interface FavoritesContextType {
  favorites: Product[];
  toggleFavorite: (product: Product) => void;
  isFavorite: (productId: string | number) => boolean;
  clearFavorites: () => void;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

 // 1. Carregar do LocalStorage (COM FAXINA AUTOMÁTICA)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("techguide_favorites");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          
          // FAXINA: Só aceita produtos que tenham ID, Título e Imagem válidos
          // O resto (fantasmas) é descartado
          const validFavorites = Array.isArray(parsed) 
            ? parsed.filter((p: any) => p && p.id && p.title && p.image)
            : [];

          setFavorites(validFavorites);
        } catch (e) {
          console.error("Erro ao carregar favoritos:", e);
          setFavorites([]); // Se der erro no JSON, limpa tudo
        }
      }
      setIsLoaded(true);
    }
  }, []);

  // 2. Salvar no LocalStorage sempre que a lista mudar
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("techguide_favorites", JSON.stringify(favorites));
    }
  }, [favorites, isLoaded]);

  // --- A MÁGICA DA CORREÇÃO (String vs Number) ---
  
  const toggleFavorite = (product: Product) => {
    setFavorites((prev) => {
      // Verifica se já existe convertendo ambos os IDs para STRING
      // Isso resolve o problema de comparar 123 (Number) com "123" (String do Banco)
      const exists = prev.some((item) => String(item.id) === String(product.id));

      if (exists) {
        // Se existe, remove da lista
        return prev.filter((item) => String(item.id) !== String(product.id));
      } else {
        // Se não existe, adiciona
        return [...prev, product];
      }
    });
  };

  const isFavorite = (productId: string | number) => {
    // Também converte para String aqui para garantir que o coração fique vermelho
    return favorites.some((item) => String(item.id) === String(productId));
  };

  const clearFavorites = () => {
    setFavorites([]);
  };

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite, clearFavorites }}>
      {children}
    </FavoritesContext.Provider>
  );
}

// Hook para usar em qualquer lugar do site
export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error("useFavorites deve ser usado dentro de um FavoritesProvider");
  }
  return context;
}