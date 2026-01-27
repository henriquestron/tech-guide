'use client';
import { useEffect } from 'react';
import OneSignal from 'react-onesignal';

// Esse componente marca o usuário com o termo que ele buscou
export default function InterestTracker({ term }: { term: string }) {
  useEffect(() => {
    if (term && term.length > 2) {
      try {
        // Ex: Se buscou "iphone 13", marca a tag "search_term" = "iphone"
        // Pegamos só a primeira palavra pra ser mais genérico
        const mainInterest = term.split(' ')[0].toLowerCase();
        
        console.log(`🏷️ Marcando interesse do usuário em: ${mainInterest}`);
        
        OneSignal.User.addTag("interest", mainInterest);
      } catch (e) {
        console.error("Erro ao taggear usuário no OneSignal");
      }
    }
  }, [term]);

  return null;
}