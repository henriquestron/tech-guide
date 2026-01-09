"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';

interface FavoritesContextType {
  favorites: string[]; // Lista de IDs dos produtos
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>([]);

  // Carregar do LocalStorage ao iniciar
  useEffect(() => {
    const stored = localStorage.getItem('techguide_favorites');
    if (stored) {
      setFavorites(JSON.parse(stored));
    }
  }, []);

  // Função para adicionar/remover
  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const isAlreadyFavorite = prev.includes(id);
      let newFavorites;
      
      if (isAlreadyFavorite) {
        newFavorites = prev.filter((favId) => favId !== id); // Remove
      } else {
        newFavorites = [...prev, id]; // Adiciona
      }
      
      localStorage.setItem('techguide_favorites', JSON.stringify(newFavorites));
      return newFavorites;
    });
  };

  const isFavorite = (id: string) => favorites.includes(id);

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error("useFavorites deve ser usado dentro de um FavoritesProvider");
  return context;
}